// Original local connector implemented from the public SIWC protocol.
// No DevKit implementation or existing Codex credentials are used.
import { createServer } from "node:http";
import {
  randomBytes,
  randomUUID,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { createRemoteJWKSet, jwtVerify } from "jose";

const issuer = "https://auth.openai.com";
const resource = "https://api.openai.com/v1";
const appName = "Kindred Personal Design Studio";
const permission = "chatgpt.tokens.use.direct";
const random = () => randomBytes(48).toString("base64url");
const match = (a, b) => {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    !/^[A-Za-z0-9_-]{64}$/.test(a) ||
    !/^[A-Za-z0-9_-]{64}$/.test(b)
  )
    return false;
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
const errorMessages = {
  subscription_sharing_usage_limit_exceeded:
    "Your ChatGPT usage limit was reached. Open Manage usage and try again when available.",
  subscription_sharing_usage_unavailable:
    "ChatGPT plan usage is unavailable for this connection. Open Manage usage or reconnect.",
  invalid_grant:
    "The renewable session expired or was invalidated. Reconnect with ChatGPT.",
  invalid_client:
    "OpenAI did not accept this app registration. Reconnect or check app eligibility.",
  sharing_not_enabled:
    "Sign-in succeeded without ChatGPT plan permission. Reconnect and grant plan access.",
  cancelled: "Cancelled. The previous design is retained.",
};
function failure(code, status) {
  const known = errorMessages[code];
  const message =
    known ||
    (status === 401
      ? "ChatGPT authorization expired. Reconnect."
      : status === 403
        ? "OpenAI denied this request. Check account and app eligibility."
        : status === 429
          ? "ChatGPT rate or usage limit reached. Open Manage usage."
          : "The OpenAI request failed. Retry or reconnect.");
  const e = new Error(message);
  e.code = code || "request_failed";
  return e;
}
function authEndpoint(value) {
  const u = new URL(value);
  if (u.origin !== issuer || u.username || u.password || u.hash)
    throw Error("Unexpected OpenAI authentication endpoint.");
  return u.href;
}

export async function createProvider({ storageDir, openBrowser, encryption }) {
  await mkdir(storageDir, { recursive: true, mode: 0o700 });
  const path = join(storageDir, "encrypted-session.json");
  let saved = {
    version: 1,
    host: "urn:uuid:" + randomUUID(),
    profiles: [],
    active: null,
  };
  let metadata,
    jwks,
    transaction = null,
    changing = false,
    operationEpoch = 0,
    refreshing = null,
    writes = Promise.resolve();
  const requests = new Set();
  function requireEncryption() {
    if (!encryption.available())
      throw Error(
        "OS credential encryption is unavailable. Sign-in is disabled.",
      );
  }
  async function persist() {
    requireEncryption();
    const bytes = encryption.encrypt(JSON.stringify(saved));
    const temp = path + "." + randomUUID() + ".tmp";
    const envelope = JSON.stringify({
      version: 1,
      ciphertext: Buffer.from(bytes).toString("base64"),
    });
    writes = writes
      .catch(() => {})
      .then(async () => {
        await writeFile(temp, envelope, { mode: 0o600, flag: "wx" });
        await rename(temp, path);
      });
    await writes;
  }
  try {
    const raw = await readFile(path, "utf8");
    requireEncryption();
    const envelope = JSON.parse(raw);
    saved = JSON.parse(
      encryption.decrypt(Buffer.from(envelope.ciphertext, "base64")),
    );
    if (
      saved.version !== 1 ||
      !Array.isArray(saved.profiles) ||
      !/^urn:uuid:[0-9a-f-]+$/i.test(saved.host)
    )
      throw Error("Invalid personal session file.");
  } catch (e) {
    if (e.code !== "ENOENT")
      throw Error(
        "Cannot read the protected personal session. Existing credentials were not overwritten.",
      );
  }
  const current = () => saved.profiles.find((p) => p.id === saved.active);
  const safe = () => {
    const p = current();
    return {
      status: transaction
        ? "connecting"
        : p?.tokens && !p.pending
          ? "connected"
          : p?.pending
            ? "reauth_required"
            : "disconnected",
      sharing: !!p?.tokens && !p.pending && p.scopes?.includes(permission),
      profileId: p?.id,
      identity: p?.identity || {},
      error: p?.pending
        ? {
            message:
              "Token rotation requires identity verification before use. Reconnect if recovery fails.",
          }
        : undefined,
    };
  };
  const cancelRequests = () => {
    operationEpoch++;
    for (const request of requests) request.abort();
  };
  async function fetchAuth(url, options = {}) {
    return fetch(authEndpoint(url), {
      ...options,
      redirect: "error",
      signal: options.signal || AbortSignal.timeout(30000),
    });
  }
  async function discovery() {
    if (metadata) return metadata;
    const response = await fetchAuth(
      issuer + "/.well-known/openid-configuration",
    );
    if (!response.ok) throw Error("OpenAI discovery unavailable. Try again.");
    const d = await response.json();
    if (d.issuer !== issuer) throw Error("OpenAI issuer mismatch.");
    for (const field of [
      "authorization_endpoint",
      "token_endpoint",
      "jwks_uri",
    ])
      d[field] = authEndpoint(d[field]);
    if (
      d.authorization_endpoint !== issuer + "/api/accounts/authorize" ||
      d.token_endpoint !== issuer + "/api/accounts/oauth/token"
    )
      throw Error("Unexpected OpenAI OAuth configuration.");
    if (d.revocation_endpoint)
      d.revocation_endpoint = authEndpoint(d.revocation_endpoint);
    metadata = d;
    jwks = createRemoteJWKSet(new URL(d.jwks_uri), { timeoutDuration: 30000 });
    return d;
  }
  async function verify(token, clientId, { nonce, subject, receivedAt } = {}) {
    await discovery();
    if (typeof token !== "string") throw Error("Identity token missing.");
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: clientId,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "exp", "iat"],
      clockTolerance: 5,
      ...(receivedAt ? { currentDate: new Date(receivedAt) } : {}),
    });
    if (
      !payload.sub ||
      typeof payload.sub !== "string" ||
      (nonce && !match(payload.nonce, nonce)) ||
      (subject && payload.sub !== subject)
    )
      throw Error("ChatGPT identity verification failed.");
    return {
      subject: payload.sub,
      identity: {
        name: typeof payload.name === "string" ? payload.name : "",
        email: typeof payload.email === "string" ? payload.email : "",
      },
    };
  }
  async function tokenRequest(fields) {
    const d = await discovery();
    const response = await fetchAuth(d.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams(fields),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw Error("Invalid OpenAI token response.");
    }
    if (!response.ok)
      throw failure(data.error?.code || data.error, response.status);
    if (typeof data.id_token !== "string" || typeof data.scope !== "string")
      throw Error("Missing OpenAI identity or permission information.");
    return data;
  }
  function tokenSet(data) {
    if (
      typeof data.access_token !== "string" ||
      !data.access_token ||
      data.token_type?.toLowerCase() !== "bearer" ||
      !Number.isFinite(data.expires_in) ||
      data.expires_in <= 0
    )
      throw Error("Invalid OpenAI plan token response.");
    return {
      access: data.access_token,
      refresh:
        typeof data.refresh_token === "string" ? data.refresh_token : undefined,
      idToken: data.id_token,
      expires: Date.now() + data.expires_in * 1000,
      earliestRefresh: data.earliest_refresh_at,
    };
  }
  function forget(p) {
    delete p.tokens;
    delete p.pending;
    p.scopes = [];
  }
  async function recover(p) {
    const pending = p.pending;
    const identity = await verify(pending.data.id_token, p.clientId, {
      subject: p.subject,
      receivedAt: pending.receivedAt,
    });
    const tokens = tokenSet(pending.data); // Expiry remains tied to receipt time, not retry time.
    tokens.expires = pending.receivedAt + pending.data.expires_in * 1000;
    p.tokens = tokens;
    p.scopes = pending.data.scope.split(/\s+/);
    p.identity = identity.identity;
    delete p.pending;
    await persist();
  }
  async function access() {
    const p = current();
    if (changing || transaction)
      throw Error("Finish account connection before generating.");
    if (!p?.tokens && !p?.pending)
      throw Error("Continue with ChatGPT to connect.");
    if (p.pending) await recover(p);
    if (!p.scopes.includes(permission)) throw failure("sharing_not_enabled");
    if (p.tokens.expires <= Date.now() + 60000) {
      if (!refreshing)
        refreshing = (async () => {
          if (!p.tokens.refresh)
            throw Error("Reconnect to renew ChatGPT access.");
          const earliest =
            typeof p.tokens.earliestRefresh === "number"
              ? p.tokens.earliestRefresh * 1000
              : Date.parse(p.tokens.earliestRefresh || "");
          if (Number.isFinite(earliest) && earliest > Date.now()) {
            if (p.tokens.expires > Date.now()) return;
            throw Error(
              "Token renewal is not available yet. Try again shortly.",
            );
          }
          let data;
          try {
            data = await tokenRequest({
              grant_type: "refresh_token",
              client_id: p.clientId,
              refresh_token: p.tokens.refresh,
              resource,
            });
          } catch (e) {
            if (
              [
                "invalid_grant",
                "invalid_refresh_token",
                "token_expired",
                "refresh_token_expired",
                "refresh_token_invalidated",
                "refresh_token_reused",
              ].includes(e.code)
            ) {
              forget(p);
              await persist();
            }
            throw e;
          }
          if (typeof data.refresh_token !== "string")
            throw Error(
              "OpenAI did not return the rotating refresh token. Reconnect.",
            );
          p.pending = { data, receivedAt: Date.now() };
          await persist();
          await recover(p);
        })();
      try {
        await refreshing;
      } finally {
        refreshing = null;
      }
    }
    if (p.tokens.expires <= Date.now() || !p.scopes.includes(permission))
      throw Error("ChatGPT authorization must be renewed.");
    return p.tokens.access;
  }
  async function api(path, options = {}) {
    const token = await access();
    const response = await fetch(resource + path, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: "Bearer " + token },
      redirect: "error",
      signal: options.signal || AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      let data;
      try {
        data = await response.json();
      } catch {}
      throw failure(data?.error?.code, response.status);
    }
    return response;
  }
  return {
    getSession: async () => safe(),
    listProfiles: async () =>
      saved.profiles.map((p) => ({
        id: p.id,
        label: p.label,
        identity: p.identity,
        status: p.tokens && !p.pending ? "connected" : "disconnected",
        sharing: !!p.tokens && !p.pending && p.scopes.includes(permission),
      })),
    selectProfile: async (id) => {
      if (changing || transaction || requests.size || refreshing)
        throw Error(
          "Finish or cancel the active operation before switching accounts.",
        );
      if (!saved.profiles.some((p) => p.id === id))
        throw Error("Unknown saved account.");
      cancelRequests();
      saved.active = id;
      await persist();
      return safe();
    },
    cancelSignIn() {
      transaction?.abort();
    },
    async signIn(options = {}) {
      if (changing || transaction || requests.size || refreshing)
        throw Error("Finish or cancel the active operation before connecting.");
      requireEncryption();
      changing = true;
      cancelRequests();
      let server, timer;
      const controller = new AbortController();
      transaction = controller;
      try {
        await persist();
        const d = await discovery();
        const old = options.newProfile ? null : current();
        const registration = old ||
          (!options.newProfile
            ? saved.profiles.find((p) => !p.subject)
            : null) || {
            id: randomUUID(),
            clientId: null,
            label: "Connection " + (saved.profiles.length + 1),
          };
        const registered = !!registration.clientId;
        controller.signal.throwIfAborted();
        const verifier = random(),
          state = random(),
          nonce = random();
        let consume = false;
        let resolveCallback, rejectCallback;
        const callback = new Promise((resolve, reject) => {
          resolveCallback = resolve;
          rejectCallback = reject;
        });
        callback.catch(() => {});
        server = createServer((req, res) => {
          const local = "http://127.0.0.1:" + server.address().port;
          let u;
          try {
            u = new URL(req.url, local);
          } catch {
            res.writeHead(400);
            res.end();
            return;
          }
          res.setHeader("Cache-Control", "no-store");
          res.setHeader(
            "Content-Security-Policy",
            "default-src 'none'; style-src 'unsafe-inline'",
          );
          res.setHeader("Referrer-Policy", "no-referrer");
          if (
            req.method !== "GET" ||
            req.headers.host !== new URL(local).host ||
            u.pathname !== "/auth/callback"
          ) {
            res.writeHead(404);
            res.end();
            return;
          }
          let verified = false;
          try {
            verified =
              u.searchParams.getAll("state").length === 1 &&
              match(u.searchParams.get("state"), state);
          } catch {}
          if (consume || !verified) {
            res.writeHead(400);
            res.end("This sign-in return could not be verified.");
            return;
          }
          consume = true;
          const code = u.searchParams.get("code"),
            returnedClient = u.searchParams.get("client_id");
          if (u.searchParams.has("error") || !code || code.length > 10000) {
            res.writeHead(400);
            res.end("Sign-in was not completed. Return to the personal app.");
            rejectCallback(Error("ChatGPT sign-in was cancelled or denied."));
            return;
          }
          if (
            registered
              ? returnedClient && returnedClient !== registration.clientId
              : !returnedClient ||
                returnedClient === "dynamic_agent_client" ||
                returnedClient.length > 300
          ) {
            res.writeHead(400);
            res.end("App registration could not be verified.");
            rejectCallback(Error("Invalid app registration callback."));
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(
            "<h1>Return to Kindred Personal Design Studio</h1><p>The local app is verifying the connection. This page does not confirm plan access.</p>",
          );
          resolveCallback({
            code,
            clientId: registration.clientId || returnedClient,
          });
        });
        await new Promise((resolve, reject) => {
          server.once("error", reject);
          server.listen(0, "127.0.0.1", resolve);
        });
        controller.signal.addEventListener(
          "abort",
          () => rejectCallback(failure("cancelled")),
          { once: true },
        );
        timer = setTimeout(() => controller.abort(), 5 * 60 * 1000);
        const redirectUri =
          "http://127.0.0.1:" + server.address().port + "/auth/callback";
        const url = new URL(d.authorization_endpoint);
        url.search = new URLSearchParams({
          client_id: registration.clientId || "dynamic_agent_client",
          ext_agent_host_id: saved.host,
          response_type: "code",
          redirect_uri: redirectUri,
          scope:
            "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct",
          resource,
          state,
          nonce,
          code_challenge_method: "S256",
          code_challenge: createHash("sha256")
            .update(verifier)
            .digest("base64url"),
          ...(!registered ? { agent_name_hint: appName } : {}),
          ...(old?.tokens?.idToken
            ? { id_token_hint: old.tokens.idToken }
            : {}),
          ...(options.reconsent ? { prompt: "consent" } : {}),
        }).toString();
        controller.signal.throwIfAborted();
        try {
          await openBrowser(url.href);
        } catch {
          throw Error("Could not open the official sign-in page. Try again.");
        }
        const result = await callback;
        controller.signal.throwIfAborted();
        registration.clientId = result.clientId;
        if (!saved.profiles.some((p) => p.id === registration.id)) {
          saved.profiles.push(registration);
        }
        await persist(); // Retain issued registration even if code exchange fails.
        const data = await tokenRequest({
          grant_type: "authorization_code",
          client_id: registration.clientId,
          code: result.code,
          code_verifier: verifier,
          redirect_uri: redirectUri,
          resource,
        });
        const identity = await verify(data.id_token, registration.clientId, {
          nonce,
          subject: old?.subject,
        });
        controller.signal.throwIfAborted();
        registration.subject = identity.subject;
        registration.identity = identity.identity;
        registration.scopes = data.scope.split(/\s+/);
        registration.tokens =
          typeof data.access_token === "string" ? tokenSet(data) : undefined;
        delete registration.pending;
        saved.active = registration.id;
        await persist();
        return safe();
      } finally {
        clearTimeout(timer);
        server?.close();
        server?.closeAllConnections();
        if (transaction === controller) transaction = null;
        changing = false;
      }
    },
    async disconnect() {
      if (changing) throw Error("Finish account connection first.");
      cancelRequests();
      if (transaction) {
        transaction.abort();
        throw Error("Cancel sign-in before disconnecting.");
      }
      if (requests.size || refreshing)
        throw Error(
          "Cancellation is in progress. Try disconnecting again shortly.",
        );
      changing = true;
      let failed = false;
      const p = current();
      try {
        const renewable = p?.pending?.data?.refresh_token || p?.tokens?.refresh;
        if (renewable) {
          try {
            const d = await discovery();
            if (!d.revocation_endpoint)
              throw Error("Revocation endpoint unavailable.");
            const response = await fetchAuth(d.revocation_endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                token: renewable,
                token_type_hint: "refresh_token",
                client_id: p.clientId,
              }),
            });
            if (response.status !== 200) throw Error("Revocation unconfirmed.");
          } catch {
            failed = true;
          }
        }
        if (p) forget(p);
        await persist();
        if (failed)
          throw Error(
            "Local credentials cleared; remote revocation was not confirmed. Disconnect the app in ChatGPT Settings.",
          );
      } finally {
        changing = false;
      }
    },
    async listModels() {
      const response = await api("/models");
      const data = await response.json();
      if (!Array.isArray(data.models))
        throw Error("Unexpected ChatGPT model catalog.");
      return data.models
        .filter((m) => m.visibility === "list" && typeof m.slug === "string")
        .map((m) => ({ slug: m.slug, displayName: m.display_name || m.slug }));
    },
    async streamResponse({ model, input, instructions, signal }) {
      const epoch = operationEpoch,
        controller = new AbortController();
      requests.add(controller);
      const abort = () => controller.abort();
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
      const deadline = setTimeout(abort, 180000);
      let reader;
      try {
        const response = await api("/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            model,
            input,
            instructions,
            store: false,
            stream: true,
          }),
          signal: controller.signal,
        });
        if (!response.body) throw Error("No response stream was returned.");
        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "",
          eventLines = [],
          text = "",
          completed = false;
        function event() {
          if (!eventLines.length) return;
          const data = eventLines.join("\n");
          eventLines = [];
          if (data === "[DONE]") return;
          let value;
          try {
            value = JSON.parse(data);
          } catch {
            throw Error("Invalid generation stream.");
          }
          if (value.type === "response.output_text.delta") {
            if (typeof value.delta !== "string")
              throw Error("Invalid design output.");
            text += value.delta;
            if (text.length > 256000)
              throw Error("Design output exceeded the limit.");
          } else if (["response.failed", "error"].includes(value.type))
            throw failure(
              value.response?.error?.code || value.error?.code || value.code,
            );
          else if (value.type === "response.incomplete")
            throw Error("Generation was incomplete; previous design retained.");
          else if (value.type === "response.completed") completed = true;
        }
        function line(value) {
          if (value === "") event();
          else if (value.startsWith("data:"))
            eventLines.push(value.slice(5).replace(/^ /, ""));
        }
        while (!completed) {
          controller.signal.throwIfAborted();
          const part = await reader.read();
          buffer += decoder.decode(part.value, { stream: !part.done });
          if (buffer.length + eventLines.join("").length > 512000)
            throw Error("Generation stream exceeded the limit.");
          let from = 0;
          for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] !== "\r" && buffer[i] !== "\n") continue;
            if (buffer[i] === "\r" && i === buffer.length - 1 && !part.done)
              break;
            line(buffer.slice(from, i));
            if (buffer[i] === "\r" && buffer[i + 1] === "\n") i++;
            from = i + 1;
          }
          buffer = buffer.slice(from);
          if (part.done) {
            if (buffer) line(buffer);
            event();
            break;
          }
        }
        if (!completed || !text.trim() || operationEpoch !== epoch)
          throw Error(
            "No completed design was returned; previous version retained.",
          );
        return { text, completed: true };
      } catch (e) {
        if (controller.signal.aborted) throw failure("cancelled");
        throw e;
      } finally {
        clearTimeout(deadline);
        signal?.removeEventListener("abort", abort);
        await reader?.cancel().catch(() => {});
        requests.delete(controller);
      }
    },
  };
}

import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import http from "node:http";
import { spawnSync } from "node:child_process";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { createProvider } from "../electron/personal-provider.mjs";

const base = await mkdtemp(
  join((await import("node:os")).tmpdir(), "kindred-protocol-"),
);
const issuer = "https://auth.openai.com",
  resource = "https://api.openai.com/v1";
const permission = "chatgpt.tokens.use.direct";
const scopes =
  "openid profile email offline_access resource.invoke " + permission;
const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = {
  ...(await exportJWK(publicKey)),
  kid: "synthetic-review-key",
  use: "sig",
  alg: "RS256",
};
const encryption = {
  available: () => true,
  encrypt: (s) => Buffer.from("REVIEW_ONLY:" + s),
  decrypt: (b) => Buffer.from(b).toString().slice(12),
};
const calls = [];
let fixture;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
async function tokenData(clientId, nonce, subject = "synthetic-subject") {
  const now = Math.floor(Date.now() / 1000);
  const idToken = await new SignJWT({
    sub: subject,
    name: "Synthetic Reviewer",
    email: "review@example.test",
    ...(nonce ? { nonce } : {}),
  })
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
    .setIssuer(issuer)
    .setAudience(clientId)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);
  return {
    id_token: idToken,
    access_token: "REVIEW_ONLY_ACCESS",
    refresh_token: "REVIEW_ONLY_REFRESH_NEW",
    token_type: "Bearer",
    expires_in: 3600,
    scope: fixture?.scope ?? scopes,
  };
}
globalThis.fetch = async (url, options = {}) => {
  url = String(url);
  calls.push({ url, method: options.method || "GET" });
  if (url === issuer + "/.well-known/openid-configuration")
    return json({
      issuer,
      authorization_endpoint: issuer + "/api/accounts/authorize",
      token_endpoint: issuer + "/api/accounts/oauth/token",
      jwks_uri: issuer + "/review-jwks",
      revocation_endpoint: issuer + "/review-revoke",
    });
  if (url === issuer + "/review-jwks") return json({ keys: [jwk] });
  if (url === issuer + "/api/accounts/oauth/token") {
    const fields = new URLSearchParams(options.body);
    if (fields.get("grant_type") === "authorization_code") {
      assert.equal(fields.get("client_id"), "oaiapp_review");
      assert.equal(
        fields.get("redirect_uri"),
        fixture.auth.searchParams.get("redirect_uri"),
      );
      const crypto = await import("node:crypto");
      assert.equal(
        crypto
          .createHash("sha256")
          .update(fields.get("code_verifier"))
          .digest("base64url"),
        fixture.auth.searchParams.get("code_challenge"),
      );
    }
    if (fixture.tokenError) return json({ error: fixture.tokenError }, 400);
    if (fixture.waitForToken) await fixture.waitForToken;
    return json(
      await tokenData(
        fields.get("client_id"),
        fixture.wrongNonce
          ? "wrong-nonce"
          : fixture.auth?.searchParams.get("nonce"),
        fixture.wrongSubject ? "different-subject" : "synthetic-subject",
      ),
    );
  }
  if (url === issuer + "/review-revoke" && fixture.revokeNetwork && calls.filter(c => c.url === url).length === 1) throw Error("Synthetic network failure");
  if (url === issuer + "/review-revoke")
    return fixture.revokePermanent ? json({}, 400) : fixture.revokeTransient && calls.filter(c => c.url === issuer + "/review-revoke").length === 1 ? json({}, 503) : fixture.revokeFailure
      ? json({}, 503)
      : new Response(null, { status: 200 });
  if (url === resource + "/models")
    return json({
      models: [
        {
          slug: "review-model",
          display_name: "Synthetic Model",
          visibility: "list",
        },
      ],
    });
  if (url === resource + "/responses") {
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.equal(body.stream, true);
    assert.ok(Array.isArray(body.input));
    fixture.responseStarted = true;
    if (fixture.abortResponse)
      return await new Promise((resolve, reject) => {
        if (options.signal.aborted)
          return reject(new DOMException("Aborted", "AbortError"));
        options.signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
    const bytes = new TextEncoder().encode(fixture.sse);
    const chunks = fixture.fragment
      ? Array.from(bytes, (b) => new Uint8Array([b]))
      : [bytes];
    return new Response(
      new ReadableStream({
        pull(controller) {
          const c = chunks.shift();
          if (c) controller.enqueue(c);
          else controller.close();
        },
      }),
      { headers: { "content-type": "text/event-stream" } },
    );
  }
  throw new Error("Blocked unexpected network request: " + url);
};
async function readSaved(dir) {
  const e = JSON.parse(
    await readFile(join(dir, "encrypted-session.json"), "utf8"),
  );
  return JSON.parse(encryption.decrypt(Buffer.from(e.ciphertext, "base64")));
}
async function callback(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode));
      })
      .on("error", reject);
  });
}
async function setup(options = {}) {
  fixture = {
    sse:
      "data: " +
      JSON.stringify({
        type: "response.output_text.delta",
        delta: '{"ok":true}',
      }) +
      "\n\ndata: " +
      JSON.stringify({ type: "response.completed" }) +
      "\n\n",
    ...options,
  };
  const dir = await mkdtemp(join(base, "synthetic-provider-"));
  if (options.seed) {
    const saved = {
      version: 1,
      host: "urn:uuid:11111111-1111-4111-8111-111111111111",
      active: "review-profile",
      profiles: [
        {
          id: "review-profile",
          clientId: "oaiapp_review",
          label: "Review",
          subject: "synthetic-subject",
          identity: {
            name: "Synthetic Reviewer",
            email: "review@example.test",
          },
          scopes: scopes.split(" "),
          tokens: {
            access: "REVIEW_ONLY_ACCESS",
            refresh: "REVIEW_ONLY_REFRESH_OLD",
            idToken: (await tokenData("oaiapp_review")).id_token,
            expires: Date.now() + (options.expired ? -1000 : 3600000),
          },
        },
      ],
    };
    await writeFile(
      join(dir, "encrypted-session.json"),
      JSON.stringify({
        version: 1,
        ciphertext: encryption
          .encrypt(JSON.stringify(saved))
          .toString("base64"),
      }),
      { mode: 0o600 },
    );
  }
  const provider = await createProvider({
    storageDir: dir,
    encryption,
    openBrowser: async (raw) => {
      fixture.auth = new URL(raw);
      if (options.noCallback) return;
      const u = new URL(fixture.auth.searchParams.get("redirect_uri"));
      u.searchParams.set(
        "state",
        options.oversizedState
          ? "x".repeat(10000)
          : options.unicodeState
            ? "é".repeat(64)
            : options.badState
              ? "x".repeat(64)
              : fixture.auth.searchParams.get("state"),
      );
      u.searchParams.set("code", "REVIEW_ONLY_CODE");
      u.searchParams.set(
        "client_id",
        options.wrongClient ? "oaiapp_wrong" : "oaiapp_review",
      );
      fixture.callbackStatus = await callback(u);
      if (options.badState || options.unicodeState || options.oversizedState)
        provider.cancelSignIn();
    },
  });
  return { provider, dir };
}
const report = [];
async function check(name, fn) {
  try {
    await fn();
    report.push({ name, passed: true });
  } catch (e) {
    report.push({ name, passed: false, error: e.message });
  }
}
if (process.argv[2] === "unicode-callback") {
  const { provider } = await setup({ unicodeState: true });
  await assert.rejects(provider.signIn());
  assert.equal(fixture.callbackStatus, 400);
  process.exit(0);
}
await check(
  "PKCE / callback / JWT nonce / plan scope / owner-only atomic file",
  async () => {
    const { provider, dir } = await setup();
    const session = await provider.signIn();
    assert.equal(session.sharing, true);
    const saved = await readSaved(dir);
    assert.equal(saved.profiles[0].clientId, "oaiapp_review");
    assert.equal(
      (await stat(join(dir, "encrypted-session.json"))).mode & 0o777,
      0o600,
    );
    assert.ok(
      !(await readFile(join(dir, "encrypted-session.json"), "utf8")).includes(
        "REVIEW_ONLY_ACCESS",
      ),
    );
    const host = saved.host;
    await provider.signIn();
    assert.equal(fixture.auth.searchParams.get("client_id"), "oaiapp_review");
    assert.equal(fixture.auth.searchParams.get("ext_agent_host_id"), host);
    assert.equal(fixture.auth.searchParams.has("agent_name_hint"), false);
    assert.equal(fixture.auth.searchParams.has("id_token_hint"), true);
  },
);
await check("wrong ASCII state rejects without token exchange", async () => {
  const count = calls.filter((c) => c.url.endsWith("/oauth/token")).length;
  const { provider } = await setup({ badState: true });
  await assert.rejects(provider.signIn());
  assert.equal(fixture.callbackStatus, 400);
  assert.equal(
    calls.filter((c) => c.url.endsWith("/oauth/token")).length,
    count,
  );
});
await check("oversized state rejects without token exchange", async () => {
  const count = calls.filter((c) => c.url.endsWith("/oauth/token")).length;
  const { provider } = await setup({ oversizedState: true });
  await assert.rejects(provider.signIn());
  assert.equal(fixture.callbackStatus, 400);
  assert.equal(
    calls.filter((c) => c.url.endsWith("/oauth/token")).length,
    count,
  );
});
await check("wrong nonce rejects before storing credentials", async () => {
  const { provider, dir } = await setup({ wrongNonce: true });
  await assert.rejects(provider.signIn(), /identity verification/);
  assert.ok(!(await readSaved(dir)).profiles[0].tokens);
});
await check("returning subject mismatch rejects replacement", async () => {
  const { provider } = await setup({ seed: true, wrongSubject: true });
  await assert.rejects(provider.signIn(), /identity verification/);
  assert.equal((await provider.getSession()).sharing, true);
});
await check("returning client-id mismatch rejects callback", async () => {
  const { provider } = await setup({ seed: true, wrongClient: true });
  await assert.rejects(provider.signIn(), /registration callback/);
  assert.equal(fixture.callbackStatus, 400);
});
await check("identity-only grant blocks model request", async () => {
  const { provider } = await setup({ scope: "openid profile email" });
  assert.equal((await provider.signIn()).sharing, false);
  await assert.rejects(provider.listModels(), /permission/);
});
await check("cancelled sign-in remains disconnected", async () => {
  const { provider } = await setup({ noCallback: true });
  const pending = provider.signIn();
  while (!fixture.auth) await new Promise((r) => setTimeout(r, 1));
  provider.cancelSignIn();
  await assert.rejects(pending, /Cancelled/);
  assert.equal((await provider.getSession()).status, "disconnected");
});
await check("fragmented CRLF completed stream accepted", async () => {
  const { provider } = await setup({ seed: true, fragment: true });
  fixture.sse = fixture.sse.replaceAll("\n", "\r\n");
  assert.deepEqual(
    await provider.streamResponse({
      model: "review-model",
      instructions: "Synthetic test",
      input: [{ role: "user", content: "Review only" }],
    }),
    { text: '{"ok":true}', completed: true },
  );
});
for (const [name, last] of [
  ["EOF without completion", ""],
  ["incomplete", 'data: {"type":"response.incomplete"}\n\n'],
  [
    "late usage-limit failure",
    'data: {"type":"response.failed","response":{"error":{"code":"subscription_sharing_usage_limit_exceeded"}}}\n\n',
  ],
]) {
  await check(name + " rejected", async () => {
    const { provider } = await setup({ seed: true });
    fixture.sse =
      'data: {"type":"response.output_text.delta","delta":"partial"}\n\n' +
      last;
    await assert.rejects(
      provider.streamResponse({
        model: "review-model",
        input: [],
        instructions: "Synthetic test",
      }),
    );
  });
}
await check("request abort rejects completion", async () => {
  const { provider } = await setup({ seed: true, abortResponse: true });
  const c = new AbortController();
  const pending = provider.streamResponse({
    model: "review-model",
    input: [],
    instructions: "Synthetic",
    signal: c.signal,
  });
  while (!fixture.responseStarted) await new Promise((r) => setTimeout(r, 1));
  c.abort();
  await assert.rejects(pending, /Cancelled/);
});
await check("refresh rotates renewable token before model lookup", async () => {
  const { provider, dir } = await setup({ seed: true, expired: true });
  assert.equal((await provider.listModels())[0].slug, "review-model");
  const saved = await readSaved(dir);
  assert.equal(saved.profiles[0].tokens.refresh, "REVIEW_ONLY_REFRESH_NEW");
  assert.equal(saved.profiles[0].pending, undefined);
});
await check("terminal refresh error clears invalid token set", async () => {
  const { provider } = await setup({
    seed: true,
    expired: true,
    tokenError: "invalid_grant",
  });
  await assert.rejects(provider.listModels());
  assert.equal((await provider.getSession()).status, "disconnected");
});
await check("transient revocation failure retries before clearing credentials", async () => {
  calls.length = 0;
  const { provider } = await setup({ seed: true, revokeTransient: true });
  await provider.disconnect();
  assert.equal(calls.filter(c => c.url === issuer + "/review-revoke").length, 2);
  assert.equal((await provider.getSession()).status, "disconnected");
});
await check("network revocation failure retries", async () => {
  calls.length = 0;
  const { provider } = await setup({ seed: true, revokeNetwork: true });
  await provider.disconnect();
  assert.equal(calls.filter(c => c.url === issuer + "/review-revoke").length, 2);
});
await check("permanent revocation rejection does not retry", async () => {
  calls.length = 0;
  const { provider } = await setup({ seed: true, revokePermanent: true });
  await assert.rejects(provider.disconnect(), /remote revocation was not confirmed/);
  assert.equal(calls.filter(c => c.url === issuer + "/review-revoke").length, 1);
});
await check(
  "revocation failure clears local credentials and reports uncertainty",
  async () => {
    calls.length = 0;
    const { provider } = await setup({ seed: true, revokeFailure: true });
    await assert.rejects(
      provider.disconnect(),
      /remote revocation was not confirmed/,
    );
    assert.equal((await provider.getSession()).status, "disconnected");
    assert.equal(calls.filter(c => c.url === issuer + "/review-revoke").length, 3);
  },
);
await check(
  "disconnect during generation prevents stale completion",
  async () => {
    const { provider } = await setup({ seed: true, abortResponse: true });
    const pending = provider.streamResponse({
      model: "review-model",
      input: [],
      instructions: "Synthetic",
    });
    pending.catch(() => {});
    while (!fixture.responseStarted) await new Promise((r) => setTimeout(r, 1));
    await assert.rejects(provider.disconnect(), /Cancellation is in progress/);
    await assert.rejects(pending, /Cancelled/);
    await provider.disconnect();
    assert.equal((await provider.getSession()).status, "disconnected");
  },
);
const unicode = spawnSync(
  process.execPath,
  [import.meta.filename, "unicode-callback"],
  { encoding: "utf8", timeout: 15000 },
);
report.push({
  name: "malformed Unicode callback does not crash process",
  passed: unicode.status === 0,
  observedExit: unicode.status,
  crash: unicode.stderr.includes("ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH"),
  diagnostic: unicode.stderr.slice(0, 900),
});
await writeFile(
  join(base, "provider-results.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      checks: report.length,
      passed: report.filter((r) => r.passed).length,
      results: report,
    },
    null,
    2,
  ),
);

assert.equal(
  report.filter((r) => !r.passed).length,
  0,
  JSON.stringify(report.filter((r) => !r.passed)),
);

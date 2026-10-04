const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  safeStorage,
  session,
} = require("electron");
const { join, resolve } = require("node:path");
const { readFile, writeFile, mkdir, rename } = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
let window,
  provider,
  active,
  epoch = 0;
const personal = process.env.KINDRED_PERSONAL === "1";
if (personal) {
  app.setName("Kindred Personal Design Studio");
  app.setPath(
    "userData",
    join(app.getPath("appData"), "kindred-personal-design-studio"),
  );
}
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
const ui = pathToFileURL(resolve(__dirname, "../dist/index.html")).href;
const unavailable =
  "ChatGPT subscription connection is not configured. The official DevKit has a noncommercial license; resolve licensing and provider eligibility before enabling it for this project.";
const safeSession = (s) => ({
  status: ["connected", "connecting", "reauth_required"].includes(s?.status)
    ? s.status
    : "disconnected",
  sharing: s?.sharing === true,
  profileId: String(s?.profileId || "").slice(0, 100),
  identity: {
    name: String(s?.identity?.name || "").slice(0, 100),
    email: String(s?.identity?.email || "").slice(0, 150),
  },
});
const cancel = () => {
  epoch++;
  active?.abort();
  active = null;
};
async function state() {
  return {
    session: safeSession(provider ? await provider.getSession() : null),
    configured: !!provider,
    personal,
    notice: provider ? "" : unavailable,
  };
}
app.whenReady().then(async () => {
  const home = app.getPath("userData");
  await mkdir(home, { recursive: true });
  // Deliberately no DevKit code or credential reuse. A separately authorized,
  // independently supplied provider may implement the documented contract.
  if (personal || process.env.KINDRED_AUTH_PROVIDER) {
    const entry = personal
      ? resolve(__dirname, "personal-provider.mjs")
      : resolve(process.env.KINDRED_AUTH_PROVIDER);
    const module = await import(pathToFileURL(entry).href);
    provider = await module.createProvider({
      storageDir: join(home, "connection"),
      openBrowser: async (url) => {
        if (new URL(url).origin !== "https://auth.openai.com")
          throw Error("Unapproved authorization destination");
        await shell.openExternal(url);
      },
      encryption: {
        available: () =>
          safeStorage.isEncryptionAvailable() &&
          (process.platform !== "linux" ||
            ["gnome_libsecret", "kwallet", "kwallet5", "kwallet6"].includes(
              safeStorage.getSelectedStorageBackend(),
            )),
        encrypt: (s) => safeStorage.encryptString(s),
        decrypt: (b) => safeStorage.decryptString(Buffer.from(b)),
      },
    });
  }
  session.defaultSession.setPermissionRequestHandler((_w, _p, reply) =>
    reply(false),
  );
  session.defaultSession.webRequest.onBeforeRequest((details, callback) =>
    callback({
      cancel: !["file:", "about:", "data:", "devtools:"].includes(
        new URL(details.url).protocol,
      ),
    }),
  );
  window = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 320,
    title: personal
      ? "Kindred Personal Design Studio"
      : "Kindred Design Studio",
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  ipcMain.handle("kindred:action", async (event, action, payload) => {
    if (
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      event.senderFrame.url !== ui
    )
      throw Error("Untrusted sender");
    try {
      if (action === "state") {
        let project = null;
        try {
          project = JSON.parse(
            await readFile(join(home, "project.json"), "utf8"),
          );
        } catch {}
        return { ...(await state()), project };
      }
      if (action === "save") {
        const json = JSON.stringify(payload);
        if (json.length > 2 * 1024 * 1024) throw Error("Project too large");
        await writeFile(join(home, "project.tmp"), json, { mode: 0o600 });
        await rename(join(home, "project.tmp"), join(home, "project.json"));
        return {};
      }
      if (action === "usage") {
        await shell.openExternal("https://chatgpt.com/settings/usage");
        return {};
      }
      if (action === "cancel") {
        cancel();
        return {};
      }
      if (action === "cancelConnect") {
        provider?.cancelSignIn();
        return {};
      }
      if (
        !provider &&
        [
          "connect",
          "disconnect",
          "models",
          "generate",
          "profiles",
          "selectProfile",
        ].includes(action)
      )
        throw Error(unavailable);
      if (action === "connect") {
        cancel();
        await provider.signIn({
          newProfile: payload?.newProfile === true,
          profileId: payload?.profileId,
          reconsent: payload?.reconsent === true,
        });
        return state();
      }
      if (action === "profiles") {
        return {
          profiles: (await provider.listProfiles()).map((p) => ({
            id: String(p.id).slice(0, 100),
            label: String(p.label || "Saved account").slice(0, 100),
            ...safeSession({ ...p, profileId: p.id }),
          })),
        };
      }
      if (action === "selectProfile") {
        cancel();
        if (typeof payload?.id !== "string")
          throw Error("Select a saved account");
        await provider.selectProfile(payload.id);
        return state();
      }
      if (action === "disconnect") {
        cancel();
        await provider.disconnect();
        return state();
      }
      if (action === "models") {
        const models = await provider.listModels();
        return {
          models: models.slice(0, 100).map((m) => ({
            slug: String(m.slug).slice(0, 100),
            displayName: String(m.displayName).slice(0, 100),
          })),
        };
      }
      if (action === "generate") {
        if (active) throw Error("A generation is already running");
        const expectedEpoch = epoch;
        if (!(await provider.getSession()).sharing)
          throw Error("ChatGPT plan permission required");
        if (
          typeof payload?.prompt !== "string" ||
          !payload.prompt.trim() ||
          payload.prompt.length > 12000
        )
          throw Error("Use a brief between 1 and 12000 characters");
        if (
          !["calm-spa", "clean-clinic", "modern-boutique"].includes(
            payload.style,
          )
        )
          throw Error("Unsupported style");
        const catalog = await provider.listModels();
        if (epoch !== expectedEpoch)
          throw Error("The account changed; generation was cancelled.");
        if (active) throw Error("A generation is already running");
        if (!catalog.some((m) => m.slug === payload.model))
          throw Error("Select an available model");
        const id = ++epoch;
        active = new AbortController();
        const controller = active;
        const instructions =
          "Return ONLY a JSON design specification, not executable code. Schema: {style: one of calm-spa/clean-clinic/modern-boutique, tokens:{ink,muted,paper,line,accent,soft,canvas: six-digit hex colours, radius,space: px from 0 to 40, heading: Georgia, serif OR system-ui, sans-serif},screens: exactly five objects {title,subtitle,action}, ordered service selection, treatment details, date/slots, contact, confirmation}. Strings max 180 chars. Preserve booking rules, APIs, prices and fictional data. No URLs or scripts. Preserve screen-local refinement scope; shared token changes require All screens.";
        try {
          const previous = payload.previous
            ? JSON.stringify(payload.previous).slice(0, 20000)
            : "";
          const result = await provider.streamResponse({
            model: payload.model,
            instructions,
            input: [
              {
                role: "user",
                content: JSON.stringify({
                  brief: payload.prompt,
                  style: payload.style,
                  scope: payload.scope,
                  previous,
                }),
              },
            ],
            signal: controller.signal,
          });
          if (epoch !== id || controller.signal.aborted)
            throw Error("Generation cancelled");
          if (result.completed !== true)
            throw Error("Incomplete generation was rejected");
          return { text: result.text };
        } finally {
          if (active === controller) active = null;
        }
      }
      if (action === "export") {
        const bytes = new Uint8Array(payload);
        if (bytes.length > 10 * 1024 * 1024) throw Error("Export too large");
        const directory = join(home, "exports");
        await mkdir(directory, { recursive: true });
        const path = join(directory, "kindred-design-" + Date.now() + ".zip");
        await writeFile(path, bytes, { flag: "wx" });
        await shell.showItemInFolder(path);
        return { path };
      }
      throw Error("Unsupported action");
    } catch (error) {
      let snapshot = null;
      try {
        snapshot = await state();
      } catch {}
      return {
        error: String(error.message).slice(0, 500),
        code: String(error.code || "request_failed").slice(0, 100),
        connection: snapshot,
      };
    }
  });
  await window.loadURL(ui);
});
app.on("window-all-closed", () => {
  cancel();
  provider?.cancelSignIn();
  app.quit();
});

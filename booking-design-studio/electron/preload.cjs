const { contextBridge, ipcRenderer } = require("electron");
const actions = new Set([
  "state",
  "save",
  "connect",
  "cancelConnect",
  "disconnect",
  "models",
  "profiles",
  "selectProfile",
  "generate",
  "cancel",
  "usage",
  "export",
  "startRecording",
  "stopRecording",
  "retryRecording",
]);
contextBridge.exposeInMainWorld("kindred", {
  call: (action, payload) => {
    if (!actions.has(action)) throw Error("Unsupported action");
    return ipcRenderer.invoke("kindred:action", action, payload);
  },
});

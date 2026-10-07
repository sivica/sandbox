// Captures this app's renderer only. Never captures other apps or the desktop.
const { mkdir, writeFile } = require('node:fs/promises');
const { join } = require('node:path');
module.exports = function createDemoRecorder(window, home) {
  let recording, timer, pending = Promise.resolve();
  async function frame() {
    if (!recording || window.isDestroyed()) return;
    const current = recording;
    const image = await window.webContents.capturePage();
    if (recording !== current) return;
    const name = String(current.frames.length).padStart(6, '0') + '.jpg';
    const elapsed = (performance.now() - current.started) / 1000;
    await writeFile(join(current.directory, name), image.toJPEG(85), { flag: 'wx', mode: 0o600 });
    current.frames.push({ name, elapsed });
  }
  return {
    async start() {
      if (recording) throw Error('A recording is already active.');
      const directory = join(home, 'recordings', 'demo-' + Date.now());
      await mkdir(directory, { recursive: true, mode: 0o700 });
      recording = { directory, started: performance.now(), frames: [] };
      try { await frame(); } catch (error) { recording = null; throw error; }
      timer = setInterval(() => {
        if (recording && performance.now() - recording.started >= 300000) { clearInterval(timer); recording.capped = true; return; }
        if (recording && !recording.capturing) {
          recording.capturing = true;
          pending = frame().catch(() => { if (recording) recording.captureErrors = (recording.captureErrors || 0) + 1; }).finally(() => { if (recording) recording.capturing = false; });
        }
      }, 500);
      return { recording: true };
    },
    async stop() {
      if (!recording) throw Error('No recording is active.');
      clearInterval(timer);
      await pending;
      await frame();
      const result = recording;
      recording = null;
      const duration = (performance.now() - result.started) / 1000;
      await writeFile(join(result.directory, 'recording.json'), JSON.stringify({ duration, frames: result.frames, scope: 'Kindred app window only', audio: false, capped: !!result.capped, captureErrors: result.captureErrors || 0 }, null, 2), { mode: 0o600 });
      return { directory: result.directory, duration, frames: result.frames.length };
    }
  };
};

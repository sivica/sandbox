import { spawn } from "node:child_process";
import electron from "electron";
const child = spawn(electron, ["."], {
  stdio: "inherit",
  env: { ...process.env, KINDRED_PERSONAL: "1" },
});
child.on("exit", (code) => process.exit(code || 0));

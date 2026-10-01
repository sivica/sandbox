const { defineConfig, devices } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/browser",
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:4174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
    { name: "webkit-mobile", use: { ...devices["iPhone 13"] } },
    {
      name: "chromium-landscape",
      use: { browserName: "chromium", viewport: { width: 844, height: 390 } },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "node --env-file-if-exists=.env server/index.js",
        url: "http://127.0.0.1:4174/health",
        reuseExistingServer: false,
        timeout: 60000,
      },
});

const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
 testDir: './tests', timeout: 45000, fullyParallel: true, retries: process.env.CI ? 1 : 0,
 workers: process.env.CI ? 2 : 3, reporter: [['list'], ['html', { open: 'never' }]],
 use: { baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
 projects: [
  { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  { name: 'webkit-mobile', use: { ...devices['iPhone 13'] } },
  { name: 'chromium-landscape', use: { browserName: 'chromium', viewport: { width: 844, height: 390 } } },
 ],
 webServer: process.env.BASE_URL ? undefined : { command: 'node tests/serve.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});

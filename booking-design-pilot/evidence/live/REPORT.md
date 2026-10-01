# Live Railway verification

Deployment f0f52472-a1b7-401b-b10a-da8b0d65b812 succeeded on 1 October 2026. Uploaded app folder from source a2e132a4ca71a4c489c442c77a437f61abad0b81 with --path-as-root. Initial repository-root upload b23b706a-84c4-49ae-8370-149f3b7ef312 was superseded; correct deployment used Dockerfile/Caddy.

Live URL: https://booking-design-pilot-production.up.railway.app/

app.js, styles.css and index.html were downloaded and matched local source byte for byte; hashes in source-match.json. All 33 Playwright/axe executions against live BASE_URL passed in 32.3 seconds across Chromium portrait, WebKit portrait and Chromium landscape. This proves tested live browser behavior, not physical-device speech or comprehensive accessibility.

GitHub Actions now accepts a live_url workflow-dispatch input, runs the same deployed-site checks and uploads booking-live-evidence artifacts for 14 days. Local report remains in playwright-report; tests can also run via BASE_URL npm test.

Physical Android/iPhone follow-up blocked: ADB had no devices and Mac was locked, preventing Android Studio/device-cloud browser access. No paid access, billing or third-party contact occurred. Daily status automation was rejected by automatic approval review due to prior one-time instruction; explicit recurrence approval requested.

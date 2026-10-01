# Kindred — done and remaining
Updated 1 October 2026. This checklist covers prototype verification, not production booking readiness.

## Done
- [x] Physical Pixel 10 booking, validation, back retention and simulated failure/retry verified on the earlier Railway deployment.
- [x] Physical TalkBack captions confirmed steps 2–5 and required-name error.
- [x] Installed Playwright Test 1.63.0 and axe integration 4.13.0, with committed lockfile.
- [x] Added eleven tests across Chromium portrait, WebKit portrait and Chromium landscape: 33 executions passed locally.
- [x] Checked all five screens with axe WCAG 2 A/AA and 2.1 AA tags; no detected violations on tested normal, loading, empty, validation, failed-submission and unavailable states after fixes.
- [x] Reproduced error-focus timing bug; fixed focus to run after error markup commits.
- [x] Corrected progress markup to named list items.
- [x] Changed fixed text sizes to equivalent rem values; tested actual 200% root text scaling and horizontal page overflow.
- [x] Added GitHub Actions workflow on branch pushes, PR changes and manual dispatch. Cloud result is recorded separately below.

## Overnight continuation — completed
- [x] Verified both 27-test cloud runs and inspected downloaded artifacts.
- [x] Added 200% internal text overflow and button-size checks; inspected enlarged screenshots.
- [x] Added loading/empty axe coverage: 33/33 local executions passed.
- [x] Captured fresh and repeated email error TalkBack captions on the emulator; audible/physical evidence remains separate.
- [x] Shared Google Doc updated with current status and source links.
- [x] Handoff evidence and package refreshed; source/deployment difference recorded.

Expanded suite: **33/33 passed in GitHub Actions** on source `449993109e1804e1e14d18ab160b81d8a271db1d` in 47.3s. [Verified cloud run](https://github.com/sivica/sandbox/actions/runs/36788827176). Downloaded report and screenshots inspected.

## Requires device or human access
- [x] Owner's USB Android phone: latest live failure-to-success retry passed with retained details, treatment and time; temporary UI dump removed. See [USB phone evidence](evidence/usb-phone/REPORT.md). Earlier cloud Pixel erase remains unobserved.
- [x] iPhone 17 Simulator / iOS 26.5 Safari booking and required-field validation checked. Fixed focus zoom with 16px form controls; fresh-tab confirmation fits. See [simulator evidence](evidence/iphone-simulator/REPORT.md).
- [x] Physical Pixel fresh/repeated email-error captions captured on latest deployed source; audible listening remains open.
- [x] Physical initial step 1 and simulated-failure captions captured; unavailable-slot visual recovery passed.
Physical iPhone Safari/VoiceOver testing is outside the pilot scope at the owner’s request; it is unverified and is not a remaining task.
- [ ] Full screen-reader gesture/audio assessment; independent developer/buyer acceptance.

## Deployment
- [x] Latest runtime deployed to Railway: f0f52472-a1b7-401b-b10a-da8b0d65b812.
- [x] HTML/JavaScript/CSS match source a2e132a byte for byte.
- [x] 33/33 checks passed against live Railway (32.3s).
- [x] Added GitHub Actions manual live_url verification with saved artifacts.
- [x] Cloud live-site job passed: https://github.com/sivica/sandbox/actions/runs/36892138248 (live job completed successfully; source job still running at this update).
Safari form sizing and a versioned stylesheet were subsequently deployed successfully in `923c04de-22e3-474f-ac22-c04b0f3c01ab`. BrowserStack sign-in succeeded; its iPhone 16 trial expired before app verification and its screen-reader panel reported unsupported on that device.
Live suite with the input-size regression assertion: **33/33 passed in 32.7s** after that deployment.

See [live report](evidence/live/REPORT.md). Physical Pixel follow-up completed after unlock; see [latest physical evidence](evidence/physical-latest/REPORT.md). Mac relocked before explicit device return. Daily document-update automation awaits explicit recurrence approval after auto-review rejection.

## Evidence
See [automated verification](AUTOMATION.md), [physical report](evidence/physical/REPORT.md), and [verification matrix](VERIFICATION.md), and [overnight report](evidence/overnight/REPORT.md). The physical streaming serial is no longer present in ADB; explicit remote erase was not observed.

## Scheduled follow-up
Started immediately at the owner’s request. The scheduled duplicate is paused. No recurring follow-up was created.

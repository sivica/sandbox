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
- [x] Physical Pixel fresh/repeated email-error captions captured on latest deployed source; full audible assessment is deferred.
- [x] Physical initial step 1 and simulated-failure captions captured; unavailable-slot visual recovery passed.
Physical iPhone Safari/VoiceOver testing is outside the pilot scope at the owner’s request; it is unverified and is not a remaining task.
- [ ] Independent developer/buyer acceptance.

Full TalkBack listening and gesture assessment is deferred by owner request and does not block the design prototype handoff. The owner confirmed audible speech and the treatment heading/step-2 announcement on the USB phone; this is partial evidence, not a full assessment.

## Current deployment and receiving-developer review
- [x] Safari runtime deployed successfully in 923c04de-22e3-474f-ac22-c04b0f3c01ab; historical pre-improvement application hashes in [runtime manifest](evidence/current-runtime.json).
- [x] Post-fix live suite: 33/33 passed in 32.7s. Prior cloud live job passed: https://github.com/sivica/sandbox/actions/runs/36892138248 . That cloud run predates the Safari change.
- [x] Receiving-developer agent reviewed f5f302b from a clean export: 33/33 passed in 26.1s; accepted with documentation conditions.
- [x] Corrected default checkout, public handoff scope and contradictory evidence summaries. Application files are unchanged by these corrections.
- [ ] Independent human developer and buyer acceptance remain pending; agent assessment does not replace these.

## Future production scope
Real booking APIs, persistence, authoritative dates/slots and a maintained bundled runtime need separate scoping and implementation.

## Evidence
See [automated verification](AUTOMATION.md), [physical report](evidence/physical/REPORT.md), and [verification matrix](VERIFICATION.md), and [overnight report](evidence/overnight/REPORT.md). The physical streaming serial is no longer present in ADB; explicit remote erase was not observed.

## Scheduled follow-up
Started immediately at the owner’s request. The scheduled duplicate is paused. No recurring follow-up was created.

## Buyer-feedback improvements
- [x] Buyer-role agent accepted the five-screen prototype; human buyer acceptance remains pending.
- [x] Hide the treatment count in empty/loading states; derive the normal count from the service list.
- [x] Clear the existing email error and its accessibility attributes once the corrected address is valid. Invalid/empty corrections retain the error; other field errors are preserved.
- Earlier 33-test results and device checks predate these improvements. No new test run is claimed.

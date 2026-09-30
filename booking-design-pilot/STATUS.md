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

Expanded 33-test cloud result: pending dispatch/completion on this publication. [Earlier successful run](https://github.com/sivica/sandbox/actions/runs/36786134992).

## Requires device or human access
- [ ] Physical TalkBack retest of email speech on this new source revision. Earlier email speech remains inconclusive.
- [ ] Physical step 1 / simulated-failure speech and unavailable recovery follow-up.
- [ ] Physical iPhone Safari/VoiceOver. Playwright WebKit emulation is not an iPhone speech test.
- [ ] Full screen-reader gesture/audio assessment; independent developer/buyer acceptance.

## Deployment
The new fixes are in the draft PR source. Railway still serves the earlier manual deployment until a new deployment is verified. Browser tests against localhost do not certify current Railway bytes.

## Evidence
See [automated verification](AUTOMATION.md), [physical report](evidence/physical/REPORT.md), and [verification matrix](VERIFICATION.md), and [overnight report](evidence/overnight/REPORT.md). The physical streaming serial is no longer present in ADB; explicit remote erase was not observed.

## Scheduled follow-up
Started immediately at the owner’s request. The scheduled duplicate is paused. No recurring follow-up was created.

# Kindred — done and remaining
Updated 1 October 2026. This checklist covers prototype verification, not production booking readiness.

## Done
- [x] Physical Pixel 10 booking, validation, back retention and simulated failure/retry verified on the earlier Railway deployment.
- [x] Physical TalkBack captions confirmed steps 2–5 and required-name error.
- [x] Installed Playwright Test 1.63.0 and axe integration 4.13.0, with committed lockfile.
- [x] Added nine tests across Chromium portrait, WebKit portrait and Chromium landscape: 27 executions passed locally.
- [x] Checked all five screens with axe WCAG 2 A/AA and 2.1 AA tags; no detected violations on tested normal, validation, failed-submission and unavailable states after fixes.
- [x] Reproduced error-focus timing bug; fixed focus to run after error markup commits.
- [x] Corrected progress markup to named list items.
- [x] Changed fixed text sizes to equivalent rem values; tested actual 200% root text scaling and horizontal page overflow.
- [x] Added GitHub Actions workflow on branch pushes, PR changes and manual dispatch. Cloud result is recorded separately below.

## Overnight continuation
- [ ] Verify cloud CI result and inspect artifacts; repair confirmed failures.
- [ ] Inspect enlarged-text screenshots beyond page overflow, including internal clipping and touch targets.
- [ ] Audit validation, loading, empty, unavailable and failed states as well as normal screens.
- [ ] Retest fresh and repeated email error announcements using the Android emulator if accessible. Captions/DOM evidence remain separate from listening.
- [ ] Update the existing Google Doc with the status and source links; preserve its business/service plan.
- [ ] Refresh the handoff package and record source/deployment differences.

## Requires device or human access
- [ ] Physical TalkBack retest of email speech on this new source revision. Earlier email speech remains inconclusive.
- [ ] Physical step 1 / simulated-failure speech and unavailable recovery follow-up.
- [ ] Physical iPhone Safari/VoiceOver. Playwright WebKit emulation is not an iPhone speech test.
- [ ] Full screen-reader gesture/audio assessment; independent developer/buyer acceptance.

## Deployment
The new fixes are in the draft PR source. Railway still serves the earlier manual deployment until a new deployment is verified. Browser tests against localhost do not certify current Railway bytes.

## Evidence
See [automated verification](AUTOMATION.md), [physical report](evidence/physical/REPORT.md), and [verification matrix](VERIFICATION.md). The physical streaming serial is no longer present in ADB; explicit remote erase was not observed.

## Scheduled follow-up
One bounded continuation is scheduled for 1 October at 01:05 Europe/Skopje, returning to this chat. Local tasks need the Mac available; cloud CI runs independently once dispatched.

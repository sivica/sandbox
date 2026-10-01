# Overnight verification — 1 October 2026

Completed immediately at the owner’s request; duplicate scheduled continuation paused.

## Browser and cloud
33/33 local executions passed: 11 scenarios across Pixel 7 Chromium portrait, iPhone 13 WebKit emulation and Chromium landscape. Tests include five screens, focus/error timing, validation/retry, keyboard traversal, loading/empty/unavailable/failure axe scans and actual 200% root text scaling. Text-range checks detect internal horizontal overflow in visible text; native select options, hidden text and aria-hidden content are excluded. Visible prototype buttons meet the tested height >=48px and width >=24px bounds. This does not prove comprehensive accessibility or every clipping behavior.

The prior 27-test source passed GitHub Actions twice; HTML report and screenshots downloaded and inspected. Run: https://github.com/sivica/sandbox/actions/runs/36786134992 . Expanded suite passed 33/33 in 47.3 seconds on commit 449993109e1804e1e14d18ab160b81d8a271db1d. Run: https://github.com/sivica/sandbox/actions/runs/36788827176 . Report downloaded and enlarged WebKit services screenshot inspected.

## Android emulator
Android 16/API 36, Chrome 133.0.6943.137, TalkBack 16.0.0.738667889; emulator-5554. Tests used localhost:4173 via ADB reverse on source cd88ffae87bf79d173a11fc9c39cba6218add4ae (runtime unchanged by added tests).

- Fresh malformed email: focused field, visible inline error and TalkBack caption “Enter a valid email address.” captured.
- Repeated malformed email: caption “Edit box, Email address Enter a valid email address.” captured after a longer speech timeline.
- Return to screen 1: caption “Step 1 of 5 Services” captured. Initial page-load speech remains unconfirmed.
- Step 2 and step 4 transition captions captured.
- Simulated submission failure: visible error and retained details confirmed. Automatic failure speech not confirmed; caption showed page title.

These are visual speech-caption observations using ADB keyboard/touch input. No audible listening or full gesture-navigation pass is claimed. Earlier physical Pixel results apply to the old deployment, and physical email speech remains inconclusive. No physical iPhone was available.

TalkBack service restored to the original disabled state (accessibility_enabled=0, enabled_accessibility_services=null); ADB reverse removed and temporary local server stopped. Developer speech-caption preference restored to off and read back as unchecked.

## Remaining
Physical Android retest of new source, initial/failure announcements and full gesture/audio assessment; physical iPhone Safari/VoiceOver; independent receiving developer acceptance. Railway serves earlier source until a separately verified deployment. Production APIs, date/timezone/slot locking, persistence and real booking remain outside this prototype.

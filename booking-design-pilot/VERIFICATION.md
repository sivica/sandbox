# Verification summary

Evidence recorded 30 September 2026. Packaging did not rerun application tests. [Original detailed report](evidence/REPORT.md) preserves the chronological checks; later TalkBack results supersede its earlier “not tested” statements.

| Check | Result | Evidence / boundary |
| --- | --- | --- |
| Five-screen browser flow, 360px/390px | Passed targeted checks | REPORT.md; browser confirmation screenshots |
| Pending field/control lock and validated confirmation | Passed desktop inspection | REPORT.md; Android screenshot confirms rendering only |
| Malformed email rejection and field focus | Passed browser and Android | [Android error](evidence/android-invalid-rejected.png) |
| Failure/retry retention | Passed desktop | Android failure/retry not checked |
| Unavailable recovery | Passed browser and Android | [Recovery](evidence/android-recovered.png) |
| Portrait Android keyboard/back flow | Passed emulator visual checks | API 36, Chrome; not physical-device evidence |
| TalkBack step 2–5 announcements and heading focus | Captured as speech captions | [Step 2](evidence/speech-transition-3.png), [step 3](evidence/talkback-step3.png), [step 4](evidence/talkback-step4.png), [step 5](evidence/talkback-confirmation-speech.png) |
| TalkBack missing-name error | Captured as speech caption | [Name error](evidence/talkback-invalid-name.png) |
| TalkBack email-error speech | Inconclusive | Focus/validation passed; exact error speech not reliably captured |
| Physical Android, iPhone/VoiceOver | Pending | No physical phone connected |
| Full screen-reader gestures/listening, enlarged text, landscape | Pending | ADB input/captions are limited evidence |
| Comprehensive contrast/accessibility audit | Pending | No conformance claim |
| Automated test suite | Not present / not run | Manual targeted evidence only |
| Independent human developer/buyer acceptance | Pending | Agent assessment is not human acceptance |

## Physical-device follow-up

Owner supplies an Android phone with approved USB debugging, or performs guided Chrome/TalkBack checks. Use invented details. Verify forward/back headings and step speech, empty fields, fresh and repeated malformed email, correction, pending/confirmation, keyboard visibility, and normal gesture traversal. Record device/OS/browser/TalkBack versions and observations. Include iPhone VoiceOver if iPhone browser support is in scope. Remote Android ChatGPT access alone does not expose phone browser/TalkBack output to Codex.

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
| TalkBack email-error speech | Emulator captions captured | Fresh and repeated errors on new source; latest physical captions also captured; audible listening remains unverified |
| Physical Android | Passed targeted earlier-deployment checks | [Physical report](evidence/physical/REPORT.md); email speech inconclusive |
| Physical iPhone/VoiceOver | Outside pilot scope by owner request | Unverified; simulator Safari results are separate |
| Landscape and 200% relative text | Targeted automated checks passed | Page/internal text overflow and button dimensions checked; screenshots inspected |
| Full screen-reader gestures/listening | Deferred by owner request | Not a prototype handoff blocker. Owner confirmed audible speech and treatment heading/step-2 announcement; full assessment remains incomplete. |
| Comprehensive contrast/accessibility audit | Pending | No conformance claim |
| Automated browser suite | 33/33 local executions passed | [Automation report](AUTOMATION.md); earlier 27-test cloud suite passed; latest status in STATUS.md |
| Independent human developer/buyer acceptance | Pending | Agent assessment is not human acceptance |

## Physical-device follow-up

Owner supplies an Android phone with approved USB debugging, or performs guided Chrome/TalkBack checks. Use invented details. Verify forward/back headings and step speech, empty fields, fresh and repeated malformed email, correction, pending/confirmation, keyboard visibility, and normal gesture traversal. Record device/OS/browser/TalkBack versions and observations. Physical iPhone/VoiceOver testing is excluded from this pilot by owner request. Remote Android ChatGPT access alone does not expose phone browser/TalkBack output to Codex.

## Latest source revision
See [current checklist](STATUS.md) for 1 October fixes, remaining tasks and deployment differences. The automated error-focus test establishes DOM timing, not a physical speech pass.

Latest physical deployment follow-up: [Pixel report](evidence/physical-latest/REPORT.md) covers fresh/repeated email captions, initial step 1, failure caption, correction/confirmation and unavailable recovery. Full Android gesture/audio assessment is deferred by owner request. Physical iPhone/VoiceOver is excluded from the pilot by owner request.

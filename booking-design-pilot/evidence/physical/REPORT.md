# Physical Android verification — 30 September / 1 October 2026

## Result
Targeted physical Android checks completed. Accessibility verification is partial: email-error automatic speech remains inconclusive. This is not a complete accessibility certification.

## Environment and method
Google-hosted physical Pixel 10, Android 16/API 36, 1080 × 2424, Chrome, Android Device Streaming, Firebase sampleapp-testing Spark free quota. TalkBack 16.0.0.738667889. Tested the public Railway prototype at https://booking-design-pilot-production.up.railway.app/. Used invented PixelTester / tester@example.com data. ADB input, screenshots, accessibility-tree inspection and TalkBack Display speech output captions supplied the evidence; audible output and full touch-gesture usability were not assessed. No application code changed.

## Confirmed
- All five screens rendered in portrait without visible horizontal clipping in captured views.
- Time continuation was initially disabled; choosing Tomorrow 09:30 enabled progression.
- Empty form rejected with name focus and visible required-field errors.
- Malformed email rejected with email focus and visible “Enter a valid email address.”
- Corrected email reached confirmation with The reset, €65, Tomorrow 09:30 and DEMO-1042; the page explicitly says no real appointment and no email sent.
- In-app Back returned to details and retained entered name, email and time.
- Simulated booking failure displayed recovery guidance and retained the details. Switching Demo state to Normal and resubmitting reached confirmation.
- TalkBack captions confirmed transitions “Step 2 of 5: Service details”, “Step 3 of 5: Choose a time”, “Step 4 of 5: Your details”, and “Step 5 of 5: Confirmation”.
- TalkBack caption confirmed “Enter your name.” on empty submission.

## Remaining / evidence limits
- Automatic spoken email-error announcement: inconclusive. Captures showed keyboard feedback, while the visible error and accessibility tree confirmed rejection. Do not count this as a speech pass.
- Step 1 automatic announcement, simulated failure announcement and unavailable-slot recovery were not confirmed in this physical run.
- iPhone VoiceOver, full swipe/touch navigation, audible speech, landscape, enlarged text and broader device coverage remain unverified.

## Session cleanup
The first reservation disconnected. After explicit user approval, SampleApp and Android Studio were restarted; resetting the Studio layout recovered Device Manager, and a second free 15-minute reservation connected the physical Pixel. At completion the Mac locked and automatic unlock failed, preventing explicit Return and Erase through Studio. Reservation expiry is expected to end the session automatically; explicit release/wipe completion is not verified. No paid billing was enabled.

An earlier navigation action accidentally split the junit catalog key in the unrelated SampleApp project. The exact line was restored, the filesystem version loaded, and Gradle reported BUILD SUCCESSFUL before the IDE restart. No intended SampleApp edits were made.

## Key evidence
- physical-step2-speech.png, physical-step3-speech.png, physical-step4-speech.png: transition captions.
- physical-name-speech.png: required-name announcement.
- physical-email-speech-followup.png and window.xml: visible email rejection / accessibility tree (tree captured later in recovery).
- physical-confirmation.png: successful confirmation.
- back-speech.png: retained form after Back.
- physical-error-result.png: simulated failure with retained fields.
- physical-step5-speech.png: successful retry and confirmation announcement.

Other images include intermediate states and setup captures; filenames alone do not establish a pass. Earlier partial reports are superseded by this report.

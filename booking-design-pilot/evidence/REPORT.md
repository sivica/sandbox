# Booking fixes: live browser verification

Checked the live Railway prototype on 30 September 2026. Application fixes are from commit 8d899de; deployment configuration is from 1d25ab1. Code was not changed during this verification.

## Observed results

- Submission: during the 700ms pending state, name, email, note, demo controls and back navigation were disabled. Confirmation showed the validated name. Source also stores the validated booking snapshot; mutation through developer tools was not attempted.
- Focus: entering service details, time selection, customer details and confirmation focused the screen H1. Empty submission focused the name input. Malformed email submission focused the email input. Step text is present in a polite live region; actual screen-reader announcements were not tested.
- Email: alex@studio/.com reported typeMismatch and stayed on Your details with an inline error. reviewer@example.com proceeded to confirmation.
- Unavailable state: all mock days remain unavailable by design, but the message now accurately directs the user to Show sample availability; that button restored selectable times.
- Mobile controls: the measured horizontal gap between the two dropdowns was 12px at both 360px and 390px.
- Layout: inspected screens had no horizontal document overflow. All five screens were exercised; mobile virtual keyboard and physical-device behavior are outside this desktop browser check.
- Error/retry: simulated failure retained the entered details and normal-mode retry reached confirmation.
- Captured browser logs contained no errors or warnings.

## Android emulator results

Verified in Chrome on SampleApp_Pixel_7_API_36 (Android API 36), emulator-5554. Display: 1080 × 2400 pixels at 420 dpi (approximately 411 dp wide; CSS viewport was not instrumented). Chrome first-run terms were accepted with user approval; no Google account was added. Used ADB taps, text input and screenshots after explicit user authorization.

- Exercised all five screens: service menu, treatment detail, time selection, customer details and confirmation. No visible horizontal clipping in the captured portrait layouts. This was a visual check, not a measured DOM overflow assertion.
- Two demo dropdowns were visibly separated.
- Continue was initially disabled without a slot, and selecting 09:30 allowed the form to open.
- Entered AndroidTester and malformed alex@studio/.com. Submit stayed on the form, displayed “Enter a valid email address,” focused the email field and opened the keyboard. Error and field remained visible and editable above the keyboard.
- Replaced the email with tester@example.com. Captured the short Confirming state, then confirmation with “Thanks, AndroidTester,” correct service and Tomorrow · 09:30. Android screenshot proves pending rendering; DOM-disabled properties were directly verified in the desktop browser, not instrumented in Android.
- In-app back navigation from confirmation retained name, email and slot; returning to the time screen preserved selected 09:30.
- Unavailable mode displayed the corrected instruction naming Show sample availability. Tapping it restored time choices and enabled Continue for the preserved slot.
- Existing inline email error remains visible while editing until the next submit; the valid retry clears it. This is current behavior, not a regression in malformed-email rejection.

No new blocking issue was observed. Source code and deployment were unchanged during testing. TalkBack/screen-reader announcements, physical devices, iOS, landscape, enlarged text, and Android failure/retry were not checked. Desktop failure/retry was verified in the prior portion of this report.

## Evidence

- browser-invalid-email.jpg
- browser-360-confirmation.jpg
- browser-390-confirmation.jpg
- android-menu.png, android-details.png, android-time.png, android-form.png
- android-keyboard.png, android-invalid-rejected.png, android-pending.png
- android-confirmation.png, android-back-form.png
- android-unavailable.png, android-recovered.png

This is targeted regression verification, not a comprehensive accessibility or production-readiness assessment.


## TalkBack verification — 30 September 2026

Tested deployed Railway demo with TalkBack 16.0.0.738667889 on Android API 36 emulator in Chrome. Evidence is TalkBack’s Display speech output captions, not inferred from DOM markup or audible listening. ADB taps and keyboard input were used, so this is not a complete TalkBack gesture usability audit.

- PASS: Screen headings receive TalkBack focus on transitions. Captured speech: “Step 2 of 5: Service details” (speech-transition-3.png), “Step 3 of 5: Choose a time” (talkback-step3.png), “Step 4 of 5: Your details” (talkback-step4.png), and “Step 5 of 5: Confirmation” (talkback-confirmation-speech.png).
- PASS: Empty submission focuses full name and announces “Enter your name.” (talkback-invalid-name.png).
- PASS: Malformed email alex@studio/.com remains on form, shows its error and focuses email.
- INCONCLUSIVE: Did not capture “Enter a valid email address” as speech on fresh or repeated malformed-email submission. Captions showed field value, Required and action/keyboard instructions. This must not be marked as a speech pass; repeat on a physical Android device with TalkBack listening before accessibility sign-off.
- NOT VERIFIED: physical Android/iPhone, iOS VoiceOver, full gesture navigation, enlarged text, speech timing/duplication by listening. Only emulator-5554 was connected.

Restored TalkBack service to its original disabled state and Display speech output to off. No application code changed.

### Physical-phone follow-up

Connect an Android phone to the Mac by USB with USB debugging enabled and approve the Mac. Alternatively run the live demo in Chrome on the phone with TalkBack and report observations. Check forward/back announcements; empty-name and malformed-email errors; correction and confirmation; keyboard visibility; normal gesture traversal. The Android ChatGPT remote connection alone does not expose the physical phone’s browser or TalkBack audio to Codex.

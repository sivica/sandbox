# Physical Pixel follow-up — latest deployment

1 October 2026. Android Device Streaming, physical Google Pixel 10, Android 16/API 36, Chrome 134.0.6998.135, TalkBack 16.0.0.738667889. Serial localhost:63057. Spark free-minute reservation; no billing enabled. Live Railway runtime matches a2e132a; see evidence/live/source-match.json.

Verified on latest deployed source:
- Fresh malformed email caption: “Edit box, Email address Enter a valid email address.”
- Repeated malformed email caption: same field/error description captured again.
- Corrected email reached confirmation with heading focus and “Step 5 of 5: Confirmation” caption; invented details retained.
- Initial fresh-page caption: “Step 1 of 5: Services”, heading focused.
- Simulated failure: retained name/email, visible failure guidance, automatic caption with the complete failure/retry message.
- Unavailable slots: disabled Continue and unavailable guidance; Show sample availability restored time buttons. This recovery check was performed with TalkBack disabled.

ADB keyboard/touch input and visual TalkBack speech captions are the evidence. No audible listening or complete natural gesture assessment is claimed. Server-failure retry to confirmation was not re-established in this pass: an attempted keyboard route opened the handoff and browser back reset the in-memory flow. Earlier physical/browser retry results remain separate.

TalkBack service restored to original disabled/null state. Mac relocked before Studio return-device control could be used; explicit return/wipe was not observed at report time. Owner asked to unlock for cleanup. The reservation is time limited; no extension requested. BrowserStack opened at sign-in, so physical iPhone/VoiceOver remains blocked on account/device access.

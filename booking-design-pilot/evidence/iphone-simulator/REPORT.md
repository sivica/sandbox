# iPhone Simulator Safari check

Checked 1 October 2026 on Apple iPhone 17 Simulator, iOS 26.5, against the public Railway prototype.

## Observed
- Selected The reset, opened service details, selected tomorrow at 09:30 and opened the details form.
- Empty submission displayed required-name and email errors and focused the name field.
- Entered invented details and reached the demo confirmation; no actual appointment or email was created.
- Found Safari focus zoom caused by 12px form inputs. Changed controls to 1rem (16px at the default root size), preserving user zoom.
- Versioned the stylesheet reference to fetch the new CSS. In a fresh tab, name and email focus preserved normal viewport width; confirmation fit horizontally.
- Saved `confirmation.png` from the successful corrected flow.

## Limits
Used mouse clicks and hardware-keyboard Page Down for scrolling; touch-swipe automation was unreliable. This is a simulator Safari check, not a physical iPhone, VoiceOver audio or full gesture assessment. Failure/retry and unavailable recovery remain covered by existing browser tests, not this simulator session.

## Deployment
Railway deployment `923c04de-22e3-474f-ac22-c04b0f3c01ab` reported SUCCESS. Prior CSS-only deployment was `5c26d4d7-5dd1-4a1e-8476-a79e9f70ba80`.

Existing live suite, including a new 16px input-size assertion in the five-screen test: **33/33 passed in 32.7s** after the final deployment. This does not measure Safari viewport autozoom; the fresh simulator interaction supplied that evidence.

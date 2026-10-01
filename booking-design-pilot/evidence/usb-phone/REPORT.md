# Physical USB Android retry

Checked 1 October 2026 on the owner's USB-connected Android phone, model identifier `25028RN03Y`, using Chrome and the deployed Railway prototype.

- Selected The reset, tomorrow at 09:30, and invented details `USBTester` / `usbtester@example.com`.
- With Demo state set to error, submission displayed the simulated-failure message. Name and email remained in the fields.
- A first attempt was reset by Chrome pull-to-refresh during scrolling; it was discarded as retry evidence.
- Repeated the flow, verified failure and retained values, used keyboard Page Up to reach the selector without reloading, switched to normal and verified the same retained values before retry.
- Retry reached step 5, confirmed USBTester, The reset, tomorrow at 09:30 and reference DEMO-1042. No real appointment or email was created.
- `failure.png` captures the failure state; `success.png` captures the successful retry.

## Cleanup and limits
Removed the temporary `/sdcard/kindred-window.xml` test dump. No accessibility settings, apps, account permissions or debugging settings were changed by the test. The owner enabled developer options/debugging to connect the phone; those remain owner-managed. USB testing has no cloud-device reservation to return. This does not establish erasure of the earlier disconnected cloud Pixel session, whose cleanup confirmation was not observed. TalkBack audio/gesture testing was not performed in this session.

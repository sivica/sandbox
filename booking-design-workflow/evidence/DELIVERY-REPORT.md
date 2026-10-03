# Booking design workflow delivery — 2 October 2026

Runtime source dbc032c2aa98ba13bfb71e7bf92642724357661b; subsequent preview/export fix 6038e4faceb4427af8f1256a691934431af908d0. No booking backend/calendar/migration changes.

- Three themes, six screens including cancelled, Chromium/WebKit: 36 walkthrough/a11y screen checks; reload and cancellation passed.
- Six synthetic state scenarios passed: no services, empty slots, availability error, conflict retaining details, interrupted result/reload/idempotent retry and late cancellation remaining confirmed.
- Six local calendar checks passed.
- Push CI 37051133086 and PR CI 37051170793 passed for both sample and simulated profiles: calendar, disposable PostgreSQL API, and twelve mobile/WebKit/landscape browser executions per profile.
- Preview follow-up CI 37051735579 passed.
- Staging deployment dfe9ad56-72b2-4b17-9e4d-23d8ae8b82f1 SUCCESS.
- All twelve deployed simulated-profile browser checks passed in 1.3 minutes. Only their own synthetic bookings were created/cancelled.
- Independent ZIP was extracted into a clean directory, installed from lockfile and built successfully. No live credentials or actual receipt tokens included; fixture bearer strings are deliberately synthetic.
- Actual browser preview recording delivered as draft, 45.28s H.264 1920×1080. Separate real staging booking footage recorded successfully; saved confirmation survived reload and the recording's own synthetic booking was cancelled.
- Both chat automation and Railway monitor remain stopped; neither was restarted by deployment.

Remaining: actual Codex prompt/refinement desktop footage and final 60-second edited video. FFmpeg reports camera/microphone devices but no display device; capture permission/route requires resolution. No fabricated generation footage, real customer data, messages, payments, production launch, owner acceptance or achieved business results.

## Product video delivery

A separate 60.000s/1920×1080/H.264 product demo is assembled from the saved Codex design brief, actual generated theme screenshots, export inventory and real staging browser recording. All frames decoded successfully; brief/theme/staging frames were visually inspected. It explicitly states that live Codex generation footage is absent. Computer Use refused control of the Codex app for safety reasons; native capture was stopped and no bypass attempted. This completes an edited product walkthrough, while the originally specified live Codex generation clip remains blocked.

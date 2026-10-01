# Staging verification — 2 October 2026

Verified code/test/build source: `0a80b510c7e8f872d009508c836bc6514e6f227d`. Later handoff-only changes preserve that source.

- 5/5 calendar unit checks passed (date validation, rolling horizon, durations/lead time, DST, overlapping ranges).
- 8/8 PostgreSQL API scenarios passed; Node reports 9 results including the parent group.
- 12/12 browser executions passed in 48.9s, 4 scenarios × mobile Chromium, mobile WebKit and landscape Chromium; no retries.
- [Push CI](https://github.com/sivica/sandbox/actions/runs/36934271659) and [PR CI](https://github.com/sivica/sandbox/actions/runs/36934277944) succeeded.
- Reports/screenshots downloaded and the settled WebKit confirmation inspected. Three confirmation images are saved alongside this report.

API evidence covers simultaneous identical requests, changed-key payload rejection, retrieval via a new server instance, authorization, overlapping different-service requests, direct PostgreSQL constraint enforcement, invalid data, cancellation/released capacity and rate limiting. Browser evidence covers validation correction, pending locks, saved confirmation after reload, lost response after commit with same-request recovery, slot conflict/reselection, empty menu, Sunday unavailability, interrupted availability, axe and 200% text. These are browser emulation/automated scans, not physical screen-reader conformance.

Private Railway deployment `3dd0fe52-d5e1-43fc-bb00-73480d5d8307` succeeded in environment staging. Startup logs confirm readiness after migrations. The database has no public endpoint and the app has no public domain. Live browser verification is not claimed. Creating a public domain was rejected by automatic approval review pending explicit owner approval. Temporary SSH registration was rejected as well; no key was registered.

All test data was invented. CI databases were disposable; API tests removed their own rows and browser tests cancelled their bookings. No customer notification or payment occurred. Build succeeded and npm audit reported zero vulnerabilities at install; this is not a production security audit.

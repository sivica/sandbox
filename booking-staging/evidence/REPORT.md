# Staging verification — 2 October 2026

Verified code/test/build source: `0a80b510c7e8f872d009508c836bc6514e6f227d`. Later handoff-only changes preserve that source.

- 5/5 calendar unit checks passed (date validation, rolling horizon, durations/lead time, DST, overlapping ranges).
- 8/8 PostgreSQL API scenarios passed; Node reports 9 results including the parent group.
- 12/12 browser executions passed in 48.9s, 4 scenarios × mobile Chromium, mobile WebKit and landscape Chromium; no retries.
- [Push CI](https://github.com/sivica/sandbox/actions/runs/36934271659) and [PR CI](https://github.com/sivica/sandbox/actions/runs/36934277944) succeeded.
- Reports/screenshots downloaded and the settled WebKit confirmation inspected. Three confirmation images are saved alongside this report.

API evidence covers simultaneous identical requests, changed-key payload rejection, retrieval via a new server instance, authorization, overlapping different-service requests, direct PostgreSQL constraint enforcement, invalid data, cancellation/released capacity and rate limiting. Browser evidence covers validation correction, pending locks, saved confirmation after reload, lost response after commit with same-request recovery, slot conflict/reselection, empty menu, Sunday unavailability, interrupted availability, axe and 200% text. These are browser emulation/automated scans, not physical screen-reader conformance.

Private Railway deployment `3dd0fe52-d5e1-43fc-bb00-73480d5d8307` succeeded in environment staging. Startup logs confirm readiness after migrations. The database has no public endpoint. The owner subsequently approved public app access; the initial domain rejection is resolved. Temporary SSH registration was rejected as well; no key was registered.

All test data was invented. CI databases were disposable; API tests removed their own rows and browser tests cancelled their bookings. No customer notification or payment occurred. Build succeeded and npm audit reported zero vulnerabilities at install; this is not a production security audit.

## Public staging check

Owner-approved public preview: https://kindred-booking-staging-staging.up.railway.app/

Tested deployment `f7ad81ee-3be6-4c3d-b776-eb2b1bf9d22f`, application code unchanged from 0a80b51. `BASE_URL` browser suite: **12/12 passed in approximately 1.3 minutes**, no retries, mobile Chromium/WebKit and landscape Chromium. Covered booking, validation, pending locks, durable confirmation after reload, lost response after commit with safe same-key replay, slot conflict/reselection, cancellation, empty/unavailable/error states, axe and 200% text. /health returned HTTP 200. Served HTML/JS/CSS matched the local bundle; hashes in live/source-match.json.

Only invented details were used. Browser test bookings were cancelled after each test; cancelled test records remain in staging PostgreSQL. No customer messages or payments were sent. Later documentation-only deployments preserve the verified application bundle.

## Operations verification

Staging operations source `0422f4a`: both CI runs 36992404429/36992408605 succeeded, including the new admin integration scenario. All 12 deployed booking executions passed (1.3 minutes). Mobile admin sign-in, unchanged service save, missing-CSRF refusal (403), and logout passed. First worker health check was OK. Screenshot is stored locally at `/Users/ivica/Work/kindred-operations-evidence/admin-mobile.png` and contains only synthetic booking records.

PITR drill restored to a separate private database. Worker result: status OK, restoredBookings 12, services 3, overlapConstraint true. Restored immutable booking SHA256: `285ffddf8508a9aa75aec3eba9a1fd190be76dd06d3f212054bc2ca013e38b21`. Mutable cancellation status was intentionally excluded because staging continued to receive tests after the recovery timestamp. Source staging records were not replaced. Scheduled volume backup operations were refused by OAuth grant. Recovery drill checks contents and schema constraints; it does not establish an ongoing recovery SLA or exercise every historical timestamp.

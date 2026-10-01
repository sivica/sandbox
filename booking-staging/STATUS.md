# Kindred staging — done and remaining

## Implemented
- Bundled React runtime and local system fonts.
- PostgreSQL services, room, opening hours, migrations and persisted bookings.
- Server-authoritative prices, UTC dates/slots and Europe/Skopje timezone handling.
- Overlap constraint, transaction protection and idempotent retries.
- Private token retrieval, confirmation after reload, cancellation and capacity release.
- Retained details on conflicts; pending-request recovery after interrupted responses.
- API validation, synthetic-email restriction, same-origin writes, bounded inputs and rate limiting.
- Unit, PostgreSQL integration and three-profile browser checks; separate GitHub Actions workflow.

## Verification and deployment
Verified source: `45772d3bf7a83e635476ddb1867a3236d1dd5f0f`.
- 5/5 date/calendar unit tests passed.
- 8/8 PostgreSQL API scenarios passed (9 Node test results including the parent group).
- 12/12 browser executions passed in 43.3s: 4 scenarios × Chromium mobile, WebKit mobile and Chromium landscape.
- Both [push CI](https://github.com/sivica/sandbox/actions/runs/36933482947) and [PR CI](https://github.com/sivica/sandbox/actions/runs/36933530739) succeeded. Reports/screenshots downloaded and the saved-confirmation image inspected.
- Private Railway deployment `15d72a0a-9ac7-490c-a45a-c35cc234266c` succeeded; logs confirm database migration/startup and ready server. No public domain exists, so live browser verification is not claimed.
- Automatic approval review rejected creating a public staging domain because internet exposure needs explicit approval. Enable it only after the owner's approval.
- Final formatting/evidence polish will be covered by the next CI run.


## Remaining for real customer use
- Actual buyer's provider/calendar and business rules.
- Authenticated administration, retention/deletion, backup/restore verification and monitoring.
- Any agreed notifications/payment integrations.
- Independent human developer and buyer acceptance.

Temporary Railway SSH key registration was rejected by automatic approval review. No key was registered. Database verification uses disposable PostgreSQL in CI instead.

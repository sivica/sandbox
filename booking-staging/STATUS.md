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
Verified code: `0a80b510c7e8f872d009508c836bc6514e6f227d`; later delivery-only edits preserve it.
- 5/5 calendar checks, 8/8 PostgreSQL API scenarios (9 Node results including parent), 12/12 browser executions passed in 48.9s with no retries.
- [Push CI](https://github.com/sivica/sandbox/actions/runs/36934271659) and [PR CI](https://github.com/sivica/sandbox/actions/runs/36934277944) succeeded. Downloaded evidence and settled confirmation inspected; see [report](evidence/REPORT.md).
- Private Railway deployment `3dd0fe52-d5e1-43fc-bb00-73480d5d8307` succeeded; logs show server ready after migrations.
- No public staging domain exists; no deployed-browser check is claimed. Automatic approval review requires explicit owner approval for internet exposure.
- The API implements /health and CI uses it for readiness; Railway's platform healthcheck path remains unconfigured. Configure/verify that before real customer launch alongside monitoring.


## Remaining for real customer use
- Actual buyer's provider/calendar and business rules.
- Authenticated administration, retention/deletion, backup/restore verification and monitoring.
- Any agreed notifications/payment integrations.
- Independent human developer and buyer acceptance.

Temporary Railway SSH key registration was rejected by automatic approval review. No key was registered. Database verification uses disposable PostgreSQL in CI instead.

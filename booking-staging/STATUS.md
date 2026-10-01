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
Date/calendar unit tests: 5/5 passed locally. Bundled build succeeded. PostgreSQL integration and browser CI results pending. Staging deployment pending. No complete verification claim until those checks finish.

## Remaining for real customer use
- Actual buyer's provider/calendar and business rules.
- Authenticated administration, retention/deletion, backup/restore verification and monitoring.
- Any agreed notifications/payment integrations.
- Independent human developer and buyer acceptance.

Temporary Railway SSH key registration was rejected by automatic approval review. No key was registered. Database verification uses disposable PostgreSQL in CI instead.

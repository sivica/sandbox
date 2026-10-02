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
- Owner approved public staging access. Preview: https://kindred-booking-staging-staging.up.railway.app/
- 12/12 deployed browser checks passed in approximately 1.3 minutes, with no retries. HTML/JS/CSS match the built source; /health returned HTTP 200.
- Browser-created test bookings were cancelled, releasing their slots. The database remains private.
- Railway startup health checks now use /health (60-second timeout). A separate five-minute cron worker records ongoing health checks.


## Remaining for real customer use
- Actual buyer's provider/calendar and business rules.
- Confirm production admin roles/MFA, retention policy, backup coverage and alert destination; staging controls are implemented.
- Railway dashboard confirms backup creation requires Pro; current workspace is Hobby and has no volume backups. CLI also returned OAUTH_INSUFFICIENT_GRANT. Reauthorization alone is insufficient.
- Any agreed notifications/payment integrations.
- Independent human developer and buyer acceptance.

Temporary Railway SSH key registration was rejected by automatic approval review. No key was registered. Database verification uses disposable PostgreSQL in CI instead.

## Staging operations addition
- Owner administration deployed: bookings/cancellation, service settings, opening hours, manual 90-day synthetic retention, audit log.
- Mobile admin sign-in/save/CSRF refusal/sign-out passed; first cloud health check recorded OK.
- 5 calendar checks, PostgreSQL API checks including administration, and 12 browser executions passed in CI; all 12 live booking checks passed.
- CI: https://github.com/sivica/sandbox/actions/runs/36992404429 and https://github.com/sivica/sandbox/actions/runs/36992408605
- PITR archive enabled and separate-database restore verified: 12 immutable booking rows matched, three services present, overlap constraint preserved. Temporary recovery services removed after verification.
- No outgoing alerts configured. Admin password is local outside the repository; do not distribute it.

## Backup dashboard inspection
On 2 October 2026 the authenticated dashboard showed PITR enabled and archive coverage, but no volume backups. Creating backups/PITR is restricted to Pro. A restore-target estimate exceeded the Hobby 5 GB volume limit; choose a target that fits or review plan/storage capacity before any future drill. The earlier separate restore succeeded, but that does not guarantee every target fits. Evidence: local kindred-operations-evidence/railway-backup-plan.jpg.

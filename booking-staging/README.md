# Kindred booking staging

Separate from the reviewed `booking-design-pilot/` prototype. This version adds a bundled React frontend, Node API, PostgreSQL persistence and server-authoritative sample availability. It is a staging implementation for a fictional business, not an accepted production booking service.

## Initial seed rules (before fictional profile activation)

- One treatment room, `studio-room`, in `Europe/Skopje` time.
- Monday–Saturday 09:00–18:00; Sundays closed. No holidays or staff calendars configured.
- Existing sample services: 60 minutes / €65, 45 minutes / €55, 30 minutes / €35.
- Starts every 15 minutes; at least 30 minutes' notice; booking window today through 30 local calendar days ahead.
- Slots must finish before closing. UTC instants are stored; the business timezone is used for display and availability. Ambiguous/nonexistent DST start times are excluded.
- Only invented customer details and `example.com`, `example.org`, `example.net` or `.test` emails are accepted. No email, payment or real appointment is created.
- Initial sample bookings can be cancelled immediately using the private token. The activated fictional profile applies the simulated 24-hour policy described below; actual business policy remains unapproved.

Draft staging PR: https://github.com/sivica/sandbox/pull/2

These are initial seed defaults pending a buyer's actual rules. The deployed staging profile now uses the explicit fictional studio rules described below; local databases retain the initial sample until activated. Seed rows are inserted once. Configuration changes require authenticated owner administration.

## Local setup

Use Node 24, PostgreSQL 17+ and a database owned by this staging application. The database user must be able to install `btree_gist` and apply migrations.

```sh
cd booking-staging
npm ci
cp .env.example .env
# Configure DATABASE_URL and a random BOOKING_TOKEN_SECRET of 32+ characters.
npm run build
node --env-file=.env server/migrate.js
node --env-file=.env server/index.js
```

Open http://127.0.0.1:4174. `.env` is ignored and must never be committed. Server startup applies migrations transactionally, serialized with a database advisory lock. Already-applied migrations are recorded in `schema_migrations`. This initial migration only creates this application's tables and sample data; it does not remove existing data.

## API

| Method / route | Purpose |
| --- | --- |
| GET /health | Database readiness; no credentials returned |
| GET /api/services | Services, business timezone and rolling date bounds |
| GET /api/slots?serviceId=glow&date=YYYY-MM-DD | Available UTC start/end instants with business-local labels |
| POST /api/bookings | Create a persisted test booking; UUID `Idempotency-Key` required |
| GET /api/bookings/:id | Retrieve a saved booking; `Authorization: Bearer TOKEN` required |
| POST /api/bookings/:id/cancel | Cancel/release capacity; same bearer token required |

Creation body: `{ serviceId, startsAt, name, email, note }`. `startsAt` must be an explicit UTC ISO instant ending in Z. Price, duration and availability come from the server, not customer input. Returns `{ booking, accessToken }`; a replay also returns `replayed: true`. Store the token privately. Receipt links use a browser-only URL fragment that is removed after local import; never share these bearer links or include them in public reports. No public booking-list endpoint exists; lookup responses omit email and note.

### Conflicts and retries

Transactions lock the sample resource row and recheck current availability. A PostgreSQL exclusion constraint prevents overlapping confirmed time ranges, including across different treatments. Adjacent appointments are allowed. Conflict returns HTTP 409 and requires another selection; customer fields remain available.

An identical request with the same key returns the same booking and token. Reusing the key with changed details returns 409. Replaying a cancelled booking returns its cancelled status and does not create another booking. The signing secret must remain stable: changing it invalidates tokens returned by old request replays.

Before submission the browser saves a pending request in session storage. A timeout/lost response keeps the exact request and key; edits are locked until a retry resolves the outcome. Reload can retry that saved request. A confirmed booking ID/token is saved in local storage so the same browser can retrieve the booking after reload. Storage can be blocked/cleared; an in-memory retry still works, but cross-reload recovery then cannot be guaranteed. Existing records remain in PostgreSQL.

## Verification

```sh
npx playwright install chromium webkit
npm test
```

Unit tests cover real dates, horizons, lead time, durations, overlap and DST boundaries. API tests use real PostgreSQL to cover simultaneous requests, durable retrieval through a new server instance, direct constraint enforcement, request replay, validation, token authorization, cancellation and rate limiting. They restore seed configuration and remove test records in a disposable database; the combined fictional scenario also clears operational records. Never use a shared/staging database for this suite. Browser checks cover mobile Chromium/WebKit and landscape, confirmation reload, response lost after database commit, conflict recovery, empty/unavailable/error states, axe scans and 200% text. Browser-created bookings are cancelled after each test.

`.github/workflows/booking-staging.yml` uses a disposable PostgreSQL service and uploads evidence. Historical prototype test results do not establish staging results; current results are recorded in STATUS.md.

## Deployment

Railway project `a549eb28-d30d-4e2d-a8ff-f632fac46f24`, environment `staging`. Services: `Postgres` and `kindred-booking-staging`. Database communication uses Railway's private network. Configure the app's `DATABASE_URL` as a reference to `Postgres.DATABASE_URL`, a private random `BOOKING_TOKEN_SECRET`, `HOST=0.0.0.0`, `PORT=8080`. Docker builds and serves bundled frontend assets; runtime React and fonts do not need an external CDN.

```sh
railway link --project a549eb28-d30d-4e2d-a8ff-f632fac46f24 --environment staging --service kindred-booking-staging
railway up . --path-as-root --service kindred-booking-staging --environment staging --detach
```

Public staging preview (owner-approved): https://kindred-booking-staging-staging.up.railway.app/

All 12 deployed browser checks passed, including saved confirmation after reload, conflict recovery, safe retry and cancellation. Use invented details only; this is not a real studio. CI/live evidence and deployment identifiers are in STATUS.md and evidence/REPORT.md. The API readiness endpoint is implemented; Railway's platform healthcheck path is not yet configured.

Check deployment health and intended environment before upload. Source pushes run CI but do not automatically deploy. Revert to a retained known-good app deployment if needed. Database rollback requires a separately planned migration; never drop booking tables as a routine rollback. PostgreSQL service/storage and API hosting incur Railway usage charges while running.

## Before accepting real customers

Confirm the actual provider/calendar, timezone, services, staff/resources, holidays, lead/cancellation rules and supported browsers. Review the implemented staging administration, retention controls, recovery evidence and monitoring against production requirements, and obtain business acceptance. Customer notifications and payment need separately agreed integrations.

The bearer token grants access/cancellation to one test booking; losing it means the owner needs database administration to retrieve it. API rate limiting is in-memory per instance, not a distributed abuse control. Database credentials remain server-side; browser writes are same-origin, bodies/fields bounded, queries parameterized, API responses not cached, security headers applied. These controls do not make this fictional staging system production-ready.

Physical iPhone/VoiceOver remains outside the pilot scope; full TalkBack listening/gesture assessment stays deferred. Browser emulation and axe scans do not establish complete accessibility conformance. Human developer and buyer acceptance remain pending.

## Staging administration and operations

Open `/admin.html` for the owner login. The deployment receives only `ADMIN_PASSWORD_HASH` (scrypt), never the plaintext password. Local credentials are stored outside the repository in `/Users/ivica/Work/kindred-staging-private/admin-credentials.txt`, permissions 0600. Do not share that file with the public handoff.

Administration supports paginated bookings, cancellation, service duration/price/availability, weekly opening hours, and an audit trail. An 8-hour HttpOnly/SameSite Strict cookie protects sessions; writes also require a session-bound CSRF token. Login failures are throttled per IP. Owner and read-only support accounts are available; neither has MFA. Changing service settings preserves existing booking duration and price. Opening-hour changes do not cancel existing appointments.

Retention is manual: preview then explicitly confirm deletion of synthetic bookings whose completion or cancellation was more than 30 days ago. Future confirmed appointments remain. Automatic booking deletion is off. Business retention rules still need buyer agreement; this sample policy is not a production policy.

Railway startup health checks use `/health` with a 60-second timeout. A separate `kindred-staging-monitor` cron service runs `node server/monitor.js` every five minutes, using private PostgreSQL and the public health endpoint. It writes checks to the admin operations view, keeps 30 days, and logs state changes without customer details. There is no outgoing notification integration. A failed cron execution is visible in Railway. Monitoring cannot record a failure while its database is unavailable, so inspect Railway execution status as well.

Railway PITR was enabled with a private archive bucket. Scheduled volume snapshot creation and scheduling were refused with `OAUTH_INSUFFICIENT_GRANT`. Authenticated dashboard inspection subsequently confirmed that creating backups requires Pro and this workspace is Hobby; no volume backups are present. A separate-database PITR restore drill succeeded: 12 restored immutable booking records matched staging, all three services were present, and the overlap constraint survived. Continuous archive coverage still needs dashboard inspection; scheduled volume snapshots remain unconfigured. Use a new sibling database for a drill; never restore a volume over staging. No account SSH key was registered.

Scheduled backups are deferred to production by user decision and nonblocking for this synthetic demo. Demo data can be rebuilt and reseeded. The existing PITR archive and completed drill remain recorded; this decision does not remove infrastructure. Configure and verify production backups before storing real customer bookings. No Railway upgrade is required for demo completion.

## Fictional studio demo profile

The new `/demo.html` operations page is owner-authenticated. “Activate fictional studio rules” opts into the simulation in `SIMULATED-RULES.md`: one Demo Relaxation service (60 minutes/MKD 1,400), weekdays 10–18, lunch 13–14, 24 elapsed hours' advance notice and 15-minute buffers. Existing booking times, prices and occupied windows are preserved. New reservations share one capacity lock representing the single practitioner/room pair; home/travel blocks conservatively reserve that same capacity. This supports the single-resource demo; independently scheduled multiple practitioners/rooms remain production integration work.

The calendar ledger enforces non-overlapping occupied windows across public bookings, owner entries and blocks. A closure overlapping confirmed appointments requires their explicit IDs and records owner contact tasks; it does not silently remove appointments. Rescheduling is transactional and rolls back to the original reservation if the replacement is unavailable. No-shows can be recorded 15 minutes after start and keep the occupied window. Customer self-cancellation is allowed at the exact 24-hour boundary; later requests remain reserved for owner handling. No fees or actual payments are processed.

Use the operations page to record synthetic inquiries, manual contact/reconciliation and attendance/payment outcomes. Contact route is a preference using an invented email-shaped identifier; it does not integrate email, Viber, Instagram or phone. Private customer receipts place the bearer token in the URL fragment, then remove it from browser history on retrieval. Anyone with the private receipt can access that test booking; never publish it.

A separate `support` account can view synthetic operational/audit history only, with no booking details or mutations. `SUPPORT_PASSWORD_HASH` configures its scrypt digest. Credentials remain outside the repository. MFA remains a production requirement and is not implemented for this disposable demo.

Manual retention now previews bookings completed/cancelled over 30 days ago. Weekly review status is visible; deletion remains explicit. The monitor trims operational records after 37 days and audit history after 90 days, and records failure/recovery alerts as log entries only. There are no outgoing messages. Economics CSV contains recorded synthetic outcomes; fee/time-value and success targets are fictional hypotheses, not measured income. Human duties (reconciliation, customer contact, refunds) are represented as manual records and cannot be claimed executed without an actual operator.

### Verification database safety

`npm test` requires a disposable PostgreSQL database. Integration tests change sample rules and clear test operational records; never point them at staging or production. Live staging verification uses synthetic API/browser requests, cancels only reservations it created, and leaves audit evidence intact.

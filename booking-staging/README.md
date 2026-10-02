# Kindred booking staging

Separate from the reviewed `booking-design-pilot/` prototype. This version adds a bundled React frontend, Node API, PostgreSQL persistence and server-authoritative sample availability. It is a staging implementation for a fictional business, not an accepted production booking service.

## Sample business rules

- One treatment room, `studio-room`, in `Europe/Skopje` time.
- Monday–Saturday 09:00–18:00; Sundays closed. No holidays or staff calendars configured.
- Existing sample services: 60 minutes / €65, 45 minutes / €55, 30 minutes / €35.
- Starts every 15 minutes; at least 30 minutes' notice; booking window today through 30 local calendar days ahead.
- Slots must finish before closing. UTC instants are stored; the business timezone is used for display and availability. Ambiguous/nonexistent DST start times are excluded.
- Only invented customer details and `example.com`, `example.org`, `example.net` or `.test` emails are accepted. No email, payment or real appointment is created.
- Test bookings can be cancelled immediately using the browser's private booking token. A real cancellation policy is not implemented.

Draft staging PR: https://github.com/sivica/sandbox/pull/2

These are implementation defaults pending a buyer's actual rules. Seed rows are inserted once; edit business configuration deliberately through migrations/database administration. No public administration endpoint exists.

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

Creation body: `{ serviceId, startsAt, name, email, note }`. `startsAt` must be an explicit UTC ISO instant ending in Z. Price, duration and availability come from the server, not customer input. Returns `{ booking, accessToken }`; a replay also returns `replayed: true`. Store the token privately, never in a URL or public report. No public booking-list endpoint exists; lookup responses omit email and note.

### Conflicts and retries

Transactions lock the sample resource row and recheck current availability. A PostgreSQL exclusion constraint prevents overlapping confirmed time ranges, including across different treatments. Adjacent appointments are allowed. Conflict returns HTTP 409 and requires another selection; customer fields remain available.

An identical request with the same key returns the same booking and token. Reusing the key with changed details returns 409. Replaying a cancelled booking returns its cancelled status and does not create another booking. The signing secret must remain stable: changing it invalidates tokens returned by old request replays.

Before submission the browser saves a pending request in session storage. A timeout/lost response keeps the exact request and key; edits are locked until a retry resolves the outcome. Reload can retry that saved request. A confirmed booking ID/token is saved in local storage so the same browser can retrieve the booking after reload. Storage can be blocked/cleared; an in-memory retry still works, but cross-reload recovery then cannot be guaranteed. Existing records remain in PostgreSQL.

## Verification

```sh
npx playwright install chromium webkit
npm test
```

Unit tests cover real dates, horizons, lead time, durations, overlap and DST boundaries. API tests use real PostgreSQL to cover simultaneous requests, durable retrieval through a new server instance, direct constraint enforcement, request replay, validation, token authorization, cancellation and rate limiting. They remove only records they created. Browser checks cover mobile Chromium/WebKit and landscape, confirmation reload, response lost after database commit, conflict recovery, empty/unavailable/error states, axe scans and 200% text. Browser-created bookings are cancelled after each test.

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

Confirm the actual provider/calendar, timezone, services, staff/resources, holidays, lead/cancellation rules and supported browsers. Add authenticated business administration, retention/deletion policy, backup/restore verification, monitoring and business acceptance. Customer notifications and payment need separately agreed integrations.

The bearer token grants access/cancellation to one test booking; losing it means the owner needs database administration to retrieve it. API rate limiting is in-memory per instance, not a distributed abuse control. Database credentials remain server-side; browser writes are same-origin, bodies/fields bounded, queries parameterized, API responses not cached, security headers applied. These controls do not make this fictional staging system production-ready.

Physical iPhone/VoiceOver remains outside the pilot scope; full TalkBack listening/gesture assessment stays deferred. Browser emulation and axe scans do not establish complete accessibility conformance. Human developer and buyer acceptance remain pending.

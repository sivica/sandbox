# Kindred booking concept — developer handoff

Updated 1 October 2026. Delivery: design prototype for review and implementation planning. Buyer/developer acceptance remains pending.

## Start here

- Live concept: https://booking-design-pilot-production.up.railway.app/
- Draft PR: https://github.com/sivica/sandbox/pull/1
- Published source baseline: `1d25ab1668513275a896b844f38a4a9debd9f07d`, folder `booking-design-pilot/`.
- Latest source adds browser tests, error-focus timing correction, semantic progress markup and relative text sizes. Railway deployment now matches the latest runtime; 33/33 live checks passed. See evidence/live/REPORT.md.
- Start with `STATUS.md` for completed and remaining work; `AUTOMATION.md` explains repeatable tests.
- Read `VERIFICATION.md`, `ACCEPTANCE.md` and `DEPLOYMENT.md` in this source folder.

## Scope

Interactive React web concept for a fictional studio. Five screens: services → service detail → day/time → customer details → confirmation. Mock availability, relative dates, EUR prices and a fixed demo reference. No real reservation, email, payment, backend, analytics or persistence. No ChatGPT subscription connection or AI integration is implemented. Native iOS/Android conversion is outside this source delivery.

## Run locally

From this source folder:

```sh
python3 -m http.server 8765
```

Open http://localhost:8765 . Python 3 and an internet connection are needed. React 18.3.1 loads from esm.sh; Google Fonts has local font fallbacks. Refresh loses all selections and entered details. Use invented details only.

## Source map

| File | Responsibility |
| --- | --- |
| index.html | Viewport, page title, CSS/module entry points |
| app.js | Mock service data, five-screen React flow, validation and demo states |
| styles.css | Design tokens, responsive layout, focus styling and reduced motion |
| Dockerfile | Static Caddy container, copies application files and this handoff |
| Caddyfile | Serves /srv on PORT (default 8080); Railway supplies HTTPS |
| .dockerignore | Excludes Git metadata and local previews from Docker context |
| TIMELOG.md | Historical creation effort with subsequent-work caveats |

In app.js, service content starts at `services`, screen titles at `names`, state/navigation at `App`, validation at `submit`, and form controls at `field`. Design tokens are at the top of styles.css. One small App function is appropriate for this concept; production responsibilities may justify separate screen components and explicit navigation/state logic.

## State and interaction rules

- Choosing a service opens its details. Pressing Choose a time clears the slot every time, including for the same service.
- Changing a day clears the slot. Continue requires a slot and available demo mode.
- In-app back preserves customer details and selections, unless a later action explicitly resets the slot. It is not browser-history navigation; no routes/deep links are implemented.
- Missing/invalid details keep the user on the form and focus the first invalid field. Inline errors remain while editing until the next submission. Email uses native validity; name must contain non-whitespace text.
- Submission lasts a simulated 700 ms. Customer fields, demo controls and back navigation are disabled. Confirmation uses a validated snapshot.
- Successful submission retains form values. Back from confirmation returns to those values. Explore treatments clears form/errors, slot and confirmed snapshot, resets demo mode and returns to services; the previously selected day/service remain in memory.
- No state is saved across reloads. No information is sent by the mock submission.

## Demonstration controls

Loading/empty appear on services; unavailable covers all mock days on time selection; error simulates failed submission. Show sample menu/availability restores normal mode. Failure retains details; select normal mode and retry. The controls and 700 ms timer are developer demonstration tools, not production requirements.

The version switch compares a constructed illustrative draft with the reviewed layout. It is not an archived AI output or evidence of measured improvement.

## Verified status and limits

Browser regression checks at 360px and 390px covered the five screens, pending control lock, validated confirmation, native email rejection, first-invalid-field focus, failure/retry and unavailable recovery. Android API 36 Chrome emulator checks covered five-screen portrait use, keyboard/email correction, pending rendering, back retention and recovery.

TalkBack captions on the emulator and physical Pixel confirmed steps 2–5 and required-name speech. Physical Pixel validation/back/failure retry passed targeted checks on the earlier deployment. Email-error speech remains inconclusive. New source has 21 passing local browser executions and normal-screen axe checks; it is not yet deployed. Independent human acceptance remains open. Full Android gesture/audio assessment is deferred by owner request and is not a prototype handoff blocker. Physical iPhone/VoiceOver testing is outside the pilot scope by owner request and remains unverified. See STATUS.md and VERIFICATION.md for exact evidence boundaries.

## Production planning

Agree target platform, booking integration, timezone/business hours, slot conflicts/locking, server validation, idempotent submission, confirmation IDs, notification behavior, data retention, payment/tax and cancellation rules. These are decisions to scope, not implemented features. The API contract and ownership checklist are in ACCEPTANCE.md.

A maintained release needs a bundled dependency build/lockfile, reproducible container version, agreed asset/font policy and release/rollback process. External runtime imports and the mutable Caddy image tag remain prototype limitations.

## Acceptance and revision

The concept scope is five screens and one consolidated revision. New integrations, screens or native conversion require revised scope. The handoff is available for receiving-developer review; acceptance and production estimation are pending. Agent review does not establish independent developer approval, buyer willingness to pay or measured time saved.

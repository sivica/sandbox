# Kindred booking concept — developer handoff

## Status and scope

Interactive React concept for a fictional studio. Five screens: service list, service detail, day/time selection, customer details, confirmation. Uses mock availability, relative dates, EUR prices and a fixed demo reference. No real reservation, email, payment, backend or persistence.

## Open it

From this folder run `python3 -m http.server 8765`, then open `http://localhost:8765`. React 18.3.1 loads from esm.sh; fonts load from Google Fonts. Internet is required for React. Fonts have local fallbacks. For production, bundle dependencies locally, lock versions and choose an approved asset/font policy. No build installation is required for this concept.

## Files and components

- `index.html`: mobile viewport and entry point.
- `app.js`: React application, mock services and state-driven journey. Uses createElement so no JSX transpiler is needed. Shared render helpers: buttons, service summary and form fields.
- `styles.css`: tokens for ink, muted text, paper, border, accent, spacing and radius; mobile layouts and reduced-motion treatment.

State is in memory. Going back preserves selections and entered text. Selecting a service resets the time when advancing to the day/time screen. The confirmation action clears the form for a fresh journey. No analytics or network submission code is included. Do not enter sensitive or actual customer information.

## Demonstration states

The Demo state control exposes loading and an empty menu on screen 1, unavailable slots on screen 3, and a simulated submission failure on screen 4. Normal mode restores the happy path. Submission shows a short pending state; errors retain entered details. All availability is invented. Controls are developer demonstration tools, not customer-facing production features.

## Review value shown

The version switch contrasts the reviewed concept with a constructed initial layout. It is not an actual archived AI result or evidence of measured improvement. The reviewed version adds consistent spacing, reusable service hierarchy, clearer selected states and a coherent visual system. Validation, recovery and handoff are explicit; a developer should judge their usefulness rather than accept the claim from appearance alone.

## Developer assessment — pending, not performed

1. Open source using the documented command. Can you understand and change one service and a design token?
2. At 390px and 360px, walk through all five screens and back navigation. Check overflow, focus visibility, keyboard operation, contrast and touch targets.
3. Exercise empty, loading, unavailable and failed-submit states. Enter missing/invalid details; confirm inline errors and retry behavior.
4. Confirm whether React web is a useful handoff for your intended platform. Native iOS would need translated components and navigation; this source is not a native app.
5. Record missing interactions and blockers, useful elements, estimated production engineering and whether the format saves you time.

A separate browser review of the original PR commit exercised all five screens at 360px and 390px and reproduced three correctness/accessibility issues plus two smaller UI issues. This revision addresses those findings, but the revised behavior has not been checked in the browser. No automated tests or independent production-developer assessment have been completed. Physical-device and screen-reader checks remain pending.

## Production decisions still needed

Real dates/timezones and business hours; server-authoritative slot locking; authentication if required; reliable booking IDs; validation/security and data retention; notification consent and delivery; pricing/tax/payment rules; cancellation policies; accessible screen announcements and focus management; browser/device coverage; production build/deployment. Form submission currently uses a timer and must be replaced with a booking API.

## Acceptance and revision

The target concept journey is service → time → details → confirmation. The operating plan allows one consolidated revision within the five screens; new integrations, screens or platform conversion need revised scope. Acceptance is not yet confirmed: use the developer checklist above before calling this ready for a paid pilot.

## Review fixes in this revision

- Freeze all customer fields and demo controls during submission; confirmation uses a validated snapshot.
- Use native email validity while retaining custom inline errors. Focus the first invalid field.
- Focus each new screen heading and announce the step through a polite live region. Screen-reader behavior needs follow-up assessment.
- Explain that unavailable mode covers every mock day, and name the working recovery button.
- Place mobile demo controls in a grid with an explicit gap; format source with pinned Prettier.

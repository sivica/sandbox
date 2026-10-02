# Kindred reusable design export

Run `npm ci`, `npm run build`, then `npm start`. Open http://127.0.0.1:4185/gallery.html. Select a direction with `?design=calm-spa`, `clean-clinic` or `modern-boutique`.

This is a React 18 web preview using synthetic browser fixtures, not a native Android app or a self-service AI generator. Generation/refinement happens through Codex with the existing authorized subscription.

## Integration contract

`src/booking-app.js` exports BookingApp({requestApi}), combining the preserved booking controller and presentation. requestApi defaults to the HTTP adapter in src/booking-api.js; supply a compatible async (path, options) adapter for another host. `src/fixtures.js` implements a preview-only fetch adapter. Never bundle it into the real staging client. Integrate `public/design.css` and tokens with the real app; maintain `/api/services`, `/api/slots`, booking creation/retrieval/cancellation shapes. The controller remains the source of reservation state; generated styles do not own retries or persistence.

Preview bookings persist only in localStorage. Clear site storage to reset. Theme and scenario are query parameters. Fixtures are illustrative; real calendar/conflict/authorization correctness must be checked against disposable PostgreSQL and the actual backend.

Tokens: design-tokens.json. CSS: public/design.css. No remote fonts or external images. Source revision and verification results accompany the final package. No credentials or real data belong here.

Verification scripts use Playwright and axe from the repository's booking-staging development dependencies; they are not required to run the exported application. The export ZIP excludes those verification scripts. Query `scenario` supports loading, empty, no-services, availability-error, conflict, unresolved and late-cancellation for design review; these are synthetic demonstrations, not backend tests.

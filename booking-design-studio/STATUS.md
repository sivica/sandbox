# Studio status

## Done
- Three planned screens implemented as a local visual prototype.
- Authored samples, five-screen gallery above refinement input, project menu, appearance/style separation.
- Local persisted projects/versions and ZIP export of the trusted booking baseline plus proposal files.
- Electron main/renderer boundary, no privileged preview bridge, no generated executable code.
- Build completed successfully; browser opened and sample gallery/menu rendered.

## Personal mode implemented
- Original ChatGPT subscription connector, official browser OAuth with PKCE/state/nonce and verified identity.
- Encrypted credentials, separate personal storage, account model discovery, renewable-token rotation and completed-response-only generation.
- Run `npm ci`, `npm run build`, then `npm run personal`.
- Build passed; application launched. Mac locked: real account sign-in and inference remain unverified.

## Left
- Complete personal ChatGPT sign-in and grant plan access after unlocking the Mac. Commercial distribution eligibility remains separate.
- Verify the implemented subscription authorization, inference, renewal, revocation and limit recovery with a real account.
- Model-supported reference-image submission (currently local preview/removal only).
- Full interactive proposal preview and automatic screen-copy integration (current previews are static; runnable booking baseline is included in exports).
- Browser/mobile, export clean-install, security and screen-reader acceptance checks; not run this phase.
- Actual connected generation/refinement/export demo footage; no fictional generation claims.

No production deployment or monitoring restart. The existing booking backend remains unchanged.

## Review corrections completed
- Malformed, Unicode, duplicate and oversized callback state is rejected before constant-time comparison; parsing failures are contained.
- Pending results preserve newer drafts and cannot replace a newly selected version/sample.
- Failed operations return safe session state; invalid credentials clear stale models and expose reconnect.
- Active account identity and registration are visible; saved account selection is distinct from Add account. Routine sign-in does not force consent.
- Preview, rename and account dialogs have accessible names.
- Dedicated studio CI covers build plus synthetic protocol, browser, recovery and export checks; PR scope updated.

Verification: build passed; 18 protocol checks, 13 browser/export checks and one terminal-session recovery check passed (32 total). All identity/model responses are synthetic; encryption tests use a fake implementation. Actual macOS keychain, account access, inference, renewal/revocation, physical devices and screen-reader listening remain unverified. The existing video remains an authored-sample prototype.

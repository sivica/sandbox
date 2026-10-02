# Automated demo completion

Target: SIMULATED-RULES.md. All selected rules are fictional; actual owner and developer acceptance remain pending. No real bookings or messaging.

## Work in dependency order

1. [x] Save simulated requirements and distinguish requirements approval from launch approval.
2. [ ] Add an explicit opt-in demo profile: one 60-minute MKD 1,400 service; weekdays 10–18; lunch 13–14; 24-hour lead; 15-minute starts; 30-day horizon; 15-minute preparation and cleanup.
3. [ ] Persist occupied windows separately from treatment starts/ends; enforce conflicts on occupied windows and serialize entries/blocks using the same resource lock. Keep existing booking data valid during migrations.
4. [ ] Add owner-created synthetic reservations and calendar blocks, with source channel, shared practitioner/room capacity, travel blocks and explicit handling of appointments affected by closures.
5. [ ] Enforce exact 24-hour self-cancellation boundary; provide owner-handled late requests, no-show record without releasing the original occupied window, and atomic rescheduling that preserves the old booking on failure.
6. [ ] Complete synthetic contact preference, private receipt/recovery, unconfirmed inquiry fallback and manual contact/reconciliation records. No real messages or new public bearer tokens in logs.
7. [ ] Add owner/support-viewer permissions, simulated alert records, 30-day completed/cancelled-data retention preview and 90-day audit retention. Weekly booking deletion stays manual; record overdue review without deleting unapproved records.
8. [ ] Add a synthetic economics log and export with inquiry/channel, total administration time, intervention/error and attendance/payment outcomes. Show fictional fee and targets separately from actual measured results; never fabricate achieved savings.
9. [ ] Verify each scenario 1–5b, API auth/resource conflicts, migrations and existing booking regressions; publish evidence to PR #2. Deploy only staging after checks pass; update package and short tracker.

## Current implementation comparison

Available: one room, persisted booking, transaction/exclusion protection, idempotent retry/reload, cancellation, owner login/CSRF, service and hours edits, manual 90-day retention, audit log, five-minute health history and verified separate recovery drill.

Missing or different: profile/service/currency, occupied buffers/lunch, staff/travel blocks, owner entry, cancellation deadline/late requests, reschedule/no-show, viewer role, contact choices/manual operation records, 30-day retention and economics log. Existing checks establish the previous sample behaviour only.

## Dependencies automation cannot approve

Real calendar/provider and owner decisions; real commercial agreement and willingness to pay; MFA/provider selection for production; actual human acceptance; actual outgoing alert destination. Keep these pending. The simulated email recipients are illustrative and must not be contacted. Scheduled backups are deferred to production and are not a demo completion gate. Configure and verify backups before real customer data.

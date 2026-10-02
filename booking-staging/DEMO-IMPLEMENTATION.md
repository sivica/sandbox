# Automated demo completion

Target: SIMULATED-RULES.md. All selected rules are fictional; actual owner and developer acceptance remain pending. No real bookings or messaging.

## Work in dependency order

1. [x] Save simulated requirements and distinguish requirements approval from launch approval.
2. [x] Add an explicit opt-in demo profile: one 60-minute MKD 1,400 service; weekdays 10–18; lunch 13–14; 24-hour lead; 15-minute starts; 30-day horizon; 15-minute preparation and cleanup.
3. [x] Persist occupied windows separately from treatment starts/ends; enforce conflicts on occupied windows and serialize entries/blocks using the same resource lock. Keep existing booking data valid during migrations.
4. [x] Add owner-created synthetic reservations and calendar blocks, with source channel, shared practitioner/room capacity, travel blocks and explicit handling of appointments affected by closures.
5. [x] Enforce exact 24-hour self-cancellation boundary; provide owner-handled late requests, no-show record without releasing the original occupied window, and atomic rescheduling that preserves the old booking on failure.
6. [x] Complete synthetic contact preference, private receipt/recovery, unconfirmed inquiry fallback and manual contact/reconciliation records. No real messages or new public bearer tokens in logs.
7. [x] Add owner/support-viewer permissions, simulated alert records, 30-day completed/cancelled-data retention preview and 90-day audit retention. Weekly booking deletion stays manual; record overdue review without deleting unapproved records.
8. [x] Add a synthetic economics log and export with inquiry/channel, total administration time, intervention/error and attendance/payment outcomes. Show fictional fee and targets separately from actual measured results; never fabricate achieved savings.
9. [x] Verify each scenario 1–5b, API auth/resource conflicts, migrations and existing booking regressions; publish evidence to PR #2. Deploy only staging after checks pass; update package and short tracker.

## Current implementation and verification

All fictional demo steps are implemented and deployed. See evidence/DEMO-REPORT.md for exact source, CI, live checks and limitations. Manual reconciliation, contact, refunds and weekly retention remain operator duties represented by records; they are not claimed executed for real customers.

## Dependencies automation cannot approve

Real calendar/provider and owner decisions; real commercial agreement and willingness to pay; MFA/provider selection for production; actual human acceptance; actual outgoing alert destination. Keep these pending. The simulated email recipients are illustrative and must not be contacted. Scheduled backups are deferred to production and are not a demo completion gate. Configure and verify backups before real customer data.

# Fictional demo completion — 2 October 2026

Implemented and deployed source: `4816737e7e318ee18422aa7342d51e5a563d4770`. Later handoff-only commits do not change this runtime. The fictional profile was explicitly activated on staging; original booking rows were preserved.

## Automated checks

- [Push CI](https://github.com/sivica/sandbox/actions/runs/37032906968) and [PR CI](https://github.com/sivica/sandbox/actions/runs/37032913283): successful.
- 6 calendar checks; 11 PostgreSQL Node results (9 initial API subtests plus their parent and the combined fictional-scenario test); 12 browser executions, all passed, no retries.
- Browser profiles: Chromium Pixel 7, mobile WebKit and Chromium landscape. The 12 regression executions completed in 39.9 seconds in PR CI.
- Disposable PostgreSQL verified migrations, database constraints, owner/web conflicts, explicit closure cancellation, contact-task creation, atomic reschedule rollback/success, exactly-24-hour cancellation versus 23h59m owner request, no-show at 15 minutes retaining occupancy, economics export, 30-day retention and viewer restrictions.
- Calendar checks verify 10:15 first/16:45 last treatment starts, 90-minute occupied windows, lunch exclusion, lead time and timezone/DST handling. Travel/other blocks use the same occupied-window ledger and resource lock. Multi-resource independent staff scheduling is outside this single-capacity demo.
- Lost-response retry, reload, details preserved after conflict and accessibility regression checks pass in the existing browser suite (initial seed profile). New fictional profile received the separate live walkthrough below.

## Live verification

App deployment `543ea345-166b-4327-8e89-f2b04f33d8a9`: SUCCESS. Monitor deployment `77c50a85-d3bc-43a1-ad5a-80023b3cd28e`: SUCCESS. Startup health endpoint remains `/health`, timeout 60 seconds; monitor schedule remains every five minutes.

Synthetic API and mobile Chromium walkthrough passed:

1. Explicit activation; one Demo Relaxation service at MKD 1,400; buffered slots omit lunch and 17:00.
2. Public booking and repeated request return the same reservation.
3. Owner reservation and travel block reject occupied capacity; failed reschedule returns conflict.
4. Manual inquiry/reconciliation records and typed economics CSV work.
5. A fresh browser retrieves a private fragment receipt; fragment is removed from the address, and reload retrieves the same booking.
6. Owner operations renders at Pixel 7 width with no horizontal document overflow.
7. Support login redirects to operational logs; booking reads and profile mutations are denied with 403.
8. All five customer screens work with the new fictional service and phone contact preference; reload and self-cancellation succeed.
9. Latest recorded cloud health execution was OK at 16:20:42 UTC. The updated scheduled worker recorded HTTP 200 / OK at 16:25:32 UTC.

Test reservations were cancelled through owner administration in cleanup. Test log entries remain as synthetic verification evidence, not actual pilot measurements. Browser sessions were signed out and closed. No real message or payment was sent, and no database was exposed.

## Evidence and limits

Screenshots: `demo-mobile-owner.png`, `demo-mobile-receipt.png`, `demo-mobile-support.png` in this directory. Machine-readable local run record: `/Users/ivica/Work/kindred-operations-evidence/demo-verification.json`. Private verification runner and credentials remain outside source/package. Receipt screenshot contains invented details and a reservation reference, no access token.

Contact, reconciliation and refunds are manual duties; records represent work/status, not actual delivery. Alerts are log-only. Weekly synthetic booking retention is explicit and displays overdue review; automated booking deletion is disabled. Monitor trims audit history after 90 days and non-economics operational records after 37 days. Economics records contain test inputs; no savings or income have been established. MFA, real calendar/notification/payment integrations, business decisions and independent human acceptance remain production dependencies. Scheduled backups are deferred to production under the user's decision; existing archive and earlier recovery evidence are preserved.

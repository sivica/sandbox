# Production decisions and acceptance

Status: staging is verified; production approval is pending.

A candidate-based, unbranded [pilot specification](PILOT-SPEC.md) is ready for owner review. Its public facts are not approved business rules.

## Buyer decisions

- Name the real calendar/provider and business owner.
- Confirm services, prices, durations, timezone, opening hours, closures and capacity.
- Confirm lead time, booking horizon, slot interval and cancellation policy.
- Approve retention, account roles/MFA and the destination for operational alerts.
- Decide whether notifications or payments are required; define scope before implementation.

Current sample defaults: Europe/Skopje, one room, Monday–Saturday 09:00–18:00, Sunday closed; 30-day horizon, 30-minute lead time, 15-minute starts. Services are sample 60/45/30-minute treatments at €65/€55/€35. Manual retention only removes synthetic appointments ended over 90 days ago. These are not buyer-approved production rules.

## Receiving developer walkthrough

1. Read README and STATUS; review draft PR #2 against its base branch.
2. Set up disposable PostgreSQL and dummy secrets; build and run the documented checks.
3. Walk through booking, conflict recovery, lost-response retry, reload and cancellation.
4. Review owner session/CSRF controls, service edits, opening hours and retention confirmation.
5. Review Railway health worker, recovery drill evidence and the remaining snapshot permission gap.
6. Record blocking findings with file/line, reproduction and required correction.
7. Record explicit acceptance, name, date and any accepted limitations.

## Buyer walkthrough

1. Try the staging preview with invented details and example.com or .test email.
2. Choose a service/date/slot; correct an invalid entry; submit, reload and cancel.
3. Review administration with the owner; confirm the business rules above.
4. Record each mismatch and the expected behaviour.
5. Record explicit acceptance, name, date and agreed scope.

No human acceptance is recorded yet. Automated or role-play reviews do not replace it.

## Operational automation

Cloud: Railway checks staging every five minutes even when the Mac sleeps.
Chat follow-up: active hourly automation “Kindred staging follow-up”; checks health, CI and actionable staging work, and reports only meaningful changes. Depends on the Mac and Codex being available.
Snapshots: current Railway OAuth grant refused scheduling/creation. Reauthorize Railway for this project or enable daily/weekly snapshots in its dashboard, then verify the result. No SSH credentials are required or registered for this flow.

Do not launch for real customers until production decisions and acceptance are recorded. Keep real customer data out of staging.

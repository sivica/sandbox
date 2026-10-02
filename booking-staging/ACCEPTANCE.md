# Production decisions and acceptance

Status: fictional demo is complete. Actual owner review is not a demo requirement. Production approval is pending before real customer use.

A candidate-based, unbranded [pilot specification](PILOT-SPEC.md) is ready for owner review. Its public facts are not approved business rules. The simulated owner review corrections are incorporated: every-channel calendar responsibility, confirmation duties, cancellation operations, pilot economics and staged approval. Actual owner acceptance remains pending.

## Buyer decisions

- Name the real calendar/provider and business owner.
- Confirm services, prices, durations, timezone, opening hours, closures and capacity.
- Confirm lead time, booking horizon, slot interval and cancellation policy.
- Approve retention, account roles/MFA and the destination for operational alerts.
- Decide whether notifications or payments are required; define scope before implementation.

Current staging is explicitly activated with the fictional demo profile in SIMULATED-RULES.md: one 60-minute MKD 1,400 service; weekdays 10–18; lunch 13–14; 15-minute preparation/cleanup; 24-hour lead; 30-day horizon; 15-minute starts; exact 24-hour self-cancellation cutoff. These are simulated assumptions, not buyer-approved production rules. Local seed databases use the earlier sample until profile activation. Synthetic retention is manual after 30 days from completion/cancellation.

## Receiving developer walkthrough

1. Read README and STATUS; review draft PR #2 against its base branch.
2. Set up disposable PostgreSQL and dummy secrets; build and run the documented checks.
3. Walk through booking, conflict recovery, lost-response retry, reload and cancellation.
4. Review owner session/CSRF controls, service edits, opening hours and retention confirmation.
5. Review Railway health worker, recovery drill evidence and the production-only backup requirement.
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
Snapshots: dashboard confirms backup creation requires Pro, while the current workspace is Hobby; no volume backups exist. CLI also refused scheduling/creation. Scheduled backups are deferred to production and nonblocking for the synthetic demo. No upgrade is needed to finish the demo; configure and verify backups before real customer data. No SSH credentials are required or registered for this flow.

Do not launch for real customers until production decisions and acceptance are recorded. Keep real customer data out of staging.

## Fictional demo completion

[Simulated rules](SIMULATED-RULES.md) are approved as a simulation. [Automated implementation checklist](DEMO-IMPLEMENTATION.md) tracks adoption and verification; the fictional implementation is deployed and verified. Requirements and automated checks do not constitute human acceptance or production approval.

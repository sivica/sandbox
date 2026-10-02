# Single-service booking pilot — owner review draft

Status: proposed, unbranded, synthetic demonstration only. A candidate business has been selected for research; its participation and rules have not been approved.

## Purpose and scope

Help an owner assess whether a simple booking flow reduces appointment coordination. Start with one service and one owner-approved calendar. Measure completed bookings, coordination time and booking errors. Inquiry volume, buyer demand and financial benefit are unknown.

## Public reference facts

Reference: [Spasic Therapy website](https://spasictherapy.com/), inspected 2 October 2026.

- Advertised relaxation massage: 60 minutes, MKD 1,400.
- The site offers booking through Viber and Instagram and displays a calendar interface.
- It advertises home treatments as well as a studio address in Aerodrom, Skopje.

These facts identify a candidate workflow, not an integration contract. The real calendar backend, live availability, actual capacity and whether the price is current are unverified. The extracted page includes an October 2023 calendar heading; do not treat the displayed calendar as verified live availability.

## Proposed pilot configuration

| Item | Draft | Approval needed |
| --- | --- | --- |
| Service | Relaxation massage, 60 minutes | Confirm service and whether preparation is included |
| Price | Advertised MKD 1,400 | Confirm current price, taxes and studio/home differences |
| Delivery | Studio appointments only for the initial pilot | Confirm owner can offer this scope; home visits need travel rules |
| Calendar | One authoritative owner calendar | Identify provider/account and connection permissions |
| Capacity | One appointment at a time for the demo | Confirm practitioner/resource capacity |
| Timezone | Europe/Skopje | Confirm |
| Hours and closures | Unknown | Supply weekly hours, breaks, holidays and exceptions |
| Buffer | Unknown | Supply preparation/cleanup time before and after appointments |
| Lead time/horizon | Unknown | Decide advance notice and how far ahead customers can book |
| Cancellation | Unknown | Supply deadline, fees, no-show and rescheduling rules |
| Confirmation | Demo confirms only a synthetic reservation | Decide when a real booking becomes confirmed and which system records it |
| Payment/notifications | No pilot commitment | Decide if required and agree scope separately |

The running Kindred staging app still uses its existing sample services, EUR prices and sample hours. This proposal does not change deployed settings or represent the candidate business publicly.

## Customer and owner flow

1. Customer selects the approved service and a date.
2. Calendar availability is checked against hours, closures, buffers and existing appointments.
3. Customer selects a time and supplies only the agreed booking details.
4. On submission, availability is checked again. A retry must not create a duplicate.
5. Customer receives the agreed confirmation or a clear request to choose another slot.
6. Owner can inspect or cancel the booking; customer cancellation follows the approved policy.

For demonstrations, use invented names and example.com or .test emails. No clinical history or symptom collection is proposed. Real customer intake requirements need separate definition.

## Five scenarios for owner approval

| Scenario | Proposed behaviour | Owner decision |
| --- | --- | --- |
| Last appointment of the day | Show a slot only if treatment and required buffer finish within working hours | Confirm closing time and buffers |
| Two customers select the same time | First valid booking wins; second retains details and chooses another slot | Confirm capacity and authoritative calendar |
| Owner blocks a holiday or break | A blocked period cannot be booked; existing appointments need an explicit handling decision | Confirm who manages closures and exceptions |
| Customer cancels close to appointment | Apply the approved deadline/fee; show the rule before submission | Define cutoff, refund/fee and rescheduling policy |
| Home visit or interrupted submission | Home visit goes outside studio-only scope; repeated submission creates at most one booking | Confirm delivery scope and retry behaviour |

## Owner response sheet

- Calendar/provider and owner: __________
- Studio-only scope accepted: yes / no; changes: __________
- Service, duration and current MKD price: __________
- Weekly hours, closures and buffers: __________
- Lead time, horizon and capacity: __________
- Cancellation, no-show and rescheduling rules: __________
- Confirmation, notifications and payments: __________
- Data retention, admin roles and alert recipient: __________
- Scenarios approved: 1 / 2 / 3 / 4 / 5; required corrections: __________
- Owner name, approval date and agreed scope: __________

## Next milestone

Obtain the owner's completed response and explicit approval. Then assess calendar integration feasibility, agree a measurable pilot and implement only the accepted rules. The receiving developer's acceptance remains separate. No owner outreach or approval has occurred.

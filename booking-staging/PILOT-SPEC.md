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

## Calendar responsibility and daily operations

Name the authoritative calendar, each practitioner/room and the person responsible for keeping every booking channel current. Appointments taken through messaging, phone or another system must block the resources they use. Other services, home visits and associated travel also block shared resources even though home visits are outside this pilot’s customer booking scope.

Agree when manual appointments are entered, how updates synchronize, and who resolves mismatches. If availability cannot be verified, use the agreed fallback rather than presenting an unverified time as confirmed. Integration feasibility must establish how conflicts across channels are prevented or detected; the existing staging database alone cannot prevent external-calendar conflicts.

Choose instant confirmation or owner approval. Define minimum contact details, confirmation/cancellation delivery, the owner’s checking or notification duty, response time for pending requests and an outage fallback. Show “confirmed” only after the authoritative reservation is recorded. Automatic notifications may remain outside scope if the owner approves a workable manual process.

Define the full occupied window as preparation + treatment + cleanup, with each buffer counted once. Record how travel affects that window. Cancellation cutoffs must be expressed relative to the appointment’s Europe/Skopje start. Name who contacts customers affected by owner cancellations/closures, offers rescheduling or refunds, records the result and releases the slot. Define fee collection/refunds or explicitly agree that the pilot has no cancellation fee.

## Customer and owner flow

1. Customer selects the approved service and a date.
2. Calendar availability is checked against hours, closures, buffers and existing appointments.
3. Customer selects a time and supplies only the agreed booking details.
4. On submission, availability is checked again. A retry must not create a duplicate.
5. After the authoritative reservation is recorded, customer receives the agreed confirmation. Owner-approval requests remain clearly pending until approved; failed reservations offer the agreed fallback or another slot.
6. Owner can inspect or cancel the booking; customer cancellation follows the approved policy.

For demonstrations, use invented names and example.com or .test emails. No clinical history or symptom collection is proposed. Real customer intake requirements need separate definition.

## Five scenarios for owner approval

For each row, record **Accepted / Change required / Not applicable**, the expected result and any correction. Assess 5a and 5b separately.

| Scenario | Proposed behaviour | Owner decision |
| --- | --- | --- |
| 1. Last appointment of the day | Show a slot only when the full occupied window fits working hours | Give one worked example: preparation, 60-minute treatment, cleanup, closing time and last valid start; count buffers once |
| 2. Two customers select the same time | At most one reservation for the same resource; unsuccessful customer retains details | Confirm capacity; include contention with an appointment entered through another channel |
| 3. Owner blocks a holiday or break | Block new bookings; explicitly handle existing appointments | Name who creates blocks, contacts customers, and keeps, reschedules or cancels existing appointments |
| 4. Customer cancels close to appointment | Show the agreed policy before submission and apply it at the exact cutoff boundary | Define cutoff, fee/refund collection, rescheduling, slot release and owner-cancellation handling |
| 5a. Home visit | Route inquiry to the agreed channel; block shared practitioner resources and travel | Confirm studio-only pilot scope, routing and travel rules |
| 5b. Interrupted submission | Lost reply/reload recovers the result or safely retries, with at most one reservation and clear status | Confirm retry behaviour in the authoritative calendar and pending/confirmed wording |

## Pilot economics and decision to continue

The advertised treatment price is separate from the booking product’s fee. Willingness to pay and financial benefit remain unknown.

Agree a baseline and bounded pilot before offering a paid live trial. Measure completed appointments (define whether this means attended and/or paid), coordination minutes, owner interventions and conflicts/errors. Name who records each measure and compare against a comparable baseline period or inquiry sample. Avoid attributing all changes to the product if demand, staffing or prices change.

| Pilot term | Owner-agreed value |
| --- | --- |
| Baseline period/sample and workload | __________ |
| Pilot duration or booking-volume limit | __________ |
| Completed-appointment definition | __________ |
| Measurement owner and recording method | __________ |
| Coordination time, interventions and errors at baseline | __________ |
| Pilot fee, currency and payment terms | __________ |
| Included setup, support hours and response time | __________ |
| Ongoing price and external calendar/notification costs | __________ |
| Success thresholds | __________ |
| Stop criteria and fallback to existing process | __________ |
| Review date and person deciding stop/continue | __________ |

Estimate value using owner-supplied inputs: time saved × agreed value of owner time, plus contribution from genuinely incremental completed appointments, minus product and operating costs. Do not treat treatment revenue as profit or count the same benefit twice. A positive estimate is a hypothesis until the pilot measures it.

## Owner response sheet

- Calendar/provider, account permissions and responsible owner: __________
- Every booking channel, update timing/sync and mismatch responsibility: __________
- Practitioner/room capacity, other-service blocks and home-visit/travel rules: __________
- Studio-only scope accepted: yes / no; changes: __________
- Service, duration and current MKD price (including applicable taxes): __________
- Weekly hours, closures, preparation and cleanup buffers: __________
- Lead time, horizon and slot interval: __________
- Cancellation cutoff, no-show/rescheduling, fees/refunds and collection method: __________
- Owner cancellation/closure procedure and responsible person: __________
- Instant confirmation or approval, minimum contact method and pending response time: __________
- Customer delivery, owner checking/notification duties and outage fallback: __________
- Data retention, admin roles and alert recipient: __________
- Pilot economics table completed: yes / no; outstanding items: __________

| Scenario | Accepted / Change required / Not applicable | Expected result and correction |
| --- | --- | --- |
| 1 | __________ | __________ |
| 2 | __________ | __________ |
| 3 | __________ | __________ |
| 4 | __________ | __________ |
| 5a | __________ | __________ |
| 5b | __________ | __________ |

## Approval stages and next milestone

1. **Requirements review:** owner completes the response sheet and scenario results. This approves the requirements draft only.
2. **Feasibility and cost:** receiving developer assesses calendar/resource integration and fallback; owner reviews setup, support and operating costs.
3. **Pilot terms:** agree scope, duration/volume, measures, fee, support, success/stop criteria and review date.
4. **Live-pilot acceptance:** record explicit owner approval of that specific scope and operational readiness. Receiving-developer acceptance remains separate.

For each stage record owner/reviewer name, date, approved document revision, scope, accepted limitations and unresolved items: __________

Next: obtain the real owner’s requirements response. No owner outreach, participation, willingness to pay or actual approval has been established. The simulated owner review improved this proposal and does not complete any approval stage.

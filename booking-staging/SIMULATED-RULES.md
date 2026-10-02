## Simulated owner decision: requirements approved

I approve the following **fictional demo requirements** against [PILOT-SPEC.md at `3d0ea43`](https://github.com/sivica/sandbox/blob/3d0ea430afc77c1a97135fa15f3e16bd7e8bcaa9/booking-staging/PILOT-SPEC.md). This completes the simulation exercise. Actual business participation, willingness to pay and human acceptance remain pending.

### Public facts

The website advertises relaxation massage for **60 minutes at MKD 1,400**, booking through Viber and Instagram, and studio and home treatments. Its displayed calendar includes an October 2023 heading. These establish advertised information, not current availability or approved operating rules. [Spasic Therapy](https://spasictherapy.com/)

## Completed owner response sheet

**Every value marked “Assumption” below is fictional.** These rules describe the proposed demonstration, not the current staging configuration.

| Field | Proposed value |
| --- | --- |
| Calendar, provider and owner | **Assumption:** one internal calendar named **Demo Studio**, controlled by **Simulated Owner**. No external calendar connection. Owner can create appointments, block resources, change settings and cancel. |
| Booking channels and updates | **Assumption:** web, simulated Viber/Instagram conversations and simulated phone inquiries. Owner enters every appointment in Demo Studio **before telling the customer it is confirmed**. No parallel calendar is authoritative. |
| Capacity and other services | **Assumption:** one practitioner, **Practitioner A**, and one room, **Room A**. Studio appointments reserve both. Other work blocks the resources it consumes. Reservations and blocks use the same conflict checks. |
| Home visits and travel | **Assumption:** home visits cannot be booked through this flow. Route inquiries to the simulated owner. An externally arranged visit blocks Practitioner A for treatment, preparation, cleanup and **30 minutes of travel each way**. |
| Studio-only scope | **Assumption:** accepted. Use the unbranded location **Demo Studio, Skopje**. |
| Service and customer price | **Assumption:** **Demo Relaxation**, 60 minutes of treatment; **MKD 1,400 total**, with no additional customer charges. Preparation and cleanup are separate. Assume applicable taxes are included solely for the fictional quote. |
| Hours and closures | **Assumption:** Monday–Friday **10:00–18:00**, Europe/Skopje; lunch blocked **13:00–14:00**; weekends closed. No additional holiday dates are assumed. Owner enters exceptions before affected slots become available. |
| Buffers | **Assumption:** **15 minutes before** and **15 minutes after** treatment. A studio appointment occupies **90 minutes**; each buffer is counted once. |
| Lead time, horizon and interval | **Assumption:** at least **24 elapsed hours** before treatment; rolling **30-day** booking horizon; treatment starts on a **15-minute grid**. Display times in Europe/Skopje. |
| Customer cancellation and rescheduling | **Assumption:** no cancellation or no-show fee. Self-service cancellation is available until **24 elapsed hours before the appointment**, including the exact boundary. Later requests go to the owner. Cancellation releases the reservation after it is recorded. A reschedule preserves the old booking until the replacement can be secured atomically. |
| No-show handling | **Assumption:** owner records a no-show after **15 minutes** without attendance or contact. The original occupied window remains blocked; no fee is collected. |
| Payments and refunds | **Assumption:** treatment is paid after attendance; no online payment or deposit. Normal cancellation therefore has **MKD 0 to refund**. Any mistakenly recorded advance is refunded fully through its original method within **two business days**, represented by synthetic records in this exercise. |
| Owner cancellation or closure | **Assumption:** owner blocks further bookings, identifies affected appointments, records cancellations and offers replacement times. Contact attempts begin within **two working hours of discovering the issue**. The closure remains blocked after reservations are released. |
| Confirmation | **Assumption:** instant confirmation only after a successful authoritative-calendar commit. During submission or an unknown result, show **“Checking reservation”**. A failed reservation remains unconfirmed. |
| Minimum contact details | **Assumption:** first name or alias and **one preferred contact route**: email or an existing messaging/phone contact. Demonstrations use invented identities and `example.com`/`.test` addresses. No symptoms, clinical history, home address or extra identity fields. |
| Customer delivery and owner duties | **Assumption:** immediate on-screen confirmation and a private booking link are the primary receipt. Owner records simulated manual messages for bookings entered through another channel, requested receipts and changes. Calendar reconciliation occurs at **10:00, 14:00 and 18:00** on working days. |
| Outage fallback | **Assumption:** stop making reservation promises when the calendar cannot be verified. Record an **unconfirmed inquiry**, with no slot held, and respond by the end of the next working day. Resume confirmation only after reconciliation. |
| Retention | **Assumption:** weekly manual deletion of synthetic booking/contact data older than **30 days after appointment completion or cancellation**, giving a maximum **37-day** retention. Audit records without contact details remain for **90 days**. |
| Admin roles and alerts | **Assumption:** one named Owner administrator and one Support viewer for synthetic operational logs; no shared accounts. Require MFA before future live administration. Alert recipients: `owner@example.com` and `support@example.com`, represented as demo log entries. |
| Economics completion | **Assumption:** completed below. Actual costs, provider capability and real owner agreement remain to be established. |

## Scenario decisions

These are **simulated requirements approvals**, not executed test results.

| Scenario | Decision and expected result |
| --- | --- |
| **1. Last appointment** | **Accepted — assumption:** a **16:45** treatment occupies **16:30–18:00**, so it fits. **17:00** would finish cleanup at **18:15** and must be unavailable. The first treatment start is **10:15**. |
| **2. Competing bookings** | **Accepted — assumption:** the first successful reservation for the resource wins, including entries from other channels. The unsuccessful customer keeps their details and chooses another slot. Owner entries cannot override an existing reservation. |
| **3. Holiday or break** | **Accepted — assumption:** owner creates the block and explicitly cancels or reschedules affected appointments. No appointment disappears silently; its outcome and contact attempts remain recorded. |
| **4. Late cancellation** | **Accepted — assumption:** at exactly **24 hours**, self-service cancellation succeeds. At **23 hours 59 minutes**, it becomes an owner-handled request; the appointment remains reserved until cancellation is recorded. Fees remain zero. |
| **5a. Home visit** | **Accepted — assumption:** a fictional **11:00** home treatment blocks Practitioner A **10:15–12:45**, including travel and buffers. That practitioner cannot accept an overlapping studio appointment. |
| **5b. Interrupted submission** | **Accepted — assumption:** retry and reload recover the same reservation using the original request identity. Show confirmed only after verifying its recorded result. An unresolved result stays “Checking reservation”; it must not create a second booking. |

## Completed pilot economics

All amounts, workloads, dates and targets below are **unsupported fictional assumptions**.

| Term | Proposed value |
| --- | --- |
| Baseline | **Assumption:** **5–11 October 2026**, using **20 scripted eligible inquiries** and synthetic outcomes. This is a rehearsal baseline; a real trial needs actual observations. |
| Baseline workload | **Assumption:** **6 administration minutes per inquiry**, including checking, entry, messages and changes; all 20 require owner handling; **16** become attended-and-paid appointments; **zero conflicts** and **two corrected entry mistakes**. |
| Pilot duration and limit | **Assumption:** **12 October–8 November 2026**, ending earlier at **80 eligible inquiries** or a stop condition. No automatic extension. |
| Completed appointment | **Assumption:** treatment marked attended **and** payment marked received. Track cancellations, no-shows and attended-but-unpaid appointments separately. Demo outcomes are synthetic. |
| Measurement responsibility | **Assumption:** Simulated Owner records inquiry ID, channel, total administration time, manual handling, errors and final outcome in a simple log. Include routine checking time; compare matched request types. |
| Pilot fee and payment | **Assumption:** **MKD 1,500 total**, payable at the start only after feasibility and explicit agreement for a real trial. The simulation creates no payment obligation. |
| Setup and support | **Assumption:** **two setup hours** and **two support hours** included. Support responds within **four working hours**, Monday–Friday 10:00–18:00. |
| Ongoing price and external costs | **Assumption:** **MKD 1,000 per 30 days**, requiring a fresh opt-in. Hosting is included; external calendar and notification charges are **MKD 0** for this manual demo. Additional integrations require a revised quote. |
| Success criteria | **Assumption:** at least **40 eligible inquiries** evaluated; average administration **≤3 minutes per inquiry**; **≤50%** require manual handling; zero confirmed overlaps, duplicates or incorrect booking details; attended-and-paid share **≥80%**; measured benefit exceeds total operating cost. |
| Stop and fallback | **Assumption:** immediately suspend confirmations after any overlap, duplicate or missing confirmed reservation. Fall back to manual unconfirmed inquiries. Stop if the calendar remains unverifiable for **one working day**, or administration still averages **≥6 minutes** after the first 20 inquiries. Insufficient volume produces an inconclusive result. |
| Fee on early termination | **Assumption:** refund the unused portion of the 28-day pilot fee; refund fully if agreed setup cannot be delivered. |
| Review and decision maker | **Assumption:** **9 November 2026 at 10:00 Europe/Skopje**, decided by Simulated Owner after reviewing the developer’s operational findings. |
| Value of owner time | **Assumption:** **MKD 600/hour**; incremental appointment contribution assumed **zero** until demonstrated. |

**Illustrative calculation:** 20 inquiries/week × 3 minutes saved × 4 weeks = **4 hours**, valued at **MKD 2,400**. After the assumed MKD 1,500 fee, the hypothetical benefit is **MKD 900**, provided all operating effort is included. This does not establish actual savings or willingness to pay.

## Approval record and remaining gates

| Stage | Status |
| --- | --- |
| Requirements | **Approved in simulation**, by Codex acting as Simulated Owner, **2 October 2026**, against revision `3d0ea43`, for the fictional profile above. |
| Feasibility and cost | **Pending.** Developer must demonstrate resource conflicts across every entry path, buffers/travel, retry recovery, cancellation/rescheduling, access controls and retention, and confirm the cost of delivery. |
| Pilot terms | **Selected in simulation**, conditional on feasibility. Actual commercial agreement remains pending. |
| Live launch acceptance | **Pending actual owner and receiving-developer acceptance.** |

There are no remaining objections to this fictional requirements proposal. The current staging settings and implementation must be assessed separately before adopting these rules. Repository documents remain unchanged.

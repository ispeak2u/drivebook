# DriveBook — Pricing Model

**Version:** 1.1
**Status:** Active
**Last updated:** August 2026

> This document is the single source of truth for DriveBook pricing and the
> platform revenue mechanism. It must be read alongside `PRD.md`,
> `ARCHITECTURE.md`, `SERVICE_CONTRACTS.md`, and
> `DriveBook_Cancellation_and_Confirmation_Policy.md`.
> Any conflicting pricing in older documents is superseded by this file.
> No document, spec, or service may state a price that disagrees with Section 1.

---

## 1. The locked Phase 1 model

Fixed price per lesson. No subscription. No percentage commission.

| Party | Amount (CAD) |
|---|---|
| Student pays | $60.00 |
| Instructor receives | $45.00 |
| DriveBook retains | $15.00 |
| Platform take rate | 25% |

The $60 price is set by the platform, not by the instructor. Instructors do not
set their own rates in Phase 1. The instructor profile field for hourly rate is
locked to $60 (see `DriveBook_Instructor_Journey.md`, I09).

Phase 2 pricing (Pro plans, tiered commission, variable instructor rates) is out
of scope and must not appear in any Phase 1 spec, requirement, or service
contract.

---

## 2. Superseded models

Three earlier models circulated across the documentation. All three are dead.
They are listed here so they can be recognised and removed on sight.

| Dead model | Where it came from | Why it is dead |
|---|---|---|
| $20 CAD/month instructor subscription | Original PRD | Replaced by per-lesson fixed pricing |
| 10% commission ($6 per lesson, $54 to instructor) | Financial Model, Pricing Strategy, Investor One Pager | Take rate is 25%, not 10% |
| DriveBook Pro at $19.99/month with 5% commission | Pricing Strategy, Investor One Pager | Phase 2 concept, out of scope |

Any occurrence of `$20/month`, `$19.99`, `10% commission`, `5% commission`,
`$6 commission`, or `$54 to instructor` in a Phase 1 document is a defect.

---

## 3. Revenue mechanism

The change from subscription to per-lesson pricing changes the Stripe
integration, not just the numbers.

| Aspect | Superseded | Current |
|---|---|---|
| Stripe product | Stripe Subscriptions | Stripe Connect (Express accounts) |
| When money moves | Monthly, instructor to platform | Per lesson, student to platform to instructor |
| What gates a listing | Active subscription | Admin approval and account standing |
| Webhook events of interest | `customer.subscription.*` | `payment_intent.*`, `transfer.*`, `account.updated` |

**Consequence:** `listing_status` must no longer be driven by subscription
webhooks. An instructor's listing is active because an admin approved them and
they are in good standing (see the strike system in the Cancellation Policy),
not because a recurring payment cleared.

---

## 4. Money flow per completed lesson

1. Student confirms a booking. `payment-service` authorises $60.00.
2. Funds are held by the platform until the lesson is marked complete.
3. On completion, $45.00 is transferred to the instructor's connected account.
4. $15.00 is retained by DriveBook.
5. Instructor payouts are batched (weekly schedule, see Section 5).

Cancellations, no-shows, penalties, and credits are governed entirely by
`DriveBook_Cancellation_and_Confirmation_Policy.md`. That document already
conforms to this model and is not to be edited during pricing reconciliation.

---

## 5. Cost of processing, and open items

**5.1 Who absorbs Stripe processing fees. DECIDED, August 2026.**

DriveBook absorbs Stripe processing fees. They are treated as a cost of goods,
not passed to the student or deducted from the instructor.

| Measure | Amount (CAD) |
|---|---|
| Gross platform revenue per lesson | $15.00 |
| Stripe fee on a $60.00 domestic card (2.9% + $0.30) | $2.04 |
| Net platform revenue per lesson | approximately $12.96 |
| Net effective take rate | approximately 21.6% |

The student still pays $60.00 and the instructor still receives $45.00. Neither
figure is affected by this decision.

Stripe Connect adds further per account and per payout charges that have not
been confirmed for Canada. Those are not included in the $2.04 above and must be
confirmed before any margin projection is presented externally.

**Note for whoever builds the financial model:** the Stripe fee is charged per
transaction, so it does not dilute with volume. Net revenue per lesson stays at
approximately $12.96 at any scale. Margin improves through dilution of fixed
costs (hosting, Mapbox, Twilio, Resend, founder time) across more lessons, not
through improvement on the transaction line. Do not project the transaction
margin improving with growth. Stripe negotiates custom rates at volume, which is
a separate lever to revisit later.

The items below remain undecided. Do not resolve them by inference, and do not
write them into a spec until Don and David decide.

**5.2 HST treatment.**
Whether the $60.00 is tax inclusive or tax exclusive, and whether DriveBook or
the instructor is the supplier of record for HST purposes, is undecided. This
affects the displayed price, the instructor's earnings statement, and the
platform's filing obligations. Requires professional advice, not a product
decision.

**5.3 Instructor payout schedule.**
Weekly transfers are assumed in the master plan but not specified anywhere
authoritative. Needs a stated day, cutoff, and minimum payout threshold.

---

## 6. Conformance status

**Already conforming. Do not edit these for pricing.**

| File | Notes |
|---|---|
| `docs/DriveBook_Cancellation_and_Confirmation_Policy.md` | Reference implementation of the model |
| `docs/DriveBook_Instructor_Journey.md` | $45 earnings, $60 penalty, rate locked at $60 |
| `docs/DriveBook_Master_User_Journey.md` | $60 escrow flow |
| `docs/DriveBook_Student_Journey_1.md` | Fixed pricing stated at line 25 |

**Non-conforming. Must be corrected.**

| File | Nature of the conflict |
|---|---|
| `docs/DriveBook_Pricing_Strategy.md` | Entire document describes the 10% model |
| `docs/DriveBook_Financial_Model_Revenue_Forecast.md` | Entire document, $6 per booking |
| `docs/DriveBook_Investor_One_Pager.md` | 10% and 5% commission, subscription revenue |
| `Word Docs/DriveBook_Investor_One_Pager.md` | Duplicate of the above, same defects |
| `docs/DriveBook_Go_To_Market_Strategy.md` | Lists subscription revenue as a stream |
| `docs/PRD.md` | Subscription model throughout, including revenue table and Phase 5 |
| `docs/SERVICE_CONTRACTS.md` | Stripe subscription endpoints and webhook table |
| `docs/ARCHITECTURE.md` | Payments row, payment-service ownership, subscription events |
| `docs/AGENT_INSTRUCTIONS.md` | Line 211 lists booking commissions as Phase 2 and off limits |
| `.kiro/specs/drivebook-marketplace/requirements.md` | Requirement 4 is subscription management |
| `.kiro/specs/drivebook-marketplace/design.md` | Correctness Property 6 is subscription status sync |

The two `.kiro` spec files carry the highest risk. They are what AI coding
agents build from, so a contradiction there produces working code that
implements the wrong business model.

---

*DriveBook Pricing Model, version 1.1. Source of truth for all Phase 1 pricing.*

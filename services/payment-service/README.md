# Payment Service

Owns Stripe Connect account lifecycle, booking payment authorisation and capture, instructor transfers, and webhook processing.

Money model is fixed. See `docs/PRICING_MODEL.md`:

| Party | Amount (CAD) |
|---|---|
| Student pays | $60.00 |
| Instructor receives | $45.00 |
| DriveBook retains | $15.00 |

DriveBook absorbs Stripe processing fees. They are never added to the student charge nor deducted from the instructor transfer.

**This service does not handle subscriptions.** Instructors join free. `customer.subscription.*` and `invoice.*` events are not handled. An instructor's `listing_status` is a function of admin approval, payout-readiness, and standing under the strike system, never of billing state.

Spec: `.kiro/specs/drivebook-marketplace/design.md`, section 6. Requirements: `requirements.md`, Requirement 4.

This service is scaffold-only. Add handlers, contracts, tests, and persistence when implementation begins.

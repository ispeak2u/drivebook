# DriveBook — Cancellation & Confirmation Policy

**Version:** 1.0
**Status:** Active
**Last updated:** June 2026

> This document defines how bookings are confirmed, cancelled, and reconciled.
> It is the source of truth for the booking lifecycle and must be read alongside
> `PRD.md`, `ARCHITECTURE.md`, and `SERVICE_CONTRACTS.md`.
> Any conflicting rules in older documents are superseded by this file.

---

## 1. Overview

DriveBook supports two booking types — **Standard Booking** and **Instant Booking**. Each has its own confirmation flow, cancellation rules, and penalty structure. The platform protects both sides of the marketplace through a unified **strike system** for instructors and **clear, time-based penalties** for students.

The rules in this document are enforced server-side by `booking-service` and `payment-service`. The mobile app surfaces the rules to the user before any action that triggers a penalty.

---

## 2. Pricing Reference

All bookings use the locked Phase 1 fixed-price model:

| Party | Amount (CAD) |
|---|---|
| Student pays | $60.00 |
| Instructor receives | $45.00 |
| DriveBook retains | $15.00 |
| Platform take rate | 25% |

Every penalty, refund, and credit in this document references these amounts.

---

## 3. Booking Types

### 3.1 Standard Booking

| Attribute | Value |
|---|---|
| Booking window | Up to **7 days** in advance (rolling) |
| Minimum lead time | None — can book the next available day if the instructor has a slot |
| Confirmation | Manual by default. Auto-Confirm available as instructor opt-in |
| Confirmation SLA | **1 hour** (manual mode) |
| Cancellation policy | Tiered by time to lesson |

### 3.2 Instant Booking

| Attribute | Value |
|---|---|
| Booking window | **2 hours from now** through end of same day |
| Minimum lead time | 2 hours |
| Confirmation | **Auto-confirmed** — no acceptance step |
| Cancellation policy | **Zero cancellation permitted by student after confirm** |
| Visibility | Hidden in UI when no eligible slots exist |

Instant Booking is a separate instructor opt-in feature. An instructor may have Manual Confirm enabled for Standard Bookings AND Instant Booking ON for same-day requests. These toggles are independent.

---

## 4. Booking Window Rules

The booking window is a hard server-side check in `booking-service` on every `POST /bookings`.

### 4.1 Standard Booking window

- A slot is bookable as Standard if `slot.start_time` is between **now** and **now + 7 days**.
- Slots more than 7 days in the future do not exist in the system and are not published.
- Instructors publish availability for the next 7 days only.

### 4.2 Instant Booking window

- A slot is bookable as Instant if `slot.start_time` is between **now + 2 hours** and **end of the same calendar day** (instructor's local time).
- The instructor must have Instant Booking toggled ON for that slot.
- The pickup-pin traffic check (Section 13) must pass at the moment the student attempts to book.

### 4.3 Example

If the current time is **9:00am Thursday, June 11**:

| Booking type | Earliest bookable slot | Latest bookable slot |
|---|---|---|
| Instant Booking | 11:00am Thursday June 11 | 11:59pm Thursday June 11 |
| Standard Booking | First available slot from any instructor's published calendar | 11:59pm Thursday June 18 |

---

## 5. Instant Booking Visibility

The Instant Booking entry point is **rendered only when at least one eligible slot exists**. There is no greyed-out button, no "no results" state, no teaser.

### 5.1 The visibility rule

The Instant Booking UI element appears in the student app only when **all** of these are true:

1. At least one instructor in the student's area has Instant Booking toggled ON.
2. That instructor has a published available slot starting between `now + 2 hours` and end of the current day.
3. The traffic check confirms the instructor can reach the student's pickup pin within the lead time available.

If any of the three fail, the Instant Booking section is removed from the UI entirely for that session.

### 5.2 Server response shape

`search-service` returns a top-level flag on every search response:

```json
{
  "data": {
    "results": [ /* instructor cards */ ],
    "instant_booking_available": true,
    "instant_booking_count": 3
  },
  "error": null
}
```

The mobile app reads `instant_booking_available` and conditionally renders the Instant Booking section. Client never makes the eligibility decision itself.

---

## 6. Confirmation Flow

### 6.1 Default state — Manual Confirmation

Every new instructor account starts with **Manual Confirm = ON, Auto-Confirm = OFF**. When a student books a Standard slot, the instructor receives a push notification and has **1 hour** to accept or decline.

### 6.2 Manual Confirmation race

Push notifications fire on a fixed schedule until the booking is confirmed or expires:

| Elapsed time | Notification |
|---|---|
| 0 minutes | "New booking — confirm within 1 hour or it expires" |
| 30 minutes | "30 minutes left to confirm this booking" |
| 50 minutes | "10 minutes left — confirm now or this booking expires" |
| 60 minutes | Booking auto-expires. Student is refunded in full. Instructor receives 1 strike. |

During the 1-hour race, the slot is locked at `availability_slots.status = 'reserved'` to prevent double booking. If the booking expires, the slot is automatically restored to `'available'`.

### 6.3 Auto-Confirm toggle

An instructor may opt in to Auto-Confirm. When toggled ON:

1. A modal appears:
   > **Auto-Confirm will accept every booking automatically.**
   > Bookings that match your published availability will be accepted without your review. These cancellation policies will apply. *Do you agree?*
   > [ Agree and Enable ] [ Cancel ]
2. On enable, every subsequent matching Standard Booking confirms instantly with no SLA race.
3. When the instructor closes the app, a notification fires:
   > **Auto-Confirm is ON. Bookings will be accepted without your review while the app is closed. Keep this setting?**
   > [ Keep ON ] [ Turn OFF ]
4. Every auto-confirmed booking still generates a push notification. Tapping the notification opens the instructor's calendar with new bookings highlighted.

### 6.4 Instant Booking confirmation

Instant Booking is **always auto-confirmed by nature** — the lesson is only 2 hours away, so there is no time for a manual confirmation race. The instructor's act of toggling Instant Booking ON is their consent to auto-confirm all Instant Booking requests.

---

## 7. Cancellation Policy — Standard Booking

All times below are measured from `bookings.start_time` (the lesson start time).

| Window | Student pays | Student receives back | Instructor receives | DriveBook retains |
|---|---|---|---|---|
| **Grace period** — within 1 hour of placing the booking | $0 | Full $60 refund | $0 | $0 |
| **5+ days** before lesson | $0 | Full $60 refund | $0 | $0 |
| **48 hours to 5 days** before lesson | $0 | Full $60 refund | $0 | $0 |
| **24-48 hours** before lesson | $15 (25%) | $45 | $11.25 | $3.75 |
| **Less than 24 hours** before lesson | $30 (50%) | $30 | $22.50 | $7.50 |
| **No-show** (student doesn't appear at pickup) | $60 (100%) | $0 | $45 | $15 |

### 7.1 Grace period detail

A student who books a Standard lesson and immediately realizes they made a mistake (wrong instructor, wrong time, wrong date) has **1 hour from the moment of confirmation** to cancel with no penalty. This is a hard server-side rule.

The grace period clock starts at `bookings.created_at`, not at the time of payment authorization.

### 7.2 No-show definition

A student is marked no-show when:

- The instructor has confirmed they were at the pickup location at the scheduled `start_time`.
- 15 minutes have elapsed past the scheduled `start_time` with no student contact or arrival.
- The instructor taps "Student no-show" in the instructor app.

The platform applies the 100% forfeit automatically. The student receives a notification with a link to dispute if they believe the no-show was incorrectly logged.

---

## 8. Cancellation Policy — Instant Booking

**Instant Booking has zero student cancellation permitted after confirmation.** This rule exists because the instructor is committing to leave immediately for the pickup.

### 8.1 The student warning prompt

Before payment is authorized on any Instant Booking, the student sees a full-screen modal:

> **⚡ Heads up — Instant Booking cannot be cancelled.**
>
> Your instructor will start heading to your pickup location as soon as you confirm.
>
> If you cancel for any reason after confirming, the full **$60** lesson fee is **non-refundable**.
>
> Do you want to proceed?
>
> [ Confirm and Pay $60 ] [ Go Back ]

The student must tap "Confirm and Pay" to proceed. There is no checkbox or fine-print version of this prompt.

### 8.2 What happens at each scenario

| Scenario | Student pays | Student receives back | Instructor receives | DriveBook retains |
|---|---|---|---|---|
| Student attempts to cancel after confirm | $60 | $0 | $45 | $15 |
| Student no-show | $60 | $0 | $45 | $15 |
| Instructor cancels Instant Booking | $0 (refunded) | Full $60 refund **+ $60 credit toward next lesson** | $0 (and **$60 penalty charged** to instructor) | $15 (funded by the instructor penalty) |
| Instructor no-show on Instant Booking | $0 (refunded) | Full $60 refund **+ $60 credit toward next lesson** | $0 (and **$60 penalty charged** + immediate strike + account flagged) | $15 (funded by the instructor penalty) |

### 8.3 Money flow for an instructor-cancelled Instant Booking

This is the most complex flow in the policy. Walking through it explicitly:

1. Student paid **$60** at booking, held by `payment-service`.
2. Instructor cancels.
3. Student receives **$60 refund** to original payment method.
4. Student receives **$60 credit** stored in their account ledger, redeemable on the next booking.
5. Instructor is charged a **$60 penalty**, deducted from their next pending payout (or charged directly if no pending payout exists).
6. Of the $60 instructor penalty: **$45 funds the instructor on the student's next (free) lesson**, **$15 is retained by DriveBook** as the platform fee on that future lesson.
7. Net result: student is made whole and gets a free lesson; instructor loses $60; DriveBook collects its $15 across the two bookings.

This requires a **student credit ledger** in `payment-service`. See Section 14 for schema implications.

---

## 9. Instructor Cancellation — Standard Booking

When an instructor cancels a Standard Booking, the student is always made whole. The instructor incurs penalties scaled by lateness.

| Window | Student receives back | Instructor consequence |
|---|---|---|
| **5+ days** before lesson | Full $60 refund | No strike |
| **48 hours to 5 days** before lesson | Full $60 refund | **1 strike** |
| **Less than 48 hours** before lesson | Full $60 refund **+ $15 credit toward next lesson** | **1 strike + account flagged for admin review** |
| Instructor no-show | Full $60 refund **+ $15 credit** | **1 strike + immediate flag + account paused pending review** |

The $15 credit in the late-cancellation tier comes from DriveBook's platform fee on the student's next booking — it is not charged to the instructor as a separate penalty (unlike Instant Booking, where the instructor pays the full $60).

---

## 10. Strike System

Strikes are the unified accountability mechanic for instructors.

### 10.1 What triggers a strike

| Trigger | Strike weight |
|---|---|
| Missed 1-hour confirmation SLA on a Standard Booking | 1 strike |
| Instructor cancellation 48 hours to 5 days before lesson | 1 strike |
| Instructor cancellation less than 48 hours before lesson | 1 strike + admin flag |
| Instructor no-show on any booking | 1 strike + immediate account pause |
| Instructor cancellation of an Instant Booking | 1 strike + $60 penalty |

All strikes carry the same weight. There is no "soft strike" tier. An instructor cannot distinguish "I forgot to confirm" from "I cancelled on a student" in the eyes of the platform — both reduce trust the same amount.

### 10.2 Strike thresholds

| Total strikes | Consequence |
|---|---|
| 1 | Warning notification + retention email |
| 2 | Account flagged. Instructor card de-prioritized in search results |
| 3 | **Account suspended pending admin review.** Instructor cannot accept new bookings until reviewed |

### 10.3 Strike expiry

Strikes do not expire automatically. They are cleared only by admin action via `PATCH /admin/instructors/:id/clear-strike` (new endpoint — see Section 15).

This is deliberately strict. Instructors with a clean record will rarely encounter strikes; instructors who accumulate them are signaling unreliability and should not be kept on the platform without intervention.

---

## 11. Pre-Lesson Check-In (2-Hour System)

**Every booking — Standard and Instant — triggers a check-in 2 hours before lesson start.**

### 11.1 Instructor check-in flow

At `booking.start_time - 2 hours`, the `booking-service` cron fires a push notification to the instructor:

> **Your lesson with [Student Name] starts at [Time]. Are you on your way?**
> [ ✅ I'm on my way ] [ ❌ I need to cancel ]

| Response | Action |
|---|---|
| **"I'm on my way"** | Student receives push: "Your instructor is on the way." Booking status updates to `instructor_en_route = true`. |
| **No response in 30 minutes** | Second push fires to instructor: "Confirm you're on your way to [Student Name]'s pickup." Student receives soft alert. |
| **No response in 60 minutes** | Booking flagged as `at_risk`. Admin alerted. Student receives push offering penalty-free cancellation. |
| **"I need to cancel"** | Instructor cancellation policy applies (Section 9 for Standard, Section 8 for Instant). |

### 11.2 Instant Booking variation

For Instant Bookings, the check-in fires **immediately after the student confirms** because the lesson is only 2 hours away:

> **⚡ You have an Instant Booking with [Student Name] starting in 2 hours. Are you on your way?**

The instructor has no escalation buffer — they must respond within 15 minutes or the booking is flagged at-risk and the student is offered an immediate refund with $15 credit (instructor takes the $60 penalty as in Section 8.3).

---

## 12. Student Pickup Reminders

For every confirmed booking, students receive a fixed reminder cadence:

| Trigger | Notification |
|---|---|
| **24 hours before lesson** | "Your lesson with [Instructor] is tomorrow at [Time] at [Pickup]." |
| **6 hours before lesson** | "Your lesson is in 6 hours. Make sure your pickup pin is still correct." |
| **2 hours before lesson** | "Your lesson starts in 2 hours. Your instructor will confirm shortly." |
| **Instructor confirms en route** | "Your instructor is on the way." App calculates the student's leave-by time. |
| **10 minutes before student leave-by time** | "Leave in 10 minutes to reach your pickup. Your instructor is en route and will arrive on time." |

### 12.1 Calculated student leave-by time

The mobile app uses the student's current device location and the pickup pin to estimate travel time using Mapbox traffic-aware routing. The 10-minute reminder fires at `pickup_eta - student_travel_time - 10 minutes`.

This is one of DriveBook's strongest differentiators and should be prominent in marketing copy.

---

## 13. Traffic Check (All Bookings)

The traffic check exists in two places — at booking time and pre-lesson.

### 13.1 At booking time (Instant Booking only)

When a student attempts an Instant Booking, the server runs:

- Instructor's `service_area_lat / service_area_lng` (or last known location if more recent)
- Student's pickup pin
- Mapbox traffic-aware routing
- Estimated travel time

If estimated travel time exceeds **30 minutes** within the 2-hour lead window, the slot is **suppressed from Instant Booking results** for that student. Standard Bookings are not subject to this check (the 7-day window provides enough buffer).

### 13.2 Pre-lesson (all bookings)

At 2 hours before lesson start, the check-in described in Section 11 effectively replaces a passive traffic check with an active confirmation. The instructor's response is the trust signal — DriveBook does not require continuous GPS tracking of instructors (privacy under PIPEDA, battery drain, instructor resistance).

---

## 14. Schema Implications

The following changes are required to support this policy. These edits go into the next migration in `packages/db/migrations/`.

### 14.1 `availability_slots`

```sql
ALTER TABLE availability_slots
  ADD COLUMN instant_booking BOOLEAN NOT NULL DEFAULT false;
```

### 14.2 `bookings`

```sql
ALTER TABLE bookings
  ADD COLUMN booking_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (booking_type IN ('standard', 'instant')),
  ADD COLUMN instructor_checkin_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (instructor_checkin_status IN ('pending', 'confirmed', 'no_response', 'cancelled')),
  ADD COLUMN expires_at TIMESTAMPTZ;  -- set to created_at + 1 hour for manual-confirm Standard bookings

-- Extend booking status enum
ALTER TABLE bookings
  DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check CHECK (status IN (
    'pending_confirmation',
    'confirmed',
    'completed',
    'expired',
    'cancelled_by_student',
    'cancelled_by_instructor',
    'at_risk',
    'no_show_student',
    'no_show_instructor'
  ));
```

### 14.3 `instructor_profiles`

```sql
ALTER TABLE instructor_profiles
  ADD COLUMN auto_confirm BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN instant_booking_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN strike_count INT NOT NULL DEFAULT 0;
```

### 14.4 New table — `student_credits`

```sql
CREATE TABLE student_credits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cad     NUMERIC(8,2) NOT NULL CHECK (amount_cad > 0),
  source         TEXT NOT NULL CHECK (source IN (
                   'instructor_cancellation',
                   'instructor_no_show',
                   'instant_booking_cancellation',
                   'goodwill'
                 )),
  source_booking_id UUID REFERENCES bookings(id),
  applied_to_booking_id UUID REFERENCES bookings(id),
  status         TEXT NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'applied', 'expired')),
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 14.5 New table — `instructor_strikes`

```sql
CREATE TABLE instructor_strikes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL CHECK (reason IN (
                  'missed_confirmation',
                  'late_cancellation',
                  'instant_cancellation',
                  'no_show'
                )),
  booking_id    UUID REFERENCES bookings(id),
  cleared_by    UUID REFERENCES users(id),
  cleared_at    TIMESTAMPTZ,
  cleared_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 15. Service Contract Implications

The following endpoints in `SERVICE_CONTRACTS.md` need updating or adding. Full details belong in `SERVICE_CONTRACTS.md` itself.

### 15.1 Updates to existing endpoints

| Endpoint | Change |
|---|---|
| `POST /bookings` | Accept `booking_type: "standard" \| "instant"`. Enforce 7-day window for standard, 2-hour window for instant. Apply traffic check for instant. |
| `POST /instructors/me/availability` | Accept per-slot `instant_booking: boolean`. |
| `PATCH /bookings/:id/cancel` | Apply tiered penalty logic. Reject student cancellation of Instant Booking with `INSTANT_NO_CANCEL` error. |
| `GET /search/instructors` | Return `instant_booking_available` and `instant_booking_count` at the top level. |

### 15.2 New endpoints required

| Endpoint | Purpose |
|---|---|
| `PATCH /instructors/me/auto-confirm` | Toggle Auto-Confirm with policy acceptance flag |
| `PATCH /instructors/me/instant-booking` | Toggle Instant Booking with policy acceptance flag |
| `POST /bookings/:id/checkin` | Instructor confirms "on my way" or cancels at 2-hour check-in |
| `POST /bookings/internal/expire-pending` | Cron — expire bookings past their 1-hour confirmation SLA |
| `POST /bookings/internal/checkin-fanout` | Cron — fire 2-hour check-in notifications |
| `GET /students/me/credits` | List student's available credits |
| `PATCH /admin/instructors/:id/clear-strike` | Admin clears a strike with reason |

### 15.3 New error codes

| Code | HTTP | Meaning |
|---|---|---|
| `INSTANT_NO_CANCEL` | 422 | Student attempted to cancel a confirmed Instant Booking |
| `OUTSIDE_BOOKING_WINDOW` | 422 | Booking attempt outside the 7-day or 2-hour windows |
| `TRAFFIC_CHECK_FAILED` | 422 | Instructor cannot reach pickup pin within Instant Booking lead time |
| `INSTRUCTOR_NOT_ACCEPTING` | 422 | Instructor has hit 3 strikes and is suspended |
| `CHECKIN_REQUIRED` | 422 | Instructor missed the 2-hour check-in window |

---

## 16. Open Items for Design Phase

These are deferred to UI/UX design (Phase 2 of the master plan), not blocking the backend build.

- **Instant Booking section placement** — horizontal scroll at top of student home when available, or integrated into main results
- **Auto-Confirm badge** — should instructor profiles show "⚡ Confirms Instantly" badge to students? (Recommendation: yes — creates marketplace pressure toward Auto-Confirm and rewards committed instructors.)
- **Strike visibility to instructors** — surface strike count and strike reasons in instructor dashboard for transparency
- **Calendar UI for new auto-confirmed bookings** — bookings highlighted in green per Don's specification
- **Student credit redemption UX** — automatic at checkout, or student-selected per booking?
- **Pickup pin pre-confirmation** — should students confirm their pickup pin at the 6-hour reminder to reduce no-show risk?

---

## 17. Summary

| Concept | Locked value |
|---|---|
| Booking window — Standard | Rolling 7 days |
| Booking window — Instant | 2 hours to end of same day |
| Confirmation default | Manual, 1-hour SLA |
| Auto-Confirm | Opt-in with consent modal + app-close reminder |
| Instant Booking visibility | Hidden when no eligible slots |
| Standard cancellation grace | 1 hour post-booking |
| Standard cancellation tiers | 5+ days free, 24-48h 25%, <24h 50%, no-show 100% |
| Instant cancellation | Zero — full $60 forfeited |
| Instructor Instant cancel penalty | $60 charged, student gets refund + free lesson |
| Strike threshold | 3 strikes = suspension pending review |
| Pre-lesson check-in | 2 hours before every lesson |
| Student leave-by reminder | 10 minutes before calculated leave time |
| Traffic check | Instant Booking only at booking time; check-in covers all bookings pre-lesson |

---

*DriveBook Cancellation & Confirmation Policy v1.0*

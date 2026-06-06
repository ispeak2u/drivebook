# DriveBook — Service Contracts

**Version:** 1.0  
**Status:** Active  
**Last updated:** June 2026

> This is the source of truth for all API endpoints and inter-service events.
> If you rename, add, or remove an endpoint, update this file in the same commit.

---

## Conventions

- All requests and responses use `Content-Type: application/json`
- All timestamps are ISO 8601 UTC (e.g. `2025-08-09T09:00:00Z`)
- All IDs are UUIDs
- Protected endpoints require `Authorization: Bearer <jwt>`
- Service-to-service endpoints require `X-Internal-Key: <internal_service_key>`
- All responses follow the standard envelope:

```json
// Success
{ "data": <payload>, "error": null }

// Error
{ "data": null, "error": { "code": "ERROR_CODE", "message": "string", "details": {} } }
```

---

## Error Codes Reference

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema validation failed — `details` contains field errors |
| `EMAIL_ALREADY_REGISTERED` | 409 | Email is already in use |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password (never specify which) |
| `ACCOUNT_LOCKED` | 401 | Too many failed login attempts |
| `EMAIL_NOT_VERIFIED` | 401 | Account exists but email not confirmed |
| `UNAUTHORIZED` | 401 | Missing or expired JWT |
| `FORBIDDEN` | 403 | Authenticated but insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `SLOT_ALREADY_RESERVED` | 409 | Slot has already been booked by another student |
| `SLOT_OVERLAP` | 409 | New availability slot overlaps an existing slot |
| `BOOKING_NOT_FOUND` | 404 | Booking does not exist or is not accessible |
| `BOOKING_NOT_COMPLETED` | 422 | Rating submitted for a non-completed booking |
| `RATING_ALREADY_SUBMITTED` | 409 | This booking already has a rating |
| `LATE_CANCELLATION` | 422 | Cancellation attempted within the 24h no-penalty window |
| `DISPUTE_INVALID_STATUS` | 422 | Booking status not eligible for dispute submission |
| `DISPUTE_ALREADY_EXISTS` | 409 | A dispute already exists for this booking |
| `INSTRUCTOR_NOT_ACTIVE` | 422 | Instructor listing is inactive |
| `OUTSIDE_GTA_BOUNDARY` | 422 | Pickup pin coordinates are outside the GTA |
| `STRIPE_SIGNATURE_INVALID` | 400 | Stripe webhook signature verification failed |
| `DATABASE_ERROR` | 500 | Unexpected database error |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## 1. Auth Service — Port 3001

Base path: `/auth`

---

### POST /auth/register

Register a new user (student or instructor).  
**Auth:** None

**Request:**
```json
{
  "email": "alex@example.com",
  "password": "password1",
  "full_name": "Alex Chen",
  "role": "student",
  "phone": "+14165550100"
}
```

**Validation rules:**
- `email`: valid email format, unique
- `password`: min 8 chars, at least 1 letter + 1 number
- `full_name`: non-empty string
- `role`: `"student"` or `"instructor"`
- `phone`: optional, E.164 format

**Response 201:**
```json
{
  "data": {
    "user_id": "uuid",
    "email": "alex@example.com",
    "role": "student",
    "message": "Verification email sent. Please check your inbox."
  },
  "error": null
}
```

**Errors:** `400 VALIDATION_ERROR`, `409 EMAIL_ALREADY_REGISTERED`

---

### POST /auth/login

Login and receive a JWT.  
**Auth:** None

**Request:**
```json
{ "email": "alex@example.com", "password": "password1" }
```

**Response 200:**
```json
{
  "data": {
    "access_token": "jwt",
    "expires_in": 604800,
    "user": { "id": "uuid", "email": "alex@example.com", "role": "student", "full_name": "Alex Chen" }
  },
  "error": null
}
```

**Errors:** `401 INVALID_CREDENTIALS`, `401 ACCOUNT_LOCKED`, `401 EMAIL_NOT_VERIFIED`

---

### POST /auth/logout

Invalidate the current session.  
**Auth:** Bearer

**Response 200:**
```json
{ "data": { "message": "Logged out successfully." }, "error": null }
```

---

### POST /auth/refresh

Exchange a refresh token for a new access token.  
**Auth:** None (refresh token in body)

**Request:**
```json
{ "refresh_token": "string" }
```

**Response 200:**
```json
{ "data": { "access_token": "jwt", "expires_in": 604800 }, "error": null }
```

---

### POST /auth/verify-email

Confirm email address via token from verification email.  
**Auth:** None

**Request:**
```json
{ "token": "string" }
```

**Response 200:**
```json
{ "data": { "message": "Email verified. You can now log in." }, "error": null }
```

---

### POST /auth/forgot-password

Send a password reset email.  
**Auth:** None

**Request:**
```json
{ "email": "alex@example.com" }
```

**Response 200:** Always returns success (does not reveal if email exists)
```json
{ "data": { "message": "If that email is registered, a reset link has been sent." }, "error": null }
```

---

### POST /auth/reset-password

Set a new password using the reset token.  
**Auth:** None

**Request:**
```json
{ "token": "string", "new_password": "newpassword1" }
```

**Response 200:**
```json
{ "data": { "message": "Password updated. You can now log in." }, "error": null }
```

**Errors:** `400 VALIDATION_ERROR` (token expired or password too weak)

---

### GET /auth/me

Get the currently authenticated user.  
**Auth:** Bearer

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "email": "alex@example.com",
    "role": "student",
    "full_name": "Alex Chen",
    "phone": "+14165550100",
    "avatar_url": null,
    "created_at": "2025-01-15T10:00:00Z"
  },
  "error": null
}
```

---

## 2. Student Service — Port 3002

Base path: `/students`

---

### GET /students/me

Get the authenticated student's profile.  
**Auth:** Bearer (student)

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "full_name": "Alex Chen",
    "email": "alex@example.com",
    "phone": "+14165550100",
    "avatar_url": null,
    "created_at": "2025-01-15T10:00:00Z"
  },
  "error": null
}
```

---

### PATCH /students/me

Update the authenticated student's profile.  
**Auth:** Bearer (student)

**Request:**
```json
{
  "full_name": "Alex Chen",
  "phone": "+14165550199",
  "avatar_url": "https://..."
}
```

**Response 200:** Updated profile (same shape as GET /students/me)

---

### GET /students/me/bookings

Get the authenticated student's booking list.  
**Auth:** Bearer (student)

**Query params:** `status` (`confirmed` | `completed` | `cancelled_by_student` | `cancelled_by_instructor`), `page`, `per_page`

**Response 200:**
```json
{
  "data": {
    "upcoming": [ /* booking summary objects */ ],
    "past": [ /* booking summary objects */ ],
    "total": 5
  },
  "error": null
}
```

---

### GET /students/me/bookings/:id

Get a specific booking detail for the authenticated student.  
**Auth:** Bearer (student)

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "reference_code": "DB-20250809-A4K2P",
    "status": "confirmed",
    "instructor": { "id": "uuid", "full_name": "Michael R.", "avg_rating": 4.8 },
    "lesson_date": "2025-08-09",
    "start_time": "2025-08-09T09:00:00Z",
    "end_time": "2025-08-09T11:00:00Z",
    "hourly_rate_cad": 60.00,
    "pickup_lat": 43.7731,
    "pickup_lng": -79.3421,
    "pickup_address": "2750 Eglinton Ave E, Toronto, ON",
    "review_status": "pending",
    "created_at": "2025-08-01T10:00:00Z"
  },
  "error": null
}
```

**Errors:** `404 BOOKING_NOT_FOUND`, `403 FORBIDDEN`

---

## 3. Instructor Service — Port 3003

Base path: `/instructors`

---

### POST /instructors/profile

Create an instructor profile. Called after instructor registration.  
**Auth:** Bearer (instructor)

**Request:**
```json
{
  "bio": "8 years teaching in North York...",
  "hourly_rate_cad": 60.00,
  "years_experience": 8,
  "languages": ["English", "Cantonese"],
  "vehicle_make": "Toyota",
  "vehicle_model": "Corolla",
  "service_areas": ["M1", "M2", "M3"],
  "mto_cert_number": "MTO-123456"
}
```

**Response 201:**
```json
{ "data": { "profile_id": "uuid", "status": "pending_review" }, "error": null }
```

---

### GET /instructors/:id

Get a public instructor profile.  
**Auth:** None (public)

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "full_name": "Michael R.",
    "bio": "...",
    "hourly_rate_cad": 60.00,
    "years_experience": 8,
    "languages": ["English", "Cantonese"],
    "vehicle": "Toyota Corolla",
    "service_areas": ["M1", "M2", "M3"],
    "avg_rating": 4.8,
    "total_bookings": 142,
    "cancellation_count": 2,
    "verified": true,
    "member_since": "2024-01-15T00:00:00Z"
  },
  "error": null
}
```

**Errors:** `404 NOT_FOUND`

---

### PATCH /instructors/me

Update the authenticated instructor's own profile.  
**Auth:** Bearer (instructor, must be active)

**Request:** Any combination of updatable fields:
```json
{
  "bio": "Updated bio...",
  "hourly_rate_cad": 65.00,
  "languages": ["English", "Cantonese", "Mandarin"],
  "vehicle_make": "Honda",
  "vehicle_model": "Civic",
  "service_areas": ["M1", "M2"],
  "years_experience": 9
}
```

**Response 200:** Updated public profile (same shape as GET /instructors/:id)

---

### POST /instructors/me/documents

Upload a verification document.  
**Auth:** Bearer (instructor)  
**Content-Type:** multipart/form-data

**Form fields:**
- `document_type`: `"mto_cert"` | `"gov_id"` | `"insurance"`
- `file`: PDF, JPG, or PNG, max 10 MB

**Response 201:**
```json
{
  "data": { "document_type": "mto_cert", "url": "https://..." },
  "error": null
}
```

---

### GET /instructors/me/availability

List the authenticated instructor's availability slots.  
**Auth:** Bearer (instructor)

**Query params:** `from` (ISO 8601), `to` (ISO 8601)

**Response 200:**
```json
{
  "data": {
    "slots": [
      {
        "id": "uuid",
        "start_time": "2025-08-09T09:00:00Z",
        "end_time": "2025-08-09T11:00:00Z",
        "status": "available",
        "recurrence": "weekly",
        "series_id": "uuid"
      }
    ]
  },
  "error": null
}
```

---

### POST /instructors/me/availability

Create one or more availability slots.  
**Auth:** Bearer (instructor, must be active)

**Request:**
```json
{
  "start_time": "2025-08-09T09:00:00Z",
  "end_time": "2025-08-09T11:00:00Z",
  "recurrence": "weekly"
}
```

**Response 201:**
```json
{
  "data": { "series_id": "uuid", "slots_created": 9, "message": "Availability created for 9 weeks." },
  "error": null
}
```

**Errors:** `409 SLOT_OVERLAP`, `422 INSTRUCTOR_NOT_ACTIVE`

---

### DELETE /instructors/me/availability/:slotId

Delete a single availability slot instance.  
**Auth:** Bearer (instructor)

**Response 200:**
```json
{ "data": { "deleted": true }, "error": null }
```

**Errors:** `404 NOT_FOUND`, `422` (slot is reserved — cannot delete)

---

### DELETE /instructors/me/availability/series/:seriesId

Delete all slots in a recurring series.  
**Auth:** Bearer (instructor)

**Response 200:**
```json
{ "data": { "deleted_count": 9 }, "error": null }
```

---

### PATCH /instructors/:id/status

Set an instructor's approval status. Called by admin-service.  
**Auth:** Bearer (admin) or `X-Internal-Key`

**Request:**
```json
{ "status": "approved", "reason": "optional rejection reason" }
```

**Response 200:**
```json
{ "data": { "instructor_id": "uuid", "status": "approved" }, "error": null }
```

---

### PATCH /instructors/:id/listing

Set an instructor's listing status. Called by payment-service.  
**Auth:** `X-Internal-Key`

**Request:**
```json
{ "listing_status": "active" }
```

**Response 200:**
```json
{ "data": { "instructor_id": "uuid", "listing_status": "active" }, "error": null }
```

---

## 4. Booking Service — Port 3004

Base path: `/bookings`

---

### POST /bookings

Create a new booking.  
**Auth:** Bearer (student)

**Request:**
```json
{
  "slot_id": "uuid",
  "pickup_lat": 43.7731,
  "pickup_lng": -79.3421,
  "pickup_address": "2750 Eglinton Ave E, Toronto, ON"
}
```

**Response 201:**
```json
{
  "data": {
    "booking_id": "uuid",
    "reference_code": "DB-20250809-A4K2P",
    "status": "confirmed",
    "start_time": "2025-08-09T09:00:00Z",
    "end_time": "2025-08-09T11:00:00Z",
    "instructor": { "id": "uuid", "full_name": "Michael R." },
    "pickup_address": "2750 Eglinton Ave E, Toronto, ON",
    "hourly_rate_cad": 60.00,
    "total_cost_cad": 120.00
  },
  "error": null
}
```

**Errors:** `409 SLOT_ALREADY_RESERVED`, `422 INSTRUCTOR_NOT_ACTIVE`, `422 OUTSIDE_GTA_BOUNDARY`

---

### GET /bookings/:id

Get a booking by ID.  
**Auth:** Bearer (student who made the booking, or instructor assigned to it)

**Response 200:** Full booking detail (same shape as GET /students/me/bookings/:id)

**Errors:** `404 BOOKING_NOT_FOUND`, `403 FORBIDDEN`

---

### PATCH /bookings/:id/cancel

Cancel a booking.  
**Auth:** Bearer (student or instructor)

**Request:**
```json
{ "reason": "Schedule conflict" }
```

**Response 200:**
```json
{
  "data": {
    "booking_id": "uuid",
    "status": "cancelled_by_student",
    "cancelled_at": "2025-08-08T14:30:00Z"
  },
  "error": null
}
```

**Errors:** `422 LATE_CANCELLATION` (student within 24h window — requires explicit confirm flag), `404 BOOKING_NOT_FOUND`

**Late cancellation confirm:**
```json
{ "reason": "Emergency", "confirm_late_cancellation": true }
```

---

### POST /bookings/:id/rating

Submit a rating for a completed booking.  
**Auth:** Bearer (student who made the booking)

**Request:**
```json
{
  "score": 5,
  "review_text": "Excellent instructor, very patient."
}
```

**Validation:** `score` must be integer 1–5. `review_text` max 300 chars.

**Response 201:**
```json
{
  "data": {
    "rating_id": "uuid",
    "score": 5,
    "instructor_new_avg": 4.82
  },
  "error": null
}
```

**Errors:** `422 BOOKING_NOT_COMPLETED`, `409 RATING_ALREADY_SUBMITTED`, `403 FORBIDDEN`

---

### GET /bookings/instructor/:instructorId

Get all bookings for a specific instructor.  
**Auth:** Bearer (the instructor themselves)

**Query params:** `status`, `page`, `per_page`

**Response 200:**
```json
{
  "data": {
    "bookings": [ /* booking summary objects */ ],
    "total": 12,
    "stats": {
      "total_completed": 142,
      "earnings_this_month_cad": 480.00,
      "avg_rating": 4.8
    }
  },
  "error": null
}
```

---

### POST /bookings/internal/complete-lessons

Auto-complete all lessons past their end time. Called by cron every 15 minutes.  
**Auth:** `X-Internal-Key`

**Response 200:**
```json
{ "data": { "completed_count": 3 }, "error": null }
```

---

## 5. Search Service — Port 3005

Base path: `/search`

---

### GET /search/instructors

Search for available instructors.  
**Auth:** None (public)

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `date_from` | ISO 8601 | No | Earliest lesson start |
| `date_to` | ISO 8601 | No | Latest lesson start |
| `languages` | comma-separated strings | No | Filter by languages |
| `max_rate` | number | No | Max hourly rate (CAD) |
| `min_rating` | number (1–5) | No | Minimum average rating |
| `lat` | number | No | Student pickup latitude |
| `lng` | number | No | Student pickup longitude |
| `sort_by` | string | No | `distance` \| `rating` \| `price_asc` \| `price_desc` (default: `distance`) |
| `page` | integer | No | Default: 1 |
| `per_page` | integer | No | Default: 10, max: 50 |

**Response 200:**
```json
{
  "data": {
    "results": [
      {
        "instructor_id": "uuid",
        "full_name": "Michael R.",
        "avg_rating": 4.8,
        "total_bookings": 142,
        "hourly_rate_cad": 60.00,
        "languages": ["English", "Cantonese"],
        "next_available": "2025-08-09T09:00:00Z",
        "distance_km": 2.4,
        "avatar_url": "https://..."
      }
    ],
    "total": 12,
    "page": 1,
    "per_page": 10
  },
  "error": null
}
```

**Notes:**
- Only returns instructors with `status = 'approved'` and `listing_status = 'active'`
- Results capped at 50 per page
- Results cached for 60 seconds (keyed by query hash)

---

### GET /search/instructors/:id/slots

Get available time slots for a specific instructor.  
**Auth:** None (public)

**Query params:** `date_from` (ISO 8601), `date_to` (ISO 8601)

**Response 200:**
```json
{
  "data": {
    "instructor_id": "uuid",
    "slots": [
      {
        "id": "uuid",
        "start_time": "2025-08-09T09:00:00Z",
        "end_time": "2025-08-09T11:00:00Z",
        "duration_hours": 2
      }
    ]
  },
  "error": null
}
```

---

## 6. Payment Service — Port 3006

Base path: `/payments`

---

### POST /payments/checkout

Create a Stripe checkout session for a $20 CAD/month subscription.  
**Auth:** Bearer (instructor, must have `status = 'approved'`)

**Response 201:**
```json
{
  "data": { "checkout_url": "https://checkout.stripe.com/..." },
  "error": null
}
```

---

### POST /payments/portal

Create a Stripe billing portal session for subscription management.  
**Auth:** Bearer (instructor)

**Response 201:**
```json
{
  "data": { "portal_url": "https://billing.stripe.com/..." },
  "error": null
}
```

---

### GET /payments/status

Get the authenticated instructor's current subscription status.  
**Auth:** Bearer (instructor)

**Response 200:**
```json
{
  "data": {
    "listing_status": "active",
    "stripe_sub_status": "active",
    "sub_period_start": "2025-08-01T00:00:00Z",
    "sub_period_end": "2025-09-01T00:00:00Z"
  },
  "error": null
}
```

---

### POST /webhooks/stripe

Handle incoming Stripe webhook events.  
**Auth:** `Stripe-Signature` header (verified with `STRIPE_WEBHOOK_SECRET`)

**Handled events:**

| Stripe Event | Action |
|---|---|
| `customer.subscription.created` | Set instructor `listing_status = 'active'`, record sub details |
| `customer.subscription.updated` | Sync subscription status |
| `customer.subscription.deleted` | Set instructor `listing_status = 'inactive'` |
| `invoice.payment_succeeded` | Update `sub_period_end` |
| `invoice.payment_failed` | Set instructor `listing_status = 'inactive'`, send failure email |
| Any unrecognised event | Log and return 200 OK |

**Response 200:**
```json
{ "received": true }
```

**Notes:**
- Always returns 200 on receipt (even for unhandled events) to prevent Stripe retries
- Returns 400 only if signature verification fails
- All events are idempotent (checked via `stripe_events` table)

---

## 7. Notification Service — Port 3007

Base path: `/notifications`

**All endpoints require `X-Internal-Key` header. Not publicly accessible.**

---

### POST /notifications/email

Send a transactional email.  
**Auth:** `X-Internal-Key`

**Request:**
```json
{
  "event_type": "booking_confirmation",
  "to": "alex@example.com",
  "booking_id": "uuid",
  "student_id": "uuid",
  "instructor_id": "uuid"
}
```

**Supported `event_type` values:**
`registration`, `booking_confirmation`, `booking_cancellation`, `lesson_reminder_24h`, `lesson_reminder_2h`, `rating_request`, `dispute_submitted`, `dispute_resolved`, `instructor_approved`, `instructor_rejected`, `payment_failed`

**Response 200:**
```json
{ "data": { "notification_id": "uuid", "status": "sent" }, "error": null }
```

---

### POST /notifications/sms

Send an SMS notification.  
**Auth:** `X-Internal-Key`

**Request:**
```json
{
  "event_type": "booking_confirmation",
  "to": "+14165550100",
  "booking_id": "uuid"
}
```

**Response 200:**
```json
{ "data": { "notification_id": "uuid", "status": "sent" }, "error": null }
```

**Notes:** SMS is only sent if the user has a verified `phone` field in `users`.

---

### POST /notifications/reminder

Send a lesson reminder (email + SMS if phone is available).  
**Auth:** `X-Internal-Key`

**Request:**
```json
{
  "booking_id": "uuid",
  "reminder_type": "24h"
}
```

`reminder_type`: `"24h"` or `"2h"`

**Response 200:**
```json
{ "data": { "email_sent": true, "sms_sent": false }, "error": null }
```

---

## 8. Admin Service — Port 3008

Base path: `/admin`

**All endpoints require Bearer token with `role = 'admin'`. Returns 403 for all other roles.**

---

### GET /admin/dashboard

Get platform health metrics.  
**Auth:** Bearer (admin)

**Response 200:**
```json
{
  "data": {
    "total_students": 312,
    "instructors_by_status": {
      "pending_review": 5,
      "approved": 48,
      "rejected": 3,
      "suspended": 2
    },
    "bookings_this_month": 94,
    "active_subscriptions": 43,
    "open_disputes": 2
  },
  "error": null
}
```

---

### GET /admin/instructors

List instructors with status filter.  
**Auth:** Bearer (admin)

**Query params:** `status` (`pending_review` | `approved` | `rejected` | `suspended`), `page`, `per_page`

**Response 200:**
```json
{
  "data": {
    "instructors": [
      {
        "id": "uuid",
        "full_name": "Michael R.",
        "email": "michael@example.com",
        "status": "pending_review",
        "submitted_at": "2025-08-01T10:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "per_page": 50
  },
  "error": null
}
```

---

### GET /admin/instructors/:id

Get full instructor detail including documents.  
**Auth:** Bearer (admin)

**Response 200:** Full instructor profile including document URLs, admin notes, rejection reason.

---

### PATCH /admin/instructors/:id/approve

Approve an instructor application.  
**Auth:** Bearer (admin)

**Response 200:**
```json
{ "data": { "instructor_id": "uuid", "status": "approved" }, "error": null }
```

---

### PATCH /admin/instructors/:id/reject

Reject an instructor application.  
**Auth:** Bearer (admin)

**Request:**
```json
{ "reason": "MTO certificate could not be verified." }
```

**Response 200:**
```json
{ "data": { "instructor_id": "uuid", "status": "rejected" }, "error": null }
```

**Errors:** `400 VALIDATION_ERROR` (reason required)

---

### PATCH /admin/instructors/:id/suspend

Suspend an active instructor account.  
**Auth:** Bearer (admin)

**Request:**
```json
{ "reason": "Multiple verified complaints about unsafe behaviour." }
```

**Response 200:**
```json
{ "data": { "instructor_id": "uuid", "status": "suspended" }, "error": null }
```

---

### GET /admin/disputes

List disputes.  
**Auth:** Bearer (admin)

**Query params:** `status` (`open` | `resolved` | `escalated`), `page`, `per_page`

**Response 200:**
```json
{
  "data": {
    "disputes": [
      {
        "id": "uuid",
        "booking_reference": "DB-20250809-A4K2P",
        "submitter_role": "student",
        "category": "no_show",
        "description": "Instructor did not show up...",
        "status": "open",
        "created_at": "2025-08-09T12:00:00Z"
      }
    ],
    "total": 3
  },
  "error": null
}
```

---

### GET /admin/disputes/:id

Get dispute detail.  
**Auth:** Bearer (admin)

**Response 200:** Full dispute record including linked booking summary and submitter details.

---

### PATCH /admin/disputes/:id/resolve

Resolve a dispute.  
**Auth:** Bearer (admin)

**Request:**
```json
{ "resolution_note": "Instructor confirmed last-minute cancellation. Student notified." }
```

**Response 200:**
```json
{ "data": { "dispute_id": "uuid", "status": "resolved" }, "error": null }
```

---

### PATCH /admin/disputes/:id/escalate

Escalate a dispute and flag the associated instructor for review.  
**Auth:** Bearer (admin)

**Response 200:**
```json
{ "data": { "dispute_id": "uuid", "status": "escalated" }, "error": null }
```

---

### GET /admin/users/search

Search for a user by email address.  
**Auth:** Bearer (admin)

**Query params:** `email` (required)

**Response 200:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "alex@example.com",
      "role": "student",
      "full_name": "Alex Chen",
      "created_at": "2025-01-15T10:00:00Z"
    }
  },
  "error": null
}
```

**Errors:** `404 NOT_FOUND`

---

## 9. Location Service — Port 3009 (Phase 2 Only)

This service does not exist in the MVP. Do not implement it until Phase 2 is unlocked.

**Planned endpoints:**
- `POST /location/validate` — Validate coordinates are within the GTA boundary
- `POST /location/geocode` — Reverse geocode lat/lng to street address
- `GET /location/service-areas` — Get instructor service area polygons

---

## 10. Inter-Service Event Contracts

Events are published via PostgreSQL `NOTIFY` and consumed via Supabase Realtime.

### booking.confirmed

**Published by:** booking-service  
**Consumed by:** notification-service

```json
{ "booking_id": "uuid", "student_id": "uuid", "instructor_id": "uuid" }
```

---

### booking.cancelled

**Published by:** booking-service  
**Consumed by:** notification-service

```json
{
  "booking_id": "uuid",
  "cancelled_by": "student" | "instructor",
  "student_id": "uuid",
  "instructor_id": "uuid"
}
```

---

### booking.completed

**Published by:** booking-service (cron job)  
**Consumed by:** notification-service

```json
{ "booking_id": "uuid", "student_id": "uuid" }
```

---

### instructor.approved

**Published by:** admin-service  
**Consumed by:** instructor-service, notification-service

```json
{ "instructor_id": "uuid" }
```

---

### instructor.rejected

**Published by:** admin-service  
**Consumed by:** notification-service

```json
{ "instructor_id": "uuid", "reason": "MTO certificate could not be verified." }
```

---

### instructor.suspended

**Published by:** admin-service  
**Consumed by:** booking-service, notification-service

```json
{ "instructor_id": "uuid" }
```

---

### subscription.activated

**Published by:** payment-service  
**Consumed by:** instructor-service

```json
{ "instructor_id": "uuid", "stripe_sub_id": "sub_xxx" }
```

---

### subscription.deactivated

**Published by:** payment-service  
**Consumed by:** instructor-service

```json
{ "instructor_id": "uuid" }
```

---

*DriveBook Service Contracts v1.0*

# Design Document — DriveBook Marketplace

## Overview

DriveBook is a two-sided marketplace connecting driving students with verified instructors in the Greater Toronto Area. The design follows a **microservices-lite** pattern: nine focused Node/TypeScript services, each owning a clear domain boundary, communicating over HTTP REST, and sharing a single Supabase (PostgreSQL) database with Row-Level Security enforcing access rules at the data layer.

This document is written for a **junior developer** working with Codex or Kiro. Every section explains *what*, *why*, and *how* so you can implement features confidently without needing to ask for context.

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | Shared types/config, atomic commits, fast incremental builds |
| Auth | Supabase Auth (GoTrue) | Built-in JWT, OAuth, email verification — no custom crypto needed |
| Inter-service comms | HTTP REST | Simple, debuggable, no broker infra needed at MVP scale |
| Event bus (MVP) | Supabase Realtime / pg NOTIFY | Zero extra infra; upgrade to Redis Streams / BullMQ in Phase 2 |
| Database | Single Supabase PostgreSQL instance | RLS enforces service ownership; simpler ops at MVP scale |
| Frontend | Next.js App Router on Vercel | Server Components for SEO, Edge Middleware for auth |
| Maps | Mapbox GL JS | Fine-grained control, generous free tier, custom styles |
| Payments | Stripe Subscriptions + Webhooks | PCI scope off-platform, mature SDK, excellent DX |
| Email | Resend | Developer-friendly, great TypeScript SDK |
| SMS | Twilio | Industry standard, reliable Canadian delivery |

---

## Architecture

### High-Level Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend (Vercel)                      │
│   /app/(student)  /app/(instructor)  /app/(admin)  /app/(auth)        │
│   React Query · shadcn/ui · Mapbox GL JS · react-hook-form/zod       │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ HTTPS / REST+JSON
              ┌────────────────┼────────────────────┐
              │                │                    │
   ┌──────────▼─────┐  ┌───────▼──────┐  ┌─────────▼──────┐
   │  auth-service  │  │  student-    │  │  instructor-   │
   │  :3001         │  │  service     │  │  service       │
   │                │  │  :3002       │  │  :3003         │
   └──────────┬─────┘  └───────┬──────┘  └─────────┬──────┘
              │                │                    │
   ┌──────────▼─────┐  ┌───────▼──────┐  ┌─────────▼──────┐
   │  booking-      │  │  search-     │  │  payment-      │
   │  service       │  │  service     │  │  service       │
   │  :3004         │  │  :3005       │  │  :3006         │
   └──────────┬─────┘  └──────────────┘  └─────────┬──────┘
              │                                     │
   ┌──────────▼─────┐  ┌──────────────┐  ┌─────────▼──────┐
   │  notification- │  │  admin-      │  │    Stripe      │
   │  service       │  │  service     │  │    (external)  │
   │  :3007         │  │  :3008       │  └────────────────┘
   └──────────┬─────┘  └──────────────┘
              │
   ┌──────────▼──────────────────────────────────────────┐
   │              Supabase (PostgreSQL + Auth + Storage)  │
   │   RLS enforced · pg NOTIFY for MVP event bus        │
   └──────────────────────────────────────────────────────┘

   Phase 2:
   ┌──────────────┐
   │  location-   │
   │  service     │  (Mapbox Geocoding + GTA boundary validation)
   │  :3009       │
   └──────────────┘
```

### Inter-Service Dependency Map

```
frontend
  ├── auth-service          (registration, login, token refresh)
  ├── student-service       (student profile read/update)
  ├── instructor-service    (profile, availability, documents)
  ├── search-service        (instructor discovery)
  ├── booking-service       (create, cancel, complete, rate)
  ├── payment-service       (Stripe checkout redirect, portal)
  └── admin-service         (admin dashboard — admin role only)

booking-service
  ├── calls instructor-service  (verify slot availability, mark reserved)
  ├── calls notification-service (confirmation, reminder, rating request emails)
  └── calls search-service      (invalidate cache on booking change)

payment-service
  ├── calls instructor-service  (update listing_status on Stripe event)
  └── calls notification-service (payment failure email)

admin-service
  ├── calls instructor-service  (approve/reject/suspend)
  └── calls notification-service (approval/rejection emails)

instructor-service
  └── calls notification-service (approval status change emails)

notification-service
  └── reads users table (for phone/email lookup)
      writes notifications_log table
```

### Event Bus (MVP — pg NOTIFY)

For MVP, inter-service events are published via PostgreSQL `NOTIFY` and consumed via Supabase Realtime channels. This requires zero extra infrastructure. Each service subscribes to its relevant channels on startup.

| Channel | Published by | Consumed by | Payload |
|---|---|---|---|
| `booking.confirmed` | booking-service | notification-service | `{ booking_id, student_id, instructor_id }` |
| `booking.cancelled` | booking-service | notification-service | `{ booking_id, cancelled_by, student_id, instructor_id }` |
| `booking.completed` | booking-service (cron) | notification-service | `{ booking_id, student_id }` |
| `instructor.approved` | admin-service | instructor-service, notification-service | `{ instructor_id }` |
| `instructor.rejected` | admin-service | notification-service | `{ instructor_id, reason }` |
| `instructor.suspended` | admin-service | booking-service, notification-service | `{ instructor_id }` |
| `subscription.activated` | payment-service | instructor-service | `{ instructor_id, stripe_sub_id }` |
| `subscription.deactivated` | payment-service | instructor-service | `{ instructor_id }` |

---

## Components and Interfaces

### Service Ownership Table

Each service **owns** the listed tables/concerns and must **not** write to tables owned by other services (except via HTTP calls to that service).

| Service | Owns | Does NOT Own |
|---|---|---|
| **auth-service** | `users` table, JWT issuance, session lifecycle, OAuth flow | Profiles, bookings, payments |
| **student-service** | Student-facing profile reads, student dashboard aggregation | Bookings (owned by booking-service), auth tokens |
| **instructor-service** | `instructor_profiles`, `availability_slots`, document storage | Bookings, ratings, payments, auth tokens |
| **booking-service** | `bookings`, `ratings`, reminder scheduling | Availability slot creation, payment billing, email delivery |
| **search-service** | Search index/cache (Redis or in-memory), search query execution | Any persistent table — read-only from `instructor_profiles` + `availability_slots` |
| **payment-service** | Stripe customer/subscription lifecycle, `stripe_events` (idempotency) | `instructor_profiles.listing_status` (written via HTTP call to instructor-service) |
| **notification-service** | `notifications_log`, email/SMS delivery | Any other table |
| **admin-service** | `admin_audit_log`, dispute resolution actions | Direct writes to `instructor_profiles` (via instructor-service HTTP) |
| **location-service** *(Phase 2)* | GTA boundary validation, reverse geocoding cache | All other tables |

---

### 1. Auth Service (`services/auth-service`)

**Port:** 3001  
**Responsibility:** Identity and session management via Supabase Auth.

#### What it owns
- `users` table (via Supabase Auth trigger that mirrors `auth.users` → `public.users`)
- JWT issuance and verification
- Email verification flow
- Password reset flow
- Rate limiting / account lockout state (stored in Redis or a `login_attempts` table)

#### What it does NOT own
- Profile data (instructor or student) — that belongs to instructor-service / student-service
- Booking or payment state

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Register new user (student or instructor) |
| `POST` | `/auth/login` | None | Login, returns JWT |
| `POST` | `/auth/logout` | Bearer | Invalidate session |
| `POST` | `/auth/refresh` | None (refresh token) | Refresh JWT |
| `POST` | `/auth/verify-email` | None | Confirm email via token |
| `POST` | `/auth/forgot-password` | None | Send password reset email |
| `POST` | `/auth/reset-password` | None | Apply new password with reset token |
| `GET` | `/auth/me` | Bearer | Return current user profile |

#### Events Published
- None (auth events handled synchronously)

#### Events Consumed
- None

#### Security Rules
- Passwords: minimum 8 characters, at least 1 letter + 1 number (validated with Zod before Supabase call)
- Account lockout: 5 failed attempts in 15 minutes → 30-minute lock
- JWT expiry: 7 days
- Email verification link expiry: 24 hours
- Password reset link expiry: 30 minutes
- Error messages must never distinguish between "email not found" and "wrong password"
- Rate limit: 10 requests/minute per IP on all auth endpoints (via middleware)

---

### 2. Student Service (`services/student-service`)

**Port:** 3002  
**Responsibility:** Student profile reads and dashboard data aggregation.

#### What it owns
- Student profile data sourced from `users` table (read-only from `auth-service` perspective)
- Student dashboard aggregation (upcoming/past booking summaries)

#### What it does NOT own
- Booking records (booking-service owns those)
- Auth tokens

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/students/me` | Bearer (student) | Get own profile |
| `PATCH` | `/students/me` | Bearer (student) | Update profile (name, phone, avatar) |
| `GET` | `/students/me/bookings` | Bearer (student) | Dashboard: upcoming + past bookings |
| `GET` | `/students/me/bookings/:id` | Bearer (student) | Booking detail |

#### Events Published
- None

#### Events Consumed
- None (reads bookings via direct DB query or booking-service HTTP call)

#### Security Rules
- Students can only read/write their own record (`WHERE id = auth.uid()` in RLS)
- No admin-level reads permitted

---

### 3. Instructor Service (`services/instructor-service`)

**Port:** 3003  
**Responsibility:** Instructor profiles, document uploads, availability slot management, admin approval state.

#### What it owns
- `instructor_profiles` table
- `availability_slots` table
- Supabase Storage bucket `instructor-docs`

#### What it does NOT own
- Booking records
- Rating recalculation (booking-service writes `avg_rating` back after rating submission — see booking-service)
- Payment billing

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/instructors/profile` | Bearer (instructor) | Create instructor profile |
| `GET` | `/instructors/:id` | Public | Get public instructor profile |
| `PATCH` | `/instructors/me` | Bearer (instructor) | Update own profile |
| `POST` | `/instructors/me/documents` | Bearer (instructor) | Upload verification document |
| `GET` | `/instructors/me/availability` | Bearer (instructor) | List own availability slots |
| `POST` | `/instructors/me/availability` | Bearer (instructor) | Create availability slot(s) |
| `DELETE` | `/instructors/me/availability/:slotId` | Bearer (instructor) | Delete single slot |
| `DELETE` | `/instructors/me/availability/series/:seriesId` | Bearer (instructor) | Delete entire series |
| `PATCH` | `/instructors/:id/status` | Bearer (admin) | Set approval status (internal — called by admin-service) |
| `PATCH` | `/instructors/:id/listing` | Bearer (payment-service JWT or internal key) | Set listing_status (called by payment-service) |

#### Events Published
- `instructor.approved` (via pg NOTIFY)
- `instructor.rejected` (via pg NOTIFY)
- `instructor.suspended` (via pg NOTIFY)

#### Events Consumed
- `subscription.activated` → set `listing_status = 'active'`
- `subscription.deactivated` → set `listing_status = 'inactive'`

#### Security Rules
- Instructors can only modify their own profile
- Document upload path enforced: `{instructor_id}/{document_type}/{filename}`
- Status changes (`approve`, `reject`, `suspend`) require `admin` role JWT
- `listing_status` write from payment-service requires internal service key (not user JWT)
- RLS policy: public can read `approved` + `active` instructors only

---

### 4. Booking Service (`services/booking-service`)

**Port:** 3004  
**Responsibility:** Full booking lifecycle — creation, confirmation, cancellation, completion, rating.

#### What it owns
- `bookings` table
- `ratings` table
- Reminder job scheduling (BullMQ queue or pg_cron)

#### What it does NOT own
- Availability slot creation (instructor-service)
- Email/SMS delivery (notification-service)
- Payment processing

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/bookings` | Bearer (student) | Create booking |
| `GET` | `/bookings/:id` | Bearer (student or instructor) | Get booking detail |
| `PATCH` | `/bookings/:id/cancel` | Bearer (student or instructor) | Cancel booking |
| `POST` | `/bookings/:id/rating` | Bearer (student) | Submit rating and review |
| `GET` | `/bookings/instructor/:instructorId` | Bearer (instructor) | Instructor's booking list |

#### Internal Endpoints (called by cron job)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/bookings/internal/complete-lessons` | Internal key | Auto-complete lessons past end_time |

#### Events Published
- `booking.confirmed` → consumed by notification-service
- `booking.cancelled` → consumed by notification-service
- `booking.completed` → consumed by notification-service

#### Events Consumed
- `instructor.suspended` → cancel future unconfirmed bookings for that instructor

#### Security Rules
- Students can only create/view/cancel their own bookings
- Instructors can only view/cancel bookings assigned to them
- Rating submission: booking must have `status = 'completed'`, `review_status = 'pending'`, and `student_id = auth.uid()`
- Late cancellation warning: enforce server-side (compare `now()` vs `start_time - 24h`)
- Reference code generation: use `crypto.randomBytes` — never `Math.random`

#### Reminder Scheduling

Two jobs are scheduled on booking creation:
1. **24h reminder**: `enqueue(bookingId, 'reminder_24h', startTime - 24h)`
2. **2h reminder**: `enqueue(bookingId, 'reminder_2h', startTime - 2h)`

A cron job runs every 15 minutes to auto-complete lessons:
```sql
UPDATE bookings
SET status = 'completed', updated_at = now()
WHERE status = 'confirmed'
  AND end_time < now() - INTERVAL '15 minutes'
```

---

### 5. Search Service (`services/search-service`)

**Port:** 3005  
**Responsibility:** Instructor discovery with filtering, ranking, and result caching.

#### What it owns
- Search cache (Redis or in-memory Map with TTL)
- Query execution logic (reads from `instructor_profiles` + `availability_slots`)

#### What it does NOT own
- Any persistent table (read-only consumer)

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/search/instructors` | Public | Search instructors with filters |
| `GET` | `/search/instructors/:id/slots` | Public | Get available slots for one instructor |

**Query Parameters for `GET /search/instructors`:**

| Param | Type | Description |
|---|---|---|
| `date_from` | ISO 8601 | Earliest lesson start |
| `date_to` | ISO 8601 | Latest lesson start |
| `languages` | `string[]` | Filter by spoken languages |
| `max_rate` | `number` | Maximum hourly rate CAD |
| `min_rating` | `number` | Minimum average rating |
| `lat` | `number` | Student pickup latitude |
| `lng` | `number` | Student pickup longitude |
| `sort_by` | `enum` | `distance` \| `rating` \| `price_asc` \| `price_desc` |
| `page` | `number` | Page number (default: 1) |
| `per_page` | `number` | Results per page (default: 10, max: 50) |

#### Location Ranking

Distance is calculated using the **Haversine formula** against the centroid of each instructor's service areas. Service area centroids are stored in `instructor_profiles.service_area_lat` and `service_area_lng` (Phase 2 moves this to a dedicated `location-service`).

```typescript
// Haversine formula — returns distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

#### Caching

Search results are cached for **60 seconds** using a keyed by a hash of all query parameters. Cache is invalidated when:
- A new booking is confirmed (reduces available slots)
- An instructor's listing status changes

#### Events Consumed
- `booking.confirmed` → invalidate cache for affected instructor
- `instructor.approved` / `instructor.suspended` → invalidate cache

#### Security Rules
- Public endpoint — no authentication required
- Only `active` + `approved` instructors appear in results
- Input validation with Zod (type, range, format checks on all params)

---

### 6. Payment Service (`services/payment-service`)

**Port:** 3006  
**Responsibility:** Stripe subscription lifecycle and webhook processing.

#### What it owns
- `stripe_events` table (idempotency log)
- Stripe customer and subscription management

#### What it does NOT own
- `instructor_profiles.listing_status` — written via HTTP call to instructor-service
- Email notifications — delegated to notification-service

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/checkout` | Bearer (instructor) | Create Stripe checkout session |
| `POST` | `/payments/portal` | Bearer (instructor) | Create Stripe billing portal session |
| `GET` | `/payments/status` | Bearer (instructor) | Get own subscription status |
| `POST` | `/webhooks/stripe` | Stripe-Signature header | Handle Stripe webhook events |

#### Stripe Webhook Events Handled

| Event | Action |
|---|---|
| `customer.subscription.created` | Call instructor-service to set `listing_status = 'active'`; record sub details |
| `customer.subscription.updated` | Sync subscription status |
| `customer.subscription.deleted` | Call instructor-service to set `listing_status = 'inactive'` |
| `invoice.payment_succeeded` | Update `sub_period_end`; notify via notification-service |
| `invoice.payment_failed` | Call instructor-service to set `listing_status = 'inactive'`; send failure email |
| *(any other event)* | Log event, return `200 OK` |

#### Idempotency

Before processing any Stripe event:
1. Check `stripe_events` table for `event_id`
2. If found → return `200 OK` immediately (already processed)
3. If not found → insert row, process event, update `processed = true`

#### Security Rules
- Webhook endpoint verifies `Stripe-Signature` header using `STRIPE_WEBHOOK_SECRET`
- Checkout/portal endpoints require `instructor` role JWT
- Internal calls to instructor-service use a shared internal service key (not user JWT), passed as `X-Internal-Key` header

---

### 7. Notification Service (`services/notification-service`)

**Port:** 3007  
**Responsibility:** All transactional email and SMS delivery, with retry logic and delivery logging.

#### What it owns
- `notifications_log` table
- Email provider abstraction (Resend by default)
- SMS provider (Twilio)

#### What it does NOT own
- Any business logic — it only delivers messages it is told to deliver
- User data — it receives all needed data in the request payload

#### API Endpoints (internal — not exposed publicly)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/notifications/email` | Internal key | Send transactional email |
| `POST` | `/notifications/sms` | Internal key | Send SMS |
| `POST` | `/notifications/reminder` | Internal key | Send lesson reminder (email + SMS) |

#### Email Events Handled

| Event | Trigger | Recipients |
|---|---|---|
| `registration` | User registers | Student or Instructor |
| `booking_confirmation` | Booking created | Student + Instructor |
| `booking_cancellation` | Booking cancelled | Other party |
| `lesson_reminder_24h` | 24h before lesson | Student + Instructor |
| `lesson_reminder_2h` | 2h before lesson | Student + Instructor |
| `rating_request` | Booking completed | Student |
| `dispute_submitted` | Dispute opened | Admin |
| `dispute_resolved` | Dispute resolved | Student + Instructor |
| `instructor_approved` | Admin approves | Instructor |
| `instructor_rejected` | Admin rejects | Instructor |
| `payment_failed` | Stripe payment fails | Instructor |

#### Retry Policy

1. First attempt: immediate
2. Second attempt: 30 seconds
3. Third attempt: 5 minutes
4. After 3 failures: log `status = 'failed'` and alert (future: PagerDuty)

All attempts and outcomes are written to `notifications_log`.

#### Events Consumed
- `booking.confirmed`, `booking.cancelled`, `booking.completed`
- `instructor.approved`, `instructor.rejected`, `instructor.suspended`

#### Security Rules
- All endpoints require `X-Internal-Key` header
- No user JWT accepted — this service is backend-only
- SMS sent only if `users.phone` is non-null and verified

---

### 8. Admin Service (`services/admin-service`)

**Port:** 3008  
**Responsibility:** Admin dashboard data, instructor approval/rejection/suspension, dispute resolution.

#### What it owns
- `admin_audit_log` table
- Admin dashboard aggregation queries

#### What it does NOT own
- Direct writes to `instructor_profiles` — delegates to instructor-service via HTTP
- Direct writes to `disputes` resolution — writes via own DB access to `disputes` table (admin-service has write permission on disputes)
- Email delivery — delegates to notification-service

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/dashboard` | Bearer (admin) | Platform health metrics |
| `GET` | `/admin/instructors` | Bearer (admin) | List instructors with status filter |
| `GET` | `/admin/instructors/:id` | Bearer (admin) | Full instructor detail + documents |
| `PATCH` | `/admin/instructors/:id/approve` | Bearer (admin) | Approve instructor |
| `PATCH` | `/admin/instructors/:id/reject` | Bearer (admin) | Reject instructor with reason |
| `PATCH` | `/admin/instructors/:id/suspend` | Bearer (admin) | Suspend instructor with reason |
| `GET` | `/admin/disputes` | Bearer (admin) | List disputes with status filter |
| `GET` | `/admin/disputes/:id` | Bearer (admin) | Dispute detail with booking info |
| `PATCH` | `/admin/disputes/:id/resolve` | Bearer (admin) | Resolve dispute with note |
| `PATCH` | `/admin/disputes/:id/escalate` | Bearer (admin) | Escalate dispute |
| `GET` | `/admin/users/search` | Bearer (admin) | Search student/instructor by email |

#### Audit Logging

Every admin action (approve, reject, suspend, resolve dispute, escalate) writes to `admin_audit_log`:
```json
{
  "admin_user_id": "uuid",
  "action": "approve_instructor",
  "target_id": "uuid",
  "target_type": "instructor",
  "notes": "MTO cert verified.",
  "timestamp": "2025-08-09T10:00:00Z"
}
```

#### Events Published
- `instructor.approved` → via pg NOTIFY
- `instructor.rejected` → via pg NOTIFY
- `instructor.suspended` → via pg NOTIFY

#### Security Rules
- Every route protected by `requireAdmin` middleware (checks JWT `role === 'admin'`)
- Returns `403` if non-admin attempts access
- Non-admin users must not see pending document URLs

---

### 9. Location Service (`services/location-service`) — Phase 2

**Port:** 3009  
**Responsibility:** GTA boundary validation, reverse geocoding, service area management.

#### MVP Note
In MVP, boundary validation is handled client-side in the frontend using a Mapbox GL JS boundary polygon, and the booking-service validates coordinates server-side with a simple bounding box. Phase 2 promotes this to a dedicated service.

#### Phase 2 Scope
- Reverse geocode pickup coordinates via Mapbox Geocoding API
- Validate coordinates are within the GTA boundary polygon
- Cache geocoding results (coordinates → address) for 24 hours
- Manage instructor service area polygons

---

## Data Models

### Full Database Schema with Service Ownership

All tables reside in the Supabase `public` schema. RLS is enabled on all tables.

---

#### `users` — owned by **auth-service**

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
  full_name       TEXT NOT NULL,
  phone           TEXT,
  phone_verified  BOOLEAN NOT NULL DEFAULT false,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Users can read their own row
CREATE POLICY "users: self read" ON users
  FOR SELECT USING (auth.uid() = id);
-- Users can update their own row
CREATE POLICY "users: self update" ON users
  FOR UPDATE USING (auth.uid() = id);
-- Admins can read all rows
CREATE POLICY "users: admin read all" ON users
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

---

#### `instructor_profiles` — owned by **instructor-service**

```sql
CREATE TABLE instructor_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'pending_review'
                        CHECK (status IN ('pending_review','approved','rejected','suspended')),
  listing_status        TEXT NOT NULL DEFAULT 'inactive'
                        CHECK (listing_status IN ('active','inactive')),
  bio                   TEXT CHECK (char_length(bio) <= 500),
  hourly_rate_cad       NUMERIC(8,2) NOT NULL CHECK (hourly_rate_cad > 0),
  years_experience      INT NOT NULL CHECK (years_experience >= 0),
  languages             TEXT[] NOT NULL,
  vehicle_make          TEXT,
  vehicle_model         TEXT,
  service_areas         TEXT[],          -- postal code prefixes e.g. ['M1','M2']
  service_area_lat      NUMERIC(10,7),   -- centroid latitude for Haversine
  service_area_lng      NUMERIC(10,7),   -- centroid longitude for Haversine
  mto_cert_number       TEXT NOT NULL,
  mto_cert_url          TEXT,
  gov_id_url            TEXT,
  insurance_url         TEXT,
  avg_rating            NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  total_bookings        INT NOT NULL DEFAULT 0,
  cancellation_count    INT NOT NULL DEFAULT 0,
  stripe_customer_id    TEXT UNIQUE,
  stripe_sub_id         TEXT UNIQUE,
  stripe_sub_status     TEXT,
  sub_period_start      TIMESTAMPTZ,
  sub_period_end        TIMESTAMPTZ,
  admin_notes           TEXT,
  rejected_reason       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructor_profiles_status ON instructor_profiles(status);
CREATE INDEX idx_instructor_profiles_listing ON instructor_profiles(listing_status);
CREATE INDEX idx_instructor_profiles_avg_rating ON instructor_profiles(avg_rating DESC);

ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
-- Public can read approved+active instructors
CREATE POLICY "instructor_profiles: public read active" ON instructor_profiles
  FOR SELECT USING (status = 'approved' AND listing_status = 'active');
-- Instructor can read their own profile regardless of status
CREATE POLICY "instructor_profiles: self read" ON instructor_profiles
  FOR SELECT USING (user_id = auth.uid());
-- Instructor can update their own profile (non-status fields)
CREATE POLICY "instructor_profiles: self update" ON instructor_profiles
  FOR UPDATE USING (user_id = auth.uid());
-- Admins can read and update all
CREATE POLICY "instructor_profiles: admin all" ON instructor_profiles
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

---

#### `availability_slots` — owned by **instructor-service**

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE availability_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id   UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'reserved')),
  recurrence      TEXT NOT NULL DEFAULT 'none'
                  CHECK (recurrence IN ('none', 'weekly', 'biweekly')),
  series_id       UUID,               -- groups recurring slots
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slots_end_after_start CHECK (end_time > start_time),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    instructor_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
);

CREATE INDEX idx_slots_instructor ON availability_slots(instructor_id);
CREATE INDEX idx_slots_start_time ON availability_slots(start_time);
CREATE INDEX idx_slots_status ON availability_slots(status);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
-- Public can read available slots for active instructors
CREATE POLICY "slots: public read available" ON availability_slots
  FOR SELECT USING (status = 'available');
-- Instructors can manage their own slots
CREATE POLICY "slots: instructor manage" ON availability_slots
  FOR ALL USING (
    instructor_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  );
```

---

#### `bookings` — owned by **booking-service**

```sql
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  TEXT UNIQUE NOT NULL,   -- format: DB-YYYYMMDD-XXXXX
  student_id      UUID NOT NULL REFERENCES users(id),
  instructor_id   UUID NOT NULL REFERENCES instructor_profiles(id),
  slot_id         UUID NOT NULL REFERENCES availability_slots(id),
  status          TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN (
                    'confirmed',
                    'completed',
                    'cancelled_by_student',
                    'cancelled_by_instructor'
                  )),
  pickup_lat      NUMERIC(10,7) NOT NULL,
  pickup_lng      NUMERIC(10,7) NOT NULL,
  pickup_address  TEXT NOT NULL,
  lesson_date     DATE NOT NULL,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  hourly_rate_cad NUMERIC(8,2) NOT NULL,
  review_status   TEXT NOT NULL DEFAULT 'pending'
                  CHECK (review_status IN ('pending', 'reviewed', 'skipped')),
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_instructor ON bookings(instructor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- Students can read their own bookings
CREATE POLICY "bookings: student self" ON bookings
  FOR SELECT USING (student_id = auth.uid());
-- Instructors can read bookings assigned to them
CREATE POLICY "bookings: instructor self" ON bookings
  FOR SELECT USING (
    instructor_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  );
-- Admins can read all
CREATE POLICY "bookings: admin read all" ON bookings
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

---

#### `ratings` — owned by **booking-service**

```sql
CREATE TABLE ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID UNIQUE NOT NULL REFERENCES bookings(id),
  student_id      UUID NOT NULL REFERENCES users(id),
  instructor_id   UUID NOT NULL REFERENCES instructor_profiles(id),
  score           INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  review_text     TEXT CHECK (char_length(review_text) <= 300),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ratings_instructor ON ratings(instructor_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
-- Ratings are publicly readable
CREATE POLICY "ratings: public read" ON ratings FOR SELECT USING (true);
-- Students can insert ratings for their own completed bookings
CREATE POLICY "ratings: student insert" ON ratings
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    booking_id IN (
      SELECT id FROM bookings
      WHERE student_id = auth.uid()
        AND status = 'completed'
        AND review_status = 'pending'
    )
  );
```

---

#### `disputes` — owned by **admin-service** (writes) / **booking-service** (inserts via student/instructor)

```sql
CREATE TABLE disputes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id),
  submitted_by    UUID NOT NULL REFERENCES users(id),
  submitter_role  TEXT NOT NULL CHECK (submitter_role IN ('student', 'instructor')),
  category        TEXT NOT NULL CHECK (category IN (
                    'no_show', 'unsafe_behaviour', 'payment_issue', 'other'
                  )),
  description     TEXT NOT NULL CHECK (char_length(description) <= 1000),
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'resolved', 'escalated')),
  resolution_note TEXT,
  resolved_by     UUID REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_booking ON disputes(booking_id);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
-- Submitter can read their own disputes
CREATE POLICY "disputes: submitter read" ON disputes
  FOR SELECT USING (submitted_by = auth.uid());
-- Admins can read and update all
CREATE POLICY "disputes: admin all" ON disputes
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

---

#### `notifications_log` — owned by **notification-service**

```sql
CREATE TABLE notifications_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  channel     TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  event_type  TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'retrying')),
  attempts    INT NOT NULL DEFAULT 1,
  booking_id  UUID REFERENCES bookings(id),
  sent_at     TIMESTAMPTZ,
  failed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications_log(user_id);
CREATE INDEX idx_notifications_status ON notifications_log(status);

ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
-- Only admins and the notification service (via service role key) can read/write
CREATE POLICY "notifications_log: admin read" ON notifications_log
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

---

#### `stripe_events` — owned by **payment-service**

```sql
CREATE TABLE stripe_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,   -- Stripe's evt_xxx ID
  event_type    TEXT NOT NULL,
  processed     BOOLEAN NOT NULL DEFAULT false,
  processed_at  TIMESTAMPTZ,
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- Only service role key can access (no user-level access)
```

---

#### `admin_audit_log` — owned by **admin-service**

```sql
CREATE TABLE admin_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL REFERENCES users(id),
  action          TEXT NOT NULL,  -- e.g. 'approve_instructor', 'resolve_dispute'
  target_id       UUID NOT NULL,
  target_type     TEXT NOT NULL,  -- 'instructor' | 'dispute' | 'user'
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log: admin read" ON admin_audit_log
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

---

#### `login_attempts` — owned by **auth-service**

```sql
CREATE TABLE login_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  ip_address  TEXT,
  succeeded   BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_attempts_email_time
  ON login_attempts(email, attempted_at DESC);
```

---

### Complete Entity Relationship Diagram

```
users (auth-service)
  │
  ├──< instructor_profiles (instructor-service)
  │     │
  │     ├──< availability_slots (instructor-service)
  │     │     │
  │     │     └──< bookings (booking-service)
  │     │               │
  │     │               ├──< ratings (booking-service)
  │     │               └──< disputes (admin-service)
  │     │
  │     └── stripe_events (payment-service) [linked by stripe_customer_id]
  │
  ├──< bookings.student_id
  ├──< notifications_log (notification-service)
  ├──< admin_audit_log.admin_user_id (admin-service)
  └──< login_attempts (auth-service)
```

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password Validation Rejects Invalid Passwords

*For any* string submitted as a password, the validator SHALL accept it if and only if it is at least 8 characters long and contains at least one letter and at least one number; all other strings SHALL be rejected.

**Validates: Requirements 1.1**

---

### Property 2: Token Expiry Calculation

*For any* timestamp at which a token (email verification link or JWT) is issued, the computed expiry SHALL equal the issued-at timestamp plus exactly the specified duration (24 hours for email verification, 7 days for JWT access tokens, 30 minutes for password reset tokens). No token SHALL be accepted after its computed expiry.

**Validates: Requirements 1.3, 1.6, 1.9**

---

### Property 3: Email Format Validation

*For any* string submitted as an email address, the validator SHALL accept it if and only if it matches the pattern `^[^@\s]+@[^@\s]+\.[^@\s]+$`; all other strings SHALL be rejected.

**Validates: Requirements 1.4**

---

### Property 4: Account Lockout After Failed Attempts

*For any* sequence of login attempts for an account, the account SHALL be locked if and only if 5 or more failed attempts occur within a rolling 15-minute window; the lock SHALL last exactly 30 minutes from the time of the 5th failure.

**Validates: Requirements 1.8**

---

### Property 5: Required Field Validation on Registration

*For any* instructor registration payload with one or more required fields missing or empty, the service SHALL reject the request with a 400 response and identify the missing field(s); no partial registration SHALL be persisted.

**Validates: Requirements 2.2**

---

### Property 6: Subscription Status Sync with Stripe Events

*For any* valid Stripe subscription event payload received by the webhook handler, the instructor's `listing_status` SHALL be set to `'active'` on `invoice.payment_succeeded` and to `'inactive'` on `invoice.payment_failed` or `customer.subscription.deleted`; the transition SHALL be applied exactly once regardless of how many times the same event is replayed (idempotency).

**Validates: Requirements 4.2, 4.3, 4.5**

---

### Property 7: Unknown Stripe Events Always Return 200

*For any* Stripe webhook payload with an event type not in the set of handled event types, the handler SHALL log the event and return HTTP `200 OK` without throwing an error or modifying any database state.

**Validates: Requirements 4.7**

---

### Property 8: Recurring Slot Generation Stays Within 60-Day Window

*For any* availability slot with a valid `start_time` and a recurrence pattern of `weekly` or `biweekly`, the set of generated slot instances SHALL contain only slots whose `start_time` falls within the half-open interval `[original_start_time, original_start_time + 60 days)`, and the count of generated instances SHALL equal `floor(60 / recurrence_days)`.

**Validates: Requirements 6.2**

---

### Property 9: Slot Reservation Is Exclusive (No Double Booking)

*For any* availability slot with status `'available'`, the first booking attempt SHALL succeed (status → `'confirmed'`, slot → `'reserved'`); any subsequent booking attempt for the same slot SHALL be rejected with `409 Conflict`.

**Validates: Requirements 6.5, 9.2**

---

### Property 10: Booking Cancellation Restores Slot

*For any* confirmed booking, cancelling it SHALL set the booking status to the appropriate cancelled variant and restore the associated slot status to `'available'`; the combination (book → cancel) is a round-trip that returns the slot to its original state.

**Validates: Requirements 6.6, 10.1, 10.2**

---

### Property 11: No Overlapping Availability Slots for an Instructor

*For any* pair of availability slot time ranges for the same instructor where the ranges overlap (i.e., `range1.start < range2.end AND range2.start < range1.end`), the attempt to insert the second slot SHALL be rejected with `409 Conflict`.

**Validates: Requirements 6.7**

---

### Property 12: Search Results Contain Only Active Instructors with Matching Slots

*For any* search query with a specified date/time range, every instructor returned in the results SHALL have `listing_status = 'active'` and `status = 'approved'`, and SHALL have at least one availability slot with status `'available'` whose time range overlaps the requested date/time range.

**Validates: Requirements 7.2**

---

### Property 13: Search Result Ordering Is Correct for All Sort Modes

*For any* set of search results and a specified `sort_by` parameter, the results SHALL be ordered such that: `distance` → ascending Haversine distance from pickup pin; `rating` → descending `avg_rating`; `price_asc` → ascending `hourly_rate_cad`; `price_desc` → descending `hourly_rate_cad`. Adjacent pairs in the returned list SHALL satisfy the ordering relation.

**Validates: Requirements 7.3, 7.4**

---

### Property 14: GTA Boundary Enforcement

*For any* latitude/longitude coordinate pair, the boundary validator SHALL return `true` if and only if the point lies within the GTA boundary polygon; coordinates outside the boundary SHALL be rejected, preventing booking creation.

**Validates: Requirements 8.5**

---

### Property 15: Booking Reference Code Format and Uniqueness

*For any* booking creation, the generated reference code SHALL match the regex `^DB-\d{8}-[A-Z0-9]{5}$`. Across any large set of independently generated reference codes (≥ 10,000), the probability of a collision SHALL be negligible (no collisions observed), confirming the `crypto.randomBytes`-based generator provides sufficient entropy.

**Validates: Requirements 9.3**

---

### Property 16: Instructor Cancellation Count Increments

*For any* instructor and any confirmed booking assigned to that instructor, when the instructor cancels the booking, the instructor's `cancellation_count` SHALL increase by exactly 1; no other instructor's `cancellation_count` SHALL change.

**Validates: Requirements 10.5**

---

### Property 17: Auto-Completion Query Selects Correct Bookings

*For any* set of bookings with varying statuses and end times, the auto-completion query (`status = 'confirmed' AND end_time < now()`) SHALL select exactly those bookings that are both confirmed and past their end time; no other bookings SHALL be selected or modified.

**Validates: Requirements 11.1**

---

### Property 18: Average Rating Recalculation Is Arithmetically Correct

*For any* instructor with an existing set of ratings and a newly submitted rating score `s`, the updated `avg_rating` SHALL equal `(SUM of all prior scores + s) / (COUNT of prior ratings + 1)`, rounded to two decimal places; the update SHALL be atomic (no concurrent rating submission produces an inconsistent average).

**Validates: Requirements 11.4, 11.7**

---

### Property 19: One Rating Per Booking

*For any* booking with `review_status = 'reviewed'`, any subsequent attempt by any user to submit a rating for the same booking SHALL be rejected with `409 Conflict`; the existing rating SHALL remain unchanged.

**Validates: Requirements 11.5**

---

### Property 20: Dispute Submission Allowed Only for Valid Booking Statuses

*For any* booking, a dispute submission SHALL succeed if and only if the booking status is `'confirmed'` or `'completed'`; submissions for bookings with any other status SHALL be rejected with a `422` or `400` error.

**Validates: Requirements 12.1**

---

### Property 21: Notification Retry Logic

*For any* notification delivery attempt where the provider returns a failure response, the notification service SHALL retry the delivery exactly 3 times before logging `status = 'failed'`; each retry delay SHALL be at least double the previous delay (exponential backoff); no notification SHALL be retried more than 3 times.

**Validates: Requirements 15.4**

---

### Property 22: Admin Role Enforcement on All Admin Endpoints

*For any* HTTP request to any endpoint under the `/admin/` path prefix, the request SHALL receive a `403 Forbidden` response if the JWT `role` claim is not `'admin'`; this holds regardless of which specific admin endpoint is called and regardless of whether a valid JWT is present.

**Validates: Requirements 16.1, 16.2**

---

## Error Handling

### Standard Response Envelope

All services return responses in a consistent JSON envelope:

```typescript
// Success
{
  "data": T,        // The response payload
  "error": null
}

// Error
{
  "data": null,
  "error": {
    "code": "SLOT_ALREADY_RESERVED",   // Machine-readable error code
    "message": "This time slot has already been booked.",  // Human-readable
    "details": {}   // Optional: field-level validation errors
  }
}
```

### HTTP Status Code Conventions

| Code | When to use |
|---|---|
| `200 OK` | Successful read or update |
| `201 Created` | Successful resource creation |
| `400 Bad Request` | Validation failure (Zod schema error) |
| `401 Unauthorized` | Missing or expired JWT |
| `403 Forbidden` | Authenticated but insufficient role |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource or constraint violation (e.g., slot overlap, duplicate rating) |
| `422 Unprocessable Entity` | Business rule violation (e.g., cancelling a completed booking) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error (never expose stack traces) |

### Error Codes Reference

| Code | Service | Meaning |
|---|---|---|
| `EMAIL_ALREADY_REGISTERED` | auth | Email is taken |
| `INVALID_CREDENTIALS` | auth | Wrong email or password (never specify which) |
| `ACCOUNT_LOCKED` | auth | Too many failed attempts |
| `EMAIL_NOT_VERIFIED` | auth | Account exists but email not confirmed |
| `SLOT_ALREADY_RESERVED` | booking | Slot has been taken |
| `SLOT_OVERLAP` | instructor | New slot overlaps existing slot |
| `LATE_CANCELLATION` | booking | Cancellation attempted within 24h window |
| `RATING_ALREADY_SUBMITTED` | booking | Booking already has a rating |
| `BOOKING_NOT_COMPLETED` | booking | Rating submitted for non-completed booking |
| `DISPUTE_INVALID_STATUS` | booking | Booking status not eligible for dispute |
| `STRIPE_SIGNATURE_INVALID` | payment | Webhook signature verification failed |
| `INSTRUCTOR_NOT_ACTIVE` | instructor | Instructor listing is inactive |
| `OUTSIDE_GTA_BOUNDARY` | booking/location | Pickup pin is outside GTA |
| `FORBIDDEN` | all | Role does not permit this action |

### Validation Layer

All service handlers validate incoming request bodies with **Zod** before any database interaction:

```typescript
// Example: booking creation schema
import { z } from 'zod';

export const createBookingSchema = z.object({
  slot_id: z.string().uuid(),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  pickup_address: z.string().min(1).max(500),
});

// In the handler:
const parsed = createBookingSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({
    data: null,
    error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() }
  });
}
```

### Database Error Handling

Services must handle these PostgreSQL error codes explicitly:

| PG Code | Meaning | Service Response |
|---|---|---|
| `23505` | Unique violation | `409 Conflict` with relevant error code |
| `23P01` | Exclusion constraint (slot overlap) | `409 SLOT_OVERLAP` |
| `23503` | Foreign key violation | `404 Not Found` for the referenced resource |
| `23514` | Check constraint violation | `400 Bad Request` |

```typescript
// Pattern for catching PG errors in Supabase
import { PostgrestError } from '@supabase/supabase-js';

function handleDbError(error: PostgrestError): never {
  switch (error.code) {
    case '23P01': throw new AppError(409, 'SLOT_OVERLAP', 'Overlapping slot exists.');
    case '23505': throw new AppError(409, 'DUPLICATE_RESOURCE', error.message);
    case '23503': throw new AppError(404, 'NOT_FOUND', 'Referenced resource not found.');
    default: throw new AppError(500, 'DATABASE_ERROR', 'An unexpected database error occurred.');
  }
}
```

### Stripe Webhook Error Handling

```typescript
// Always return 200 to Stripe — never let webhook errors cause Stripe to retry unnecessarily
app.post('/webhooks/stripe', async (req, res) => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature']!, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // Signature invalid — return 400 so Stripe knows to retry
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    await processStripeEvent(event);
  } catch (err) {
    // Processing error — log but still return 200 to avoid Stripe retrying
    logger.error('Stripe event processing failed', { eventId: event.id, error: err });
  }

  return res.status(200).json({ received: true });
});
```

---

## Testing Strategy

### Overview

DriveBook uses a **dual testing approach**: property-based tests for universal correctness guarantees, and unit/integration tests for specific examples and infrastructure wiring.

```
┌─────────────────────────────────────────────────────────────┐
│  Property-Based Tests (fast-check)                          │
│  • Run 100+ iterations per property                         │
│  • Cover business logic, validation, calculations           │
│  • Reference: Feature: drivebook-marketplace, Property N    │
├─────────────────────────────────────────────────────────────┤
│  Unit Tests (Vitest)                                        │
│  • Specific examples, edge cases, error conditions          │
│  • One test per handler function                            │
├─────────────────────────────────────────────────────────────┤
│  Integration Tests (Vitest + Supabase local)                │
│  • HTTP round-trips against local Supabase                  │
│  • Stripe webhook handler (real events, mock Stripe SDK)    │
│  • Mapbox geocoding (2-3 known coordinate/address pairs)    │
├─────────────────────────────────────────────────────────────┤
│  E2E Tests (Playwright)                                     │
│  • Key user journeys: register → search → book → rate       │
│  • Admin: approve instructor, resolve dispute               │
└─────────────────────────────────────────────────────────────┘
```

### Property-Based Testing Setup

**Library:** [`fast-check`](https://fast-check.dev/) — the standard PBT library for TypeScript.

**Configuration:** Each property test runs a minimum of **100 iterations** (configured globally):

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // fast-check global config
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});

// src/__tests__/setup.ts
import fc from 'fast-check';
fc.configureGlobal({ numRuns: 100, verbose: true });
```

**Tag format for each property test:**
```typescript
// Feature: drivebook-marketplace, Property 1: Password validation rejects invalid passwords
it('rejects passwords that do not meet requirements', () => {
  fc.assert(
    fc.property(/* ... */, (input) => { /* ... */ })
  );
});
```

### Property Test Examples

```typescript
// Property 3: Email Format Validation
import fc from 'fast-check';
import { validateEmail } from '../validation/email';

// Feature: drivebook-marketplace, Property 3: Email format validation
it('accepts only valid email formats', () => {
  const validEmail = fc.tuple(
    fc.stringMatching(/^[^\s@]+$/),
    fc.stringMatching(/^[^\s@.]+\.[^\s@]+$/)
  ).map(([local, domain]) => `${local}@${domain}`);

  fc.assert(
    fc.property(validEmail, (email) => {
      expect(validateEmail(email)).toBe(true);
    })
  );
});

// Feature: drivebook-marketplace, Property 13: Search result ordering
it('distance sort returns ascending order', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        instructor_id: fc.uuid(),
        service_area_lat: fc.float({ min: 43.5, max: 43.9 }),
        service_area_lng: fc.float({ min: -79.7, max: -79.1 }),
        avg_rating: fc.float({ min: 1, max: 5 }),
        hourly_rate_cad: fc.float({ min: 20, max: 200 }),
      }), { minLength: 2 }),
      fc.record({
        lat: fc.float({ min: 43.5, max: 43.9 }),
        lng: fc.float({ min: -79.7, max: -79.1 }),
      }),
      (instructors, pin) => {
        const results = sortByDistance(instructors, pin.lat, pin.lng);
        for (let i = 0; i < results.length - 1; i++) {
          const d1 = haversineKm(pin.lat, pin.lng, results[i].service_area_lat, results[i].service_area_lng);
          const d2 = haversineKm(pin.lat, pin.lng, results[i+1].service_area_lat, results[i+1].service_area_lng);
          expect(d1).toBeLessThanOrEqual(d2);
        }
      }
    )
  );
});
```

### Unit Test Coverage Targets

| Service | Target Coverage | Focus Areas |
|---|---|---|
| auth-service | ≥ 90% | Password validation, JWT claims, lockout logic |
| instructor-service | ≥ 85% | Slot overlap detection, profile updates, document path generation |
| booking-service | ≥ 90% | Booking creation, cancellation window, auto-completion query, rating calculation |
| search-service | ≥ 85% | Haversine formula, filter logic, cache key generation |
| payment-service | ≥ 90% | Webhook event routing, idempotency check, signature validation |
| notification-service | ≥ 85% | Retry logic, backoff timing, log writes |
| admin-service | ≥ 85% | Role enforcement middleware, audit log writes |

### Integration Tests (Smoke)

These run against a local Supabase instance and Stripe's test mode:

| Test | What it verifies |
|---|---|
| Auth flow | Register → verify email → login → get JWT |
| Instructor approval | Submit application → Admin approves → listing becomes activatable |
| Booking round-trip | Create slot → Book → Cancel → Slot restored |
| Stripe subscription | Checkout → webhook received → listing activated |
| Mapbox geocoding | 2 known GTA coordinates return correct addresses |

### E2E Tests (Playwright)

Located in `apps/web/e2e/`:

| Journey | Steps |
|---|---|
| Student registration and booking | Register → Verify email → Search instructors → Book slot → Receive confirmation email |
| Instructor onboarding | Register → Upload docs → Admin approves → Subscribe on Stripe → Profile goes live |
| Rating flow | Complete lesson → Receive rating email → Submit rating → Instructor avg updates |
| Admin dispute resolution | Student submits dispute → Admin views → Admin resolves → Both parties notified |

---

## Environment Variables Reference

All environment variables are read through `packages/config/src/env.ts` using a Zod schema. Never access `process.env` directly in service code.

```typescript
// packages/config/src/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  SUPABASE_URL:              z.string().url(),
  SUPABASE_ANON_KEY:         z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),  // Never expose to client

  // Stripe
  STRIPE_SECRET_KEY:         z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET:     z.string().startsWith('whsec_'),
  STRIPE_PRICE_ID:           z.string().startsWith('price_'),

  // Email (Resend)
  RESEND_API_KEY:            z.string().min(1),
  EMAIL_FROM:                z.string().email(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID:        z.string().min(1),
  TWILIO_AUTH_TOKEN:         z.string().min(1),
  TWILIO_PHONE_NUMBER:       z.string().min(1),

  // Internal service key (shared secret for service-to-service calls)
  INTERNAL_SERVICE_KEY:      z.string().min(32),

  // Mapbox
  NEXT_PUBLIC_MAPBOX_TOKEN:  z.string().min(1),

  // App
  NODE_ENV:                  z.enum(['development', 'test', 'production']),
  PORT:                      z.coerce.number().default(3000),

  // Redis (Phase 2 — optional in MVP)
  REDIS_URL:                 z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;
export const env: Env = envSchema.parse(process.env);
```

### Per-Service Environment Variable Requirements

| Variable | auth | student | instructor | booking | search | payment | notification | admin |
|---|---|---|---|---|---|---|---|---|
| `SUPABASE_URL` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | — | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `STRIPE_SECRET_KEY` | — | — | — | — | — | ✓ | — | — |
| `STRIPE_WEBHOOK_SECRET` | — | — | — | — | — | ✓ | — | — |
| `STRIPE_PRICE_ID` | — | — | — | — | — | ✓ | — | — |
| `RESEND_API_KEY` | — | — | — | — | — | — | ✓ | — |
| `TWILIO_ACCOUNT_SID` | — | — | — | — | — | — | ✓ | — |
| `TWILIO_AUTH_TOKEN` | — | — | — | — | — | — | ✓ | — |
| `TWILIO_PHONE_NUMBER` | — | — | — | — | — | — | ✓ | — |
| `INTERNAL_SERVICE_KEY` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | — | — | — | — | — | — | — | — |

`NEXT_PUBLIC_MAPBOX_TOKEN` is used only by `apps/web` (Next.js frontend).

---

## Folder Structure (Detailed)

```
drivebook/
├── apps/
│   └── web/                              # Next.js 14 App Router (Vercel)
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   └── verify-email/page.tsx
│       │   ├── (student)/
│       │   │   ├── search/page.tsx       # Instructor search + map
│       │   │   ├── booking/
│       │   │   │   ├── [slotId]/page.tsx # Booking confirmation flow
│       │   │   │   └── [id]/page.tsx     # Booking detail
│       │   │   └── dashboard/page.tsx   # Upcoming + past bookings
│       │   ├── (instructor)/
│       │   │   ├── profile/page.tsx
│       │   │   ├── availability/page.tsx
│       │   │   ├── dashboard/page.tsx
│       │   │   └── subscribe/page.tsx   # Stripe checkout redirect
│       │   └── (admin)/
│       │       ├── dashboard/page.tsx
│       │       ├── instructors/
│       │       │   ├── page.tsx          # Pending applications list
│       │       │   └── [id]/page.tsx    # Application detail + approve/reject
│       │       └── disputes/
│       │           ├── page.tsx
│       │           └── [id]/page.tsx
│       ├── components/
│       │   ├── ui/                       # shadcn/ui primitives
│       │   ├── map/
│       │   │   ├── InstructorMap.tsx     # Search results map view
│       │   │   └── PickupPinPicker.tsx  # Pin drop with reverse geocode
│       │   ├── booking/
│       │   │   ├── BookingSummary.tsx
│       │   │   ├── BookingCard.tsx
│       │   │   └── RatingForm.tsx
│       │   └── instructor/
│       │       ├── InstructorCard.tsx   # Search result card
│       │       ├── InstructorProfile.tsx
│       │       └── AvailabilityCalendar.tsx
│       ├── lib/
│       │   ├── api/
│       │   │   ├── auth.ts
│       │   │   ├── bookings.ts
│       │   │   ├── instructors.ts
│       │   │   └── search.ts
│       │   ├── auth.ts                   # Supabase SSR auth helpers
│       │   ├── mapbox.ts                 # Mapbox utils + GTA boundary
│       │   └── utils.ts
│       └── e2e/                          # Playwright tests
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   ├── register.ts
│   │   │   │   ├── login.ts
│   │   │   │   ├── logout.ts
│   │   │   │   ├── verifyEmail.ts
│   │   │   │   ├── forgotPassword.ts
│   │   │   │   └── resetPassword.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              # JWT verify middleware (shared)
│   │   │   │   └── rateLimiter.ts
│   │   │   ├── validation/
│   │   │   │   └── schemas.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   ├── student-service/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   ├── getProfile.ts
│   │   │   │   ├── updateProfile.ts
│   │   │   │   └── getBookings.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   ├── instructor-service/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   ├── createProfile.ts
│   │   │   │   ├── getProfile.ts
│   │   │   │   ├── updateProfile.ts
│   │   │   │   └── uploadDocument.ts
│   │   │   ├── availability/
│   │   │   │   ├── createSlots.ts       # Recurring slot generation
│   │   │   │   ├── deleteSlot.ts
│   │   │   │   ├── deleteSeries.ts
│   │   │   │   └── generateRecurring.ts # Pure function — generates slot dates
│   │   │   ├── validation/
│   │   │   │   └── schemas.ts
│   │   │   └── index.ts
│   │   └── __tests__/
│   ├── booking-service/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   ├── createBooking.ts
│   │   │   │   ├── getBooking.ts
│   │   │   │   ├── cancelBooking.ts
│   │   │   │   └── submitRating.ts
│   │   │   ├── scheduler/
│   │   │   │   ├── reminderQueue.ts     # BullMQ job scheduling
│   │   │   │   └── completionJob.ts    # Cron: auto-complete lessons
│   │   │   ├── utils/
│   │   │   │   └── referenceCode.ts    # DB-YYYYMMDD-XXXXX generator
│   │   │   └── index.ts
│   │   └── __tests__/
│   ├── search-service/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   └── searchInstructors.ts
│   │   │   ├── filters/
│   │   │   │   ├── filterBySlot.ts
│   │   │   │   ├── filterByLanguage.ts
│   │   │   │   └── filterByRate.ts
│   │   │   ├── ranking/
│   │   │   │   ├── haversine.ts        # Pure Haversine implementation
│   │   │   │   └── sortResults.ts
│   │   │   ├── cache/
│   │   │   │   └── searchCache.ts      # 60-second TTL cache
│   │   │   └── index.ts
│   │   └── __tests__/
│   ├── payment-service/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   ├── checkout.ts
│   │   │   │   ├── portal.ts
│   │   │   │   └── status.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── stripeWebhook.ts    # Signature verify + event router
│   │   │   │   └── eventHandlers.ts   # Per-event handlers
│   │   │   └── index.ts
│   │   └── __tests__/
│   ├── notification-service/
│   │   ├── src/
│   │   │   ├── email/
│   │   │   │   ├── provider.ts         # Resend abstraction
│   │   │   │   └── templates/          # HTML email templates
│   │   │   ├── sms/
│   │   │   │   └── twilio.ts
│   │   │   ├── handlers/
│   │   │   │   ├── sendEmail.ts
│   │   │   │   ├── sendSms.ts
│   │   │   │   └── sendReminder.ts
│   │   │   ├── retry/
│   │   │   │   └── retryPolicy.ts      # Exponential backoff logic
│   │   │   └── index.ts
│   │   └── __tests__/
│   └── admin-service/
│       ├── src/
│       │   ├── handlers/
│       │   │   ├── dashboard.ts
│       │   │   ├── instructors.ts
│       │   │   └── disputes.ts
│       │   ├── middleware/
│       │   │   └── requireAdmin.ts
│       │   └── index.ts
│       └── __tests__/
├── packages/
│   ├── types/                            # Shared TypeScript interfaces
│   │   └── src/
│   │       ├── user.ts
│   │       ├── instructor.ts
│   │       ├── booking.ts
│   │       ├── notification.ts
│   │       └── index.ts
│   ├── db/                               # Supabase client + migrations
│   │   ├── migrations/
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_instructor_profiles.sql
│   │   │   ├── 003_create_availability_slots.sql
│   │   │   ├── 004_create_bookings.sql
│   │   │   ├── 005_create_ratings.sql
│   │   │   ├── 006_create_disputes.sql
│   │   │   ├── 007_create_notifications_log.sql
│   │   │   ├── 008_create_stripe_events.sql
│   │   │   └── 009_create_admin_audit_log.sql
│   │   ├── seed/
│   │   │   └── dev-seed.ts
│   │   └── src/
│   │       └── client.ts                # Supabase client factory
│   └── config/
│       └── src/
│           └── env.ts                   # Zod env schema + parsed export
├── infra/                                # Optional Terraform/Pulumi
├── docs/
│   ├── adr/                              # Architecture Decision Records
│   │   ├── 001-monorepo-structure.md
│   │   ├── 002-microservices-lite.md
│   │   └── 003-event-bus-pg-notify.md
│   ├── scheduler.md                      # Reminder job scheduling decision
│   └── onboarding.md
├── .kiro/
│   └── specs/
│       └── drivebook-marketplace/
│           ├── requirements.md
│           ├── design.md                 # This document
│           └── tasks.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Codex Agent Instructions

These instructions are specifically for AI coding agents (Codex, Kiro, GitHub Copilot) working on DriveBook. Read this section before starting any implementation task.

### Mental Model

You are building a TypeScript monorepo. Think of each service in `services/` as a small Express/Hono app with its own domain. Services talk to each other over HTTP. All data lives in a single Supabase PostgreSQL database — but each service should only read/write its own tables (see the ownership table in Components and Interfaces above).

### Before You Write Any Code

1. **Read `packages/types/src/`** to understand the shared data types. Do not invent new types that duplicate these.
2. **Read `packages/config/src/env.ts`** to see what environment variables are available. Never use `process.env` directly.
3. **Read the relevant service's existing handlers** to match the code style before adding new ones.
4. **Check `packages/db/migrations/`** to understand the current schema before writing queries.

### Writing a New Service Handler

Follow this pattern exactly:

```typescript
// services/booking-service/src/handlers/createBooking.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '@drivebook/db';
import { env } from '@drivebook/config';
import type { Booking } from '@drivebook/types';

// 1. Define the Zod schema for request validation
const createBookingSchema = z.object({
  slot_id: z.string().uuid('slot_id must be a UUID'),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  pickup_address: z.string().min(1).max(500),
});

// 2. Export a named handler function (no default exports)
export async function createBookingHandler(req: Request, res: Response): Promise<void> {
  // 3. Validate request body with Zod
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const { slot_id, pickup_lat, pickup_lng, pickup_address } = parsed.data;
  const studentId = req.user.id; // Set by auth middleware

  // 4. Business logic here (keep under 40 lines)
  // ...

  // 5. Return standard envelope
  res.status(201).json({ data: booking, error: null });
}
```

### Writing Tests

Every handler file must have a corresponding test file in `__tests__/`:

```typescript
// services/booking-service/__tests__/createBooking.test.ts
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

describe('createBookingHandler', () => {
  // Unit test: specific example
  it('returns 409 when slot is already reserved', async () => {
    // ...
  });

  // Property test: universal property
  // Feature: drivebook-marketplace, Property 15: Booking reference code format
  it('generates reference codes matching DB-YYYYMMDD-XXXXX format', () => {
    fc.assert(
      fc.property(fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') }), (date) => {
        const code = generateReferenceCode(date);
        expect(code).toMatch(/^DB-\d{8}-[A-Z0-9]{5}$/);
      })
    );
  });
});
```

### Database Access Rules

```typescript
// ✅ CORRECT — use the shared Supabase client
import { supabase } from '@drivebook/db';

const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('student_id', studentId);

// ❌ WRONG — do not use raw SQL in handlers
import { Pool } from 'pg';
const result = await pool.query('SELECT * FROM bookings WHERE student_id = $1', [studentId]);

// ✅ CORRECT — migrations use raw SQL (this is the exception)
// packages/db/migrations/004_create_bookings.sql
```

### Service-to-Service Calls

When one service needs to call another:

```typescript
// services/booking-service/src/utils/callNotificationService.ts
import { env } from '@drivebook/config';

export async function notifyBookingConfirmed(bookingId: string, studentId: string, instructorId: string) {
  const response = await fetch(`${env.NOTIFICATION_SERVICE_URL}/notifications/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': env.INTERNAL_SERVICE_KEY,
    },
    body: JSON.stringify({
      event_type: 'booking_confirmation',
      booking_id: bookingId,
      student_id: studentId,
      instructor_id: instructorId,
    }),
  });

  if (!response.ok) {
    // Log but don't throw — notification failure should not fail the booking
    console.error('Notification service call failed', await response.text());
  }
}
```

### Common Mistakes to Avoid

| ❌ Don't | ✅ Do instead |
|---|---|
| Use `any` type | Use explicit types from `@drivebook/types` |
| Access `process.env` directly | Use `env` from `@drivebook/config` |
| Use `Math.random()` for IDs | Use `crypto.randomBytes()` or `crypto.randomUUID()` |
| Write raw SQL in handlers | Use Supabase client |
| Return stack traces to clients | Log server-side, return only error codes and messages |
| Make service calls in a loop | Batch or queue them |
| Skip input validation | Always validate with Zod before any processing |
| Catch all errors silently | Log with context: `logger.error('msg', { context, error })` |
| Default exports in services | Named exports only (except Next.js pages) |
| Modify another service's tables directly | Call that service's HTTP endpoint |

### Running Checks Locally

```bash
# Type check entire monorepo
pnpm turbo typecheck

# Run tests for a specific service
pnpm --filter booking-service test --run

# Run all tests
pnpm turbo test

# Run a single migration against local Supabase
supabase db reset --local

# Build all packages
pnpm turbo build
```

---

*Design document version 1.0 — DriveBook Marketplace*  
*Workflow: Requirements-First*  
*Last updated: 2025*

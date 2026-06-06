# DriveBook — Architecture

**Version:** 1.0  
**Status:** Active  
**Last updated:** June 2026

> Read this before writing code. It tells you what each service owns, how services talk to each other, and what the database looks like.

---

## 1. Overview

DriveBook uses a **microservices-lite** architecture inside a **Turborepo monorepo**. There are 9 focused Node/TypeScript services, each owning a clear domain boundary. All services share a single Supabase PostgreSQL database with Row-Level Security (RLS) enforcing data access at the database layer.

### Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | Shared types/config, atomic commits, fast incremental builds |
| Auth | Supabase Auth (GoTrue) | JWT, OAuth, email verification — no custom crypto needed |
| Inter-service comms | HTTP REST | Simple, debuggable, no message broker needed at MVP scale |
| Event bus (MVP) | PostgreSQL `NOTIFY` / Supabase Realtime | Zero extra infrastructure |
| Database | Single Supabase PostgreSQL instance | RLS enforces service ownership; simpler ops at MVP scale |
| Frontend | Next.js 14 App Router on Vercel | Server Components for SEO, Edge Middleware for auth |
| Maps | Mapbox GL JS | Fine-grained control, generous free tier |
| Payments | Stripe Subscriptions + Webhooks | PCI off-platform, mature SDK |
| Email | Resend | Great TypeScript SDK |
| SMS | Twilio | Reliable Canadian delivery |

---

## 2. System Diagram

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
   │           Supabase (PostgreSQL + Auth + Storage)     │
   │   RLS enforced · pg NOTIFY for MVP event bus        │
   └──────────────────────────────────────────────────────┘

   Phase 2 only:
   ┌──────────────┐
   │  location-   │
   │  service     │  Mapbox Geocoding + GTA boundary validation
   │  :3009       │
   └──────────────┘
```

---

## 3. Service Ownership Table

This is the most important table in this document. Each service **owns** the listed resources. A service must **never write directly** to a table owned by another service — it must call that service's HTTP endpoint instead.

| Service | Port | Owns | Does NOT Own |
|---|---|---|---|
| **auth-service** | 3001 | `users` table, JWT issuance, OAuth flow, session lifecycle | Profiles, bookings, payments |
| **student-service** | 3002 | Student profile reads, student dashboard aggregation | Bookings (booking-service), auth tokens |
| **instructor-service** | 3003 | `instructor_profiles`, `availability_slots`, `instructor-docs` storage bucket | Bookings, ratings, payments, auth tokens |
| **booking-service** | 3004 | `bookings`, `ratings`, reminder job scheduling | Slot creation, payment billing, email delivery |
| **search-service** | 3005 | Search cache (in-memory, 60s TTL), query execution | Any persistent table — read-only |
| **payment-service** | 3006 | `stripe_events` (idempotency log), Stripe customer/subscription lifecycle | `instructor_profiles.listing_status` (written via HTTP to instructor-service) |
| **notification-service** | 3007 | `notifications_log`, email/SMS delivery | Any other table; all business logic |
| **admin-service** | 3008 | `admin_audit_log`, dispute resolution writes to `disputes` table | Direct writes to `instructor_profiles` (via instructor-service HTTP) |
| **location-service** | 3009 | GTA boundary validation, reverse geocoding cache | All other tables — Phase 2 only |

---

## 4. Inter-Service Dependency Map

```
frontend
  ├── auth-service          (register, login, token refresh, me)
  ├── student-service       (student profile, dashboard)
  ├── instructor-service    (profile, availability, documents)
  ├── search-service        (instructor discovery, slot browsing)
  ├── booking-service       (create, cancel, complete, rate)
  ├── payment-service       (Stripe checkout, portal, status)
  └── admin-service         (admin dashboard — admin role only)

booking-service
  ├── → instructor-service  (verify + reserve availability slot)
  ├── → notification-service (confirmation, reminders, rating request)
  └── → search-service      (invalidate cache after booking)

payment-service
  ├── → instructor-service  (update listing_status on Stripe event)
  └── → notification-service (payment failure email)

admin-service
  ├── → instructor-service  (approve / reject / suspend)
  └── → notification-service (approval/rejection emails)

instructor-service
  └── → notification-service (approval status change emails)

notification-service
  └── reads users (phone/email lookup)
      writes notifications_log
```

---

## 5. Event Bus (MVP — pg NOTIFY)

Inter-service events use PostgreSQL `NOTIFY` consumed via Supabase Realtime channels. No extra infrastructure required at MVP scale.

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

## 6. Database Schema

All tables are in the Supabase `public` schema. RLS is enabled on every table.

### `users` — owned by auth-service

```sql
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
  full_name      TEXT NOT NULL,
  phone          TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  avatar_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `instructor_profiles` — owned by instructor-service

```sql
CREATE TABLE instructor_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'pending_review'
                     CHECK (status IN ('pending_review','approved','rejected','suspended')),
  listing_status     TEXT NOT NULL DEFAULT 'inactive'
                     CHECK (listing_status IN ('active','inactive')),
  bio                TEXT CHECK (char_length(bio) <= 500),
  hourly_rate_cad    NUMERIC(8,2) NOT NULL CHECK (hourly_rate_cad > 0),
  years_experience   INT NOT NULL CHECK (years_experience >= 0),
  languages          TEXT[] NOT NULL,
  vehicle_make       TEXT,
  vehicle_model      TEXT,
  service_areas      TEXT[],          -- postal code prefixes e.g. ['M1','M2']
  service_area_lat   NUMERIC(10,7),   -- centroid latitude for Haversine distance
  service_area_lng   NUMERIC(10,7),   -- centroid longitude for Haversine distance
  mto_cert_number    TEXT NOT NULL,
  mto_cert_url       TEXT,
  gov_id_url         TEXT,
  insurance_url      TEXT,
  avg_rating         NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  total_bookings     INT NOT NULL DEFAULT 0,
  cancellation_count INT NOT NULL DEFAULT 0,
  stripe_customer_id TEXT UNIQUE,
  stripe_sub_id      TEXT UNIQUE,
  stripe_sub_status  TEXT,
  sub_period_start   TIMESTAMPTZ,
  sub_period_end     TIMESTAMPTZ,
  admin_notes        TEXT,
  rejected_reason    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `availability_slots` — owned by instructor-service

```sql
CREATE TABLE availability_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'available'
                CHECK (status IN ('available','reserved')),
  recurrence    TEXT NOT NULL DEFAULT 'none'
                CHECK (recurrence IN ('none','weekly','biweekly')),
  series_id     UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slots_end_after_start CHECK (end_time > start_time),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    instructor_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
);
```

### `bookings` — owned by booking-service

```sql
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code  TEXT UNIQUE NOT NULL,  -- format: DB-YYYYMMDD-XXXXX
  student_id      UUID NOT NULL REFERENCES users(id),
  instructor_id   UUID NOT NULL REFERENCES instructor_profiles(id),
  slot_id         UUID NOT NULL REFERENCES availability_slots(id),
  status          TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN (
                    'confirmed','completed',
                    'cancelled_by_student','cancelled_by_instructor'
                  )),
  pickup_lat      NUMERIC(10,7) NOT NULL,
  pickup_lng      NUMERIC(10,7) NOT NULL,
  pickup_address  TEXT NOT NULL,
  lesson_date     DATE NOT NULL,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  hourly_rate_cad NUMERIC(8,2) NOT NULL,
  review_status   TEXT NOT NULL DEFAULT 'pending'
                  CHECK (review_status IN ('pending','reviewed','skipped')),
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `ratings` — owned by booking-service

```sql
CREATE TABLE ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID UNIQUE NOT NULL REFERENCES bookings(id),
  student_id    UUID NOT NULL REFERENCES users(id),
  instructor_id UUID NOT NULL REFERENCES instructor_profiles(id),
  score         INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  review_text   TEXT CHECK (char_length(review_text) <= 300),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `disputes` — owned by admin-service (writes), created by booking-service

```sql
CREATE TABLE disputes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id),
  submitted_by    UUID NOT NULL REFERENCES users(id),
  submitter_role  TEXT NOT NULL CHECK (submitter_role IN ('student','instructor')),
  category        TEXT NOT NULL CHECK (category IN (
                    'no_show','unsafe_behaviour','payment_issue','other'
                  )),
  description     TEXT NOT NULL CHECK (char_length(description) <= 1000),
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','resolved','escalated')),
  resolution_note TEXT,
  resolved_by     UUID REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `notifications_log` — owned by notification-service

```sql
CREATE TABLE notifications_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  channel    TEXT NOT NULL CHECK (channel IN ('email','sms')),
  event_type TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('sent','failed','retrying')),
  attempts   INT NOT NULL DEFAULT 1,
  booking_id UUID REFERENCES bookings(id),
  sent_at    TIMESTAMPTZ,
  failed_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `stripe_events` — owned by payment-service

```sql
CREATE TABLE stripe_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type      TEXT NOT NULL,
  processed       BOOLEAN NOT NULL DEFAULT false,
  processed_at    TIMESTAMPTZ,
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `admin_audit_log` — owned by admin-service

```sql
CREATE TABLE admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action        TEXT NOT NULL,
  target_id     UUID NOT NULL,
  target_type   TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `login_attempts` — owned by auth-service

```sql
CREATE TABLE login_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  ip_address   TEXT,
  succeeded    BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7. Folder Structure

```
drivebook/
├── apps/
│   └── web/                          # Next.js 14 App Router (Vercel)
│       ├── app/
│       │   ├── (auth)/               # login, register, verify-email
│       │   ├── (student)/            # search, booking, dashboard
│       │   ├── (instructor)/         # profile, availability, dashboard, subscribe
│       │   └── (admin)/              # dashboard, instructors, disputes
│       ├── components/
│       │   ├── ui/                   # shadcn/ui primitives
│       │   ├── map/                  # InstructorMap, PickupPinPicker
│       │   ├── booking/              # BookingSummary, BookingCard, RatingForm
│       │   └── instructor/           # InstructorCard, InstructorProfile
│       ├── lib/
│       │   ├── api/                  # Typed API client per service
│       │   ├── auth.ts               # Supabase SSR auth helpers
│       │   ├── mapbox.ts             # Mapbox utils + GTA boundary
│       │   └── utils.ts
│       └── e2e/                      # Playwright E2E tests
├── services/
│   ├── auth-service/                 # Port 3001
│   ├── student-service/              # Port 3002
│   ├── instructor-service/           # Port 3003
│   ├── booking-service/              # Port 3004
│   ├── search-service/               # Port 3005
│   ├── payment-service/              # Port 3006
│   ├── notification-service/         # Port 3007
│   └── admin-service/                # Port 3008
│   # location-service (Phase 2)      # Port 3009
├── packages/
│   ├── types/                        # Shared TypeScript interfaces
│   ├── db/                           # Supabase client + migrations + seed
│   └── config/                       # Zod env schema → typed env object
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md               # This file
│   ├── SERVICE_CONTRACTS.md
│   └── AGENT_INSTRUCTIONS.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

Each service follows the same internal layout:

```
services/<service-name>/
├── src/
│   ├── handlers/       # One file per endpoint (e.g. createBooking.ts)
│   ├── middleware/     # Auth, rate limiting, role checks
│   ├── validation/     # Zod schemas
│   └── index.ts        # Express app, route registration
├── __tests__/          # Vitest unit + fast-check property tests
├── package.json
└── tsconfig.json
```

---

## 8. Shared Packages

### `@drivebook/types` (`packages/types`)

All TypeScript interfaces shared across services. Always check here before defining a new type.

```typescript
// Key types
export type UserRole = 'student' | 'instructor' | 'admin';
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled_by_student' | 'cancelled_by_instructor';
export type InstructorStatus = 'pending_review' | 'approved' | 'rejected' | 'suspended';
export type ListingStatus = 'active' | 'inactive';
export type SlotStatus = 'available' | 'reserved';
export type DisputeStatus = 'open' | 'resolved' | 'escalated';
```

### `@drivebook/db` (`packages/db`)

Supabase client factory. Import `supabase` from here — never create your own Supabase client.

```typescript
import { supabase } from '@drivebook/db';
```

Migrations live in `packages/db/migrations/`. Run them with `supabase db reset --local`.

### `@drivebook/config` (`packages/config`)

Zod-validated environment variables. Never use `process.env` directly.

```typescript
import { env } from '@drivebook/config';
const key = env.STRIPE_SECRET_KEY;
```

---

## 9. Authentication Pattern

All protected endpoints use a shared JWT middleware from `services/auth-service/src/middleware/auth.ts`:

```typescript
// Usage in any service
import { requireAuth } from '@drivebook/auth-middleware';
import { requireAdmin } from '@drivebook/admin-middleware';

router.get('/students/me', requireAuth, getProfileHandler);
router.patch('/admin/instructors/:id/approve', requireAdmin, approveInstructorHandler);
```

JWT claims include: `sub` (user ID), `role` (`student` | `instructor` | `admin`), `email`, `exp`.

---

## 10. Service-to-Service Calls

When one service calls another, it uses the internal service key:

```typescript
const response = await fetch(`${env.NOTIFICATION_SERVICE_URL}/notifications/email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Key': env.INTERNAL_SERVICE_KEY,
  },
  body: JSON.stringify({ event_type: 'booking_confirmation', booking_id, student_id, instructor_id }),
});
```

Notification failures should be logged but must not cause the calling operation to fail.

---

## 11. Error Response Format

All services return the same JSON envelope:

```json
// Success
{ "data": <payload>, "error": null }

// Error
{ "data": null, "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": {} } }
```

See `SERVICE_CONTRACTS.md` for the full error code reference.

---

## 12. Environment Variables

All env vars are validated and typed by `packages/config/src/env.ts`. Key variables:

| Variable | Used by |
|---|---|
| `SUPABASE_URL` | All services |
| `SUPABASE_ANON_KEY` | auth, student, instructor, booking, admin |
| `SUPABASE_SERVICE_ROLE_KEY` | auth, instructor, booking, payment, notification, admin |
| `STRIPE_SECRET_KEY` | payment-service |
| `STRIPE_WEBHOOK_SECRET` | payment-service |
| `STRIPE_PRICE_ID` | payment-service |
| `RESEND_API_KEY` | notification-service |
| `TWILIO_ACCOUNT_SID` | notification-service |
| `TWILIO_AUTH_TOKEN` | notification-service |
| `TWILIO_PHONE_NUMBER` | notification-service |
| `INTERNAL_SERVICE_KEY` | All services (service-to-service auth) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | apps/web only |

---

## 13. Correctness Properties

The system has 22 formally defined correctness properties used for property-based testing with `fast-check`. Full definitions are in `.kiro/specs/drivebook-marketplace/design.md`.

Key properties to know:

| # | Property | Validates |
|---|---|---|
| 1 | Password validation rejects invalid passwords | Auth registration |
| 6 | Stripe webhook idempotency | Payment processing |
| 9 | Slot reservation is exclusive (no double booking) | Booking creation |
| 10 | Cancellation restores slot to available | Booking cancellation |
| 11 | No overlapping availability slots for one instructor | Slot creation |
| 15 | Booking reference code format `DB-YYYYMMDD-XXXXX` | Booking creation |
| 18 | Average rating arithmetic is correct | Rating submission |
| 22 | Admin role enforced on all `/admin/` routes | Authorization |

---

*DriveBook Architecture v1.0*

# Requirements Document

## Introduction

DriveBook is a Toronto-based two-sided marketplace that connects students preparing for Ontario G2 and G road tests with verified, professional driving instructors. The platform eliminates the friction of discovery, scheduling, payments, and accountability that currently plagues both sides of the market.

Students find trusted instructors by availability, language, pickup location, and rating — then book and pay in minutes. Instructors get a steady pipeline of students, automated scheduling, and a subscription-based management tool that replaces their patchwork of Facebook ads, Kijiji posts, and manual DMs.

This document covers the complete product requirements for the DriveBook MVP, including user personas, user stories, service architecture, folder structure, database model, API contracts, build phases, acceptance criteria, and agent instructions for Codex-assisted development.

---

## Glossary

- **Student**: A registered user who books driving lessons through the platform.
- **Instructor**: A verified driving professional who lists availability and accepts bookings through the platform.
- **Admin**: A DriveBook staff member who approves instructors, manages disputes, and oversees platform health.
- **Booking**: A confirmed lesson session between a Student and an Instructor at a specific date, time, and pickup location.
- **Availability Slot**: A time window uploaded by an Instructor indicating they are available for bookings.
- **Pickup Pin**: A geographic coordinate dropped by a Student on a map to indicate their desired lesson pickup location.
- **Subscription**: A recurring monthly payment made by an Instructor to maintain an active listing on the platform.
- **Rating**: A 1–5 star score submitted by a Student after a completed Booking.
- **Review**: An optional text comment submitted by a Student alongside a Rating.
- **Dispute**: A formal complaint raised by either a Student or Instructor regarding a Booking.
- **Stripe**: The third-party payment processor used for Subscription billing and future Booking payments.
- **Supabase**: The backend-as-a-service platform providing PostgreSQL database and authentication.
- **Platform**: The DriveBook system as a whole, including all services, frontend, and admin tools.
- **Service**: An independently deployable Node/TypeScript module within the monorepo.
- **MVP**: Minimum Viable Product — the initial production-ready release of DriveBook.

---

## User Personas

### Persona 1 — The Road Test Repeater (Student)

**Name:** Alex, 23  
**Background:** Failed the G2 road test once. Works part-time, lives in Scarborough. Needs flexible scheduling and pickup near home. Speaks English and Mandarin. Distrusts random Facebook listings but cannot afford a big driving school package.  
**Goals:** Find a reliable instructor near Scarborough who speaks Mandarin, fits a Saturday afternoon schedule, and charges a fair hourly rate.  
**Frustrations:** No-shows, instructors who cancel last minute, having to pay cash with no receipt, no way to verify an instructor's credentials.

### Persona 2 — The New Arrival (Student)

**Name:** Priya, 28  
**Background:** Recently moved to Toronto from India. Has an international licence. Needs to pass the G road test. Prefers Hindi-speaking instructors. Relies on transit and needs the instructor to pick her up at a specific subway station.  
**Goals:** Book lessons in advance, communicate clearly in her language, pay online safely, and track her progress.  
**Frustrations:** Language barrier with many instructors, difficulty paying online, no accountability when instructors cancel.

### Persona 3 — The Independent Instructor

**Name:** Michael, 41  
**Background:** Certified MTO-approved driving instructor with 8 years of experience. Works independently out of North York. Currently posts on Kijiji and relies on referrals. Loses 2–3 hours a week managing scheduling via WhatsApp.  
**Goals:** Fill his calendar consistently, stop managing bookings manually, get paid reliably, and build his online reputation with reviews.  
**Frustrations:** Students who no-show, manually chasing payments, rebuilding his Kijiji listing every 30 days, having no professional profile.

### Persona 4 — The DriveBook Admin

**Name:** Internal staff member  
**Background:** Responsible for instructor verification, dispute resolution, and platform monitoring.  
**Goals:** Quickly approve or reject instructor applications with supporting documents, resolve student–instructor disputes, and monitor platform health metrics.  
**Frustrations:** No central tool to track disputes, no audit trail for approvals.

---

## MVP Scope

The MVP delivers the core booking loop end-to-end:

**In scope:**
- Student and Instructor registration and authentication (email + OAuth via Supabase)
- Instructor profile creation, document upload, and admin approval workflow
- Instructor subscription via Stripe ($20/month)
- Availability management (weekly, bi-weekly, or monthly slots)
- Student search and filter (location, language, rating, price, availability)
- Pickup pin drop on a map (Mapbox or Google Maps)
- Booking creation, confirmation, and cancellation
- Automated email and SMS reminders (24h and 2h before lesson)
- Post-lesson ratings and reviews
- Dispute submission and admin resolution
- Admin dashboard (instructor approval, dispute management, subscription status)
- Responsive web app (Next.js, mobile-first)

**Out of scope for MVP:**
- Mobile native apps (iOS/Android)
- In-app messaging/chat
- Booking commission fees (subscription-only model at launch)
- Multi-city expansion
- Lesson packages or bundles
- Video verification calls
- Referral or loyalty programs

---

## Requirements

### Requirement 1: Student Registration and Authentication

**User Story:** As a Student, I want to create an account and log in securely, so that I can access the platform and manage my bookings.

#### Acceptance Criteria

1. THE Platform SHALL support Student registration via email and password, where the password SHALL be at least 8 characters and contain at least 1 letter and 1 number.
2. THE Platform SHALL support Student registration via Google OAuth.
3. WHEN a Student registers with email, THE Platform SHALL send a verification email containing a link that expires after 24 hours, and SHALL NOT activate the account until the link is clicked.
4. WHEN a Student submits a registration form, THE Platform SHALL validate that the email address matches the pattern `^[^@\s]+@[^@\s]+\.[^@\s]+$` and is unique across all existing accounts.
5. IF a Student provides an already-registered email address, THEN THE Platform SHALL return an error message indicating the email is already in use without revealing whether the account is a Student or Instructor account.
6. WHEN a Student logs in with valid credentials, THE Platform SHALL issue a signed JWT session token with a 7-day expiry.
7. IF a Student provides invalid credentials, THEN THE Platform SHALL increment the failed login counter for that account and return an error response without specifying whether the email or password was incorrect.
8. IF a Student accumulates 5 failed login attempts within a 15-minute window, THEN THE Platform SHALL lock the account for 30 minutes and display a message indicating the account is temporarily locked.
9. WHEN a Student requests a password reset, THE Platform SHALL send a password reset link valid for 30 minutes.

---

### Requirement 2: Instructor Registration and Authentication

**User Story:** As an Instructor, I want to register and submit my credentials for verification, so that I can list my services on the platform once approved.

#### Acceptance Criteria

1. THE Platform SHALL support Instructor registration via email and password.
2. WHEN an Instructor submits a registration form, THE Platform SHALL require the following fields: full name, email, phone number, years of experience, languages spoken, MTO certification number, and service areas (Toronto neighbourhoods/postal code prefixes).
3. WHEN an Instructor registers, THE Platform SHALL accept upload of the following verification documents: MTO instructor certificate, government-issued photo ID, and proof of insurance.
4. WHEN an Instructor registration is submitted, THE Platform SHALL set the Instructor account status to `pending_review`.
5. WHEN an Instructor registration is submitted, THE Platform SHALL notify the Admin of a pending application via email.
6. WHILE an Instructor account status is `pending_review`, THE Platform SHALL restrict the Instructor from creating Availability Slots or accepting Bookings.

---

### Requirement 3: Admin Instructor Approval Workflow

**User Story:** As an Admin, I want to review and approve or reject Instructor applications with supporting documents, so that only verified professionals can list on the platform.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL display a list of all Instructor applications with status `pending_review`, sorted by submission date ascending.
2. WHEN an Admin views an Instructor application, THE Admin Dashboard SHALL display all submitted profile fields and verification documents.
3. WHEN an Admin approves an Instructor application, THE Platform SHALL set the Instructor account status to `approved` and send the Instructor a confirmation email.
4. WHEN an Admin rejects an Instructor application, THE Platform SHALL require the Admin to provide a rejection reason, set the Instructor account status to `rejected`, and send the Instructor a notification email containing the rejection reason.
5. THE Admin Dashboard SHALL allow the Admin to filter Instructor applications by status: `pending_review`, `approved`, `rejected`, and `suspended`.
6. WHEN an Admin suspends an active Instructor account, THE Platform SHALL set the Instructor account status to `suspended`, cancel any future unconfirmed Bookings associated with that Instructor, and notify affected Students via email.

---

### Requirement 4: Instructor Subscription Management

**User Story:** As an Instructor, I want to subscribe to the platform for $20/month, so that I can access the booking management tools and appear in student searches.

#### Acceptance Criteria

1. WHEN an approved Instructor attempts to activate their listing, THE Platform SHALL redirect the Instructor to a Stripe-hosted checkout page for a $20 CAD/month recurring subscription.
2. WHEN a Stripe subscription payment succeeds, THE Platform SHALL set the Instructor listing status to `active` and record the subscription ID, current period start, and current period end.
3. WHEN a Stripe subscription payment fails, THE Platform SHALL set the Instructor listing status to `inactive` and send the Instructor a payment failure notification email.
4. WHILE an Instructor listing status is `inactive`, THE Platform SHALL hide the Instructor from Student search results.
5. WHEN an Instructor cancels their Stripe subscription, THE Platform SHALL retain the Instructor listing as `active` until the end of the current billing period, then set status to `inactive`.
6. THE Platform SHALL process all Stripe subscription webhook events within 30 seconds of receipt.
7. IF a Stripe webhook event is received with an unrecognised event type, THEN THE Platform SHALL log the event and return a 200 OK response to Stripe.

---

### Requirement 5: Instructor Profile Management

**User Story:** As an Instructor, I want to manage my public profile, so that Students can make an informed decision when choosing me.

#### Acceptance Criteria

1. THE Platform SHALL allow an active Instructor to update the following profile fields: profile photo, bio (max 500 characters), hourly rate (CAD), languages spoken, vehicle make and model, service areas, and years of experience.
2. WHEN an Instructor updates their profile, THE Platform SHALL persist the changes and reflect them in Student-facing search results within 60 seconds.
3. THE Platform SHALL display the Instructor's average Rating, total number of completed Bookings, and member-since date on the public profile page.
4. THE Platform SHALL display verified badges on Instructor profiles that have completed the Admin approval process.

---

### Requirement 6: Instructor Availability Management

**User Story:** As an Instructor, I want to upload and manage my availability, so that Students can only book me during times I am actually free.

#### Acceptance Criteria

1. THE Platform SHALL allow an active Instructor to create Availability Slots with a start datetime, end datetime, and recurrence pattern: `none`, `weekly`, or `biweekly`.
2. WHEN an Instructor creates a recurring Availability Slot, THE Platform SHALL generate individual slot instances up to 60 days in the future.
3. THE Platform SHALL allow an Instructor to delete a single Availability Slot instance without affecting other instances in the recurrence series.
4. THE Platform SHALL allow an Instructor to delete an entire recurrence series.
5. WHEN an Availability Slot is booked by a Student, THE Platform SHALL mark that slot as `reserved` and prevent other Students from booking the same slot.
6. WHEN a Booking is cancelled, THE Platform SHALL restore the associated Availability Slot status to `available`.
7. THE Platform SHALL prevent an Instructor from creating overlapping Availability Slots.

---

### Requirement 7: Student Search and Discovery

**User Story:** As a Student, I want to search for instructors by availability, language, location, rating, and price, so that I can find the best match for my needs.

#### Acceptance Criteria

1. THE Platform SHALL provide a search interface that accepts the following filters: desired lesson date and time range, preferred language(s), maximum hourly rate (CAD), minimum average Rating, and pickup location (latitude/longitude from a dropped pin).
2. WHEN a Student submits a search query, THE Platform SHALL return a list of active Instructors who have at least one Availability Slot within the requested date and time range.
3. THE Platform SHALL rank search results by proximity of the Instructor's service area to the Student's Pickup Pin by default.
4. THE Platform SHALL allow the Student to re-sort search results by average Rating (descending) or hourly rate (ascending or descending).
5. WHEN no Instructors match the search criteria, THE Platform SHALL display a message indicating no results were found and suggest broadening the search filters.
6. THE Platform SHALL display the following fields for each Instructor in search results: profile photo, first name, average Rating, total completed Bookings, hourly rate, languages spoken, and next available slot.

---

### Requirement 8: Pickup Pin and Location

**User Story:** As a Student, I want to drop a pickup pin on a map when booking a lesson, so that the Instructor knows exactly where to pick me up.

#### Acceptance Criteria

1. THE Platform SHALL display an interactive map during the booking flow that allows the Student to drop a Pickup Pin at any location within the Greater Toronto Area boundary.
2. WHEN a Student drops a Pickup Pin, THE Platform SHALL reverse-geocode the coordinates and display the resolved street address for confirmation.
3. THE Platform SHALL store the Pickup Pin latitude, longitude, and resolved address on the Booking record.
4. THE Platform SHALL display the Student's Pickup Pin location to the confirmed Instructor on the booking detail page.
5. IF a Student drops a Pickup Pin outside the Greater Toronto Area boundary, THEN THE Platform SHALL display an error message and prevent the Booking from proceeding.

---

### Requirement 9: Booking Creation and Confirmation

**User Story:** As a Student, I want to select an available time slot and book an Instructor, so that I can schedule my driving lesson without back-and-forth communication.

#### Acceptance Criteria

1. WHEN a Student selects an Instructor and an Availability Slot, THE Platform SHALL display a booking summary including Instructor name, date, time, duration, hourly rate, total cost, and Pickup Pin address before confirming.
2. WHEN a Student confirms a Booking, THE Platform SHALL create a Booking record with status `confirmed`, mark the Availability Slot as `reserved`, and send confirmation emails to both the Student and the Instructor.
3. THE Platform SHALL generate a unique, human-readable Booking reference code for every confirmed Booking (format: `DB-YYYYMMDD-XXXXX` where `X` is alphanumeric).
4. WHEN a Booking is created, THE Platform SHALL schedule a reminder notification 24 hours before the lesson start time.
5. WHEN a Booking is created, THE Platform SHALL schedule a reminder notification 2 hours before the lesson start time.
6. THE Platform SHALL send Booking reminders via email. WHERE the Student or Instructor has provided a mobile phone number, THE Platform SHALL also send reminders via SMS.

---

### Requirement 10: Booking Cancellation Policy

**User Story:** As a Student or Instructor, I want to cancel a Booking with appropriate notice, so that the other party has time to adjust their plans.

#### Acceptance Criteria

1. THE Platform SHALL allow a Student to cancel a confirmed Booking up to 24 hours before the lesson start time without penalty.
2. WHEN a Student cancels a Booking more than 24 hours before the lesson start time, THE Platform SHALL set the Booking status to `cancelled_by_student`, restore the Availability Slot to `available`, and notify the Instructor via email.
3. WHEN a Student attempts to cancel a Booking within 24 hours of the lesson start time, THE Platform SHALL display a late cancellation warning and require explicit confirmation before proceeding.
4. THE Platform SHALL allow an Instructor to cancel a confirmed Booking at any time.
5. WHEN an Instructor cancels a confirmed Booking, THE Platform SHALL set the Booking status to `cancelled_by_instructor`, restore the Availability Slot to `available`, notify the Student via email, and increment the Instructor's cancellation count.
6. THE Platform SHALL display the Instructor's lifetime cancellation count on their public profile.

---

### Requirement 11: Lesson Completion and Rating

**User Story:** As a Student, I want to rate my Instructor after a completed lesson, so that other Students can make informed choices.

#### Acceptance Criteria

1. WHEN the scheduled lesson end time passes for a Booking with status `confirmed`, THE Platform SHALL automatically set the Booking status to `completed` within 15 minutes.
2. WHEN a Booking status changes to `completed`, THE Platform SHALL send the Student a rating request email containing a direct link to the rating form.
3. THE Rating form SHALL require the Student to submit a score between 1 and 5 (integer), and optionally submit a Review text (max 300 characters).
4. WHEN a Student submits a Rating, THE Platform SHALL persist the Rating, update the Instructor's average Rating, and set the Booking review status to `reviewed`.
5. THE Platform SHALL prevent a Student from submitting more than one Rating per Booking.
6. THE Platform SHALL display all Reviews on the Instructor's public profile page, sorted by most recent first.
7. WHEN a new Rating is submitted, THE Platform SHALL recalculate the Instructor's average Rating using all historical Ratings for that Instructor. THE Platform SHALL recalculate the average as `SUM(all ratings) / COUNT(all ratings)` and persist the updated value atomically.

---

### Requirement 12: Dispute Management

**User Story:** As a Student or Instructor, I want to raise a dispute about a Booking, so that a DriveBook Admin can review and resolve it fairly.

#### Acceptance Criteria

1. THE Platform SHALL allow a Student or Instructor to submit a Dispute for any Booking with status `confirmed` or `completed`.
2. THE Dispute submission form SHALL require the submitter to provide a category (options: `no_show`, `unsafe_behaviour`, `payment_issue`, `other`) and a description (max 1000 characters).
3. WHEN a Dispute is submitted, THE Platform SHALL set the Dispute status to `open` and notify the Admin via email.
4. THE Admin Dashboard SHALL display all open Disputes, sorted by submission date ascending, with Booking reference, submitter role, category, and description.
5. WHEN an Admin resolves a Dispute, THE Platform SHALL require the Admin to provide a resolution note, set the Dispute status to `resolved`, and notify both the Student and Instructor via email containing the resolution note.
6. WHEN an Admin marks a Dispute as `escalated`, THE Platform SHALL flag the associated Instructor account for review.

---

### Requirement 13: Student Booking History

**User Story:** As a Student, I want to view my past and upcoming bookings, so that I can track my lessons and review my history.

#### Acceptance Criteria

1. THE Platform SHALL provide a Student dashboard that displays all Bookings associated with the logged-in Student.
2. THE Student dashboard SHALL separate Bookings into two tabs: `Upcoming` (status: `confirmed`) and `Past` (status: `completed`, `cancelled_by_student`, or `cancelled_by_instructor`).
3. WHEN a Student selects a Booking from the dashboard, THE Platform SHALL display the full Booking detail including Instructor name and profile link, date, time, duration, Pickup Pin address, Booking reference, and status.

---

### Requirement 14: Instructor Booking Management

**User Story:** As an Instructor, I want to view and manage my upcoming and past bookings, so that I can run my schedule efficiently.

#### Acceptance Criteria

1. THE Platform SHALL provide an Instructor dashboard that displays all Bookings associated with the logged-in Instructor.
2. THE Instructor dashboard SHALL display upcoming Bookings in chronological order with Student first name, Pickup Pin address, date, time, and Booking reference.
3. THE Instructor dashboard SHALL display a summary of total completed Bookings, total earnings this month (CAD), and current average Rating.
4. WHEN an Instructor views a confirmed Booking detail, THE Platform SHALL display the Student's Pickup Pin on an embedded map.

---

### Requirement 15: Notifications and Reminders

**User Story:** As a Student or Instructor, I want to receive timely notifications about my bookings, so that I never miss a lesson.

#### Acceptance Criteria

1. THE Platform SHALL send transactional email notifications for the following events: account registration, Booking confirmation (Student and Instructor), Booking cancellation (Student and Instructor), lesson reminder at 24 hours prior, lesson reminder at 2 hours prior, post-lesson rating request (Student), Dispute submission confirmation, and Dispute resolution.
2. WHERE a user has provided a verified mobile phone number, THE Platform SHALL send SMS notifications for: Booking confirmation, Booking cancellation, and lesson reminders (24 hours and 2 hours prior).
3. THE Platform SHALL deliver all transactional emails within 60 seconds of the triggering event.
4. IF a transactional email delivery fails, THEN THE Platform SHALL retry delivery up to 3 times with exponential backoff before logging the failure.

---

### Requirement 16: Admin Dashboard

**User Story:** As an Admin, I want a centralised dashboard to manage instructors, disputes, and platform health, so that I can operate the platform efficiently.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL be accessible only to users with the `admin` role.
2. IF a non-admin user attempts to access the Admin Dashboard, THEN THE Platform SHALL return a 403 Forbidden response.
3. THE Admin Dashboard SHALL display platform health metrics: total registered Students, total registered Instructors by status, total Bookings this month, total active Subscriptions, and total open Disputes.
4. THE Admin Dashboard SHALL allow an Admin to search for any Student or Instructor account by email address.
5. THE Admin Dashboard SHALL allow an Admin to manually set an Instructor account status to `suspended` with a required reason field.

---

## Service Architecture

DriveBook uses a **monorepo, microservices-lite** architecture. Each service is a focused Node/TypeScript module with a clear domain boundary. All services communicate over HTTP REST. The frontend is a Next.js app deployed on Vercel. Backend services are independently deployable to Vercel Serverless Functions or a Node host.

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (Vercel)               │
│         students · instructors · admin · booking flow       │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST/JSON
          ┌─────────────────┼──────────────────┐
          │                 │                  │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │  Auth       │   │  Instructor │   │  Booking    │
   │  Service    │   │  Service    │   │  Service    │
   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
          │                 │                  │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │  Notification│  │  Search     │   │  Payment    │
   │  Service    │   │  Service    │   │  Service    │
   └──────┬──────┘   └─────────────┘   └──────┬──────┘
          │                                    │
   ┌──────▼──────┐                     ┌──────▼──────┐
   │  Supabase   │                     │   Stripe    │
   │  (DB + Auth)│                     │   (Billing) │
   └─────────────┘                     └─────────────┘
```

### Services Summary

| Service | Responsibility |
|---|---|
| **auth-service** | JWT issuance, session management, Supabase Auth integration |
| **instructor-service** | Instructor profiles, document uploads, availability slots, admin approval |
| **booking-service** | Booking lifecycle, cancellation, completion, rating |
| **search-service** | Instructor search, filtering, ranking by location/rating/price |
| **payment-service** | Stripe subscription webhook handling, billing status |
| **notification-service** | Transactional email (SendGrid/Resend) and SMS (Twilio) |
| **admin-service** | Admin dashboard data, instructor approval actions, dispute resolution |

---

## Folder Structure

```
drivebook/
├── apps/
│   └── web/                          # Next.js frontend
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   └── register/
│       │   ├── (student)/
│       │   │   ├── search/
│       │   │   ├── booking/
│       │   │   └── dashboard/
│       │   ├── (instructor)/
│       │   │   ├── profile/
│       │   │   ├── availability/
│       │   │   └── dashboard/
│       │   └── (admin)/
│       │       ├── instructors/
│       │       ├── disputes/
│       │       └── dashboard/
│       ├── components/
│       │   ├── ui/                   # Shared UI primitives (shadcn/ui)
│       │   ├── map/                  # Map and pin components
│       │   ├── booking/              # Booking flow components
│       │   └── instructor/           # Instructor card, profile
│       ├── lib/
│       │   ├── api.ts                # Typed API client
│       │   ├── auth.ts               # Auth helpers
│       │   └── utils.ts
│       └── public/
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   ├── middleware/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── instructor-service/
│   │   └── src/
│   │       ├── handlers/
│   │       ├── availability/
│   │       └── index.ts
│   ├── booking-service/
│   │   └── src/
│   │       ├── handlers/
│   │       ├── scheduler/            # Reminder job scheduling
│   │       └── index.ts
│   ├── search-service/
│   │   └── src/
│   │       ├── handlers/
│   │       ├── filters/
│   │       └── index.ts
│   ├── payment-service/
│   │   └── src/
│   │       ├── handlers/
│   │       ├── webhooks/
│   │       └── index.ts
│   ├── notification-service/
│   │   └── src/
│   │       ├── email/
│   │       ├── sms/
│   │       └── index.ts
│   └── admin-service/
│       └── src/
│           ├── handlers/
│           └── index.ts
├── packages/
│   ├── types/                        # Shared TypeScript types and interfaces
│   │   └── src/
│   │       ├── booking.ts
│   │       ├── instructor.ts
│   │       ├── user.ts
│   │       └── index.ts
│   ├── db/                           # Supabase client, migrations, seed data
│   │   ├── migrations/
│   │   ├── seed/
│   │   └── src/
│   │       └── client.ts
│   └── config/                       # Shared env config helpers
│       └── src/
│           └── env.ts
├── infra/                            # Infrastructure as code (optional: Terraform/Pulumi)
├── docs/                             # ADRs, API reference, onboarding
├── .kiro/
│   └── specs/
│       └── drivebook-marketplace/
│           ├── requirements.md       # This document
│           ├── design.md             # (Next phase)
│           └── tasks.md              # (Next phase)
├── turbo.json                        # Turborepo config
├── package.json                      # Root workspace
└── README.md
```

---

## Database Model

All tables are hosted on Supabase (PostgreSQL). Row-Level Security (RLS) is enforced at the database layer.

### users
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           TEXT UNIQUE NOT NULL
role            TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin'))
full_name       TEXT NOT NULL
phone           TEXT
avatar_url      TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### instructor_profiles
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
status              TEXT NOT NULL DEFAULT 'pending_review'
                    CHECK (status IN ('pending_review','approved','rejected','suspended'))
listing_status      TEXT NOT NULL DEFAULT 'inactive'
                    CHECK (listing_status IN ('active','inactive'))
bio                 TEXT CHECK (char_length(bio) <= 500)
hourly_rate_cad     NUMERIC(8,2) NOT NULL
years_experience    INT NOT NULL
languages           TEXT[] NOT NULL
vehicle_make        TEXT
vehicle_model       TEXT
service_areas       TEXT[]
mto_cert_number     TEXT NOT NULL
mto_cert_url        TEXT
gov_id_url          TEXT
insurance_url       TEXT
avg_rating          NUMERIC(3,2) DEFAULT 0
total_bookings      INT DEFAULT 0
cancellation_count  INT DEFAULT 0
stripe_customer_id  TEXT
stripe_sub_id       TEXT
stripe_sub_status   TEXT
sub_period_start    TIMESTAMPTZ
sub_period_end      TIMESTAMPTZ
admin_notes         TEXT
rejected_reason     TEXT
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### availability_slots
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
instructor_id   UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE
start_time      TIMESTAMPTZ NOT NULL
end_time        TIMESTAMPTZ NOT NULL
status          TEXT NOT NULL DEFAULT 'available'
                CHECK (status IN ('available','reserved'))
recurrence      TEXT NOT NULL DEFAULT 'none'
                CHECK (recurrence IN ('none','weekly','biweekly'))
series_id       UUID
created_at      TIMESTAMPTZ DEFAULT now()
CONSTRAINT no_overlap EXCLUDE USING gist (
  instructor_id WITH =,
  tstzrange(start_time, end_time) WITH &&
)
```

### bookings
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
reference_code  TEXT UNIQUE NOT NULL
student_id      UUID NOT NULL REFERENCES users(id)
instructor_id   UUID NOT NULL REFERENCES instructor_profiles(id)
slot_id         UUID NOT NULL REFERENCES availability_slots(id)
status          TEXT NOT NULL DEFAULT 'confirmed'
                CHECK (status IN (
                  'confirmed',
                  'completed',
                  'cancelled_by_student',
                  'cancelled_by_instructor'
                ))
pickup_lat      NUMERIC(10,7) NOT NULL
pickup_lng      NUMERIC(10,7) NOT NULL
pickup_address  TEXT NOT NULL
lesson_date     DATE NOT NULL
start_time      TIMESTAMPTZ NOT NULL
end_time        TIMESTAMPTZ NOT NULL
hourly_rate_cad NUMERIC(8,2) NOT NULL
review_status   TEXT NOT NULL DEFAULT 'pending'
                CHECK (review_status IN ('pending','reviewed','skipped'))
cancelled_at    TIMESTAMPTZ
cancel_reason   TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### ratings
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      UUID UNIQUE NOT NULL REFERENCES bookings(id)
student_id      UUID NOT NULL REFERENCES users(id)
instructor_id   UUID NOT NULL REFERENCES instructor_profiles(id)
score           INT NOT NULL CHECK (score BETWEEN 1 AND 5)
review_text     TEXT CHECK (char_length(review_text) <= 300)
created_at      TIMESTAMPTZ DEFAULT now()
```

### disputes
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      UUID NOT NULL REFERENCES bookings(id)
submitted_by    UUID NOT NULL REFERENCES users(id)
submitter_role  TEXT NOT NULL CHECK (submitter_role IN ('student','instructor'))
category        TEXT NOT NULL CHECK (category IN (
                  'no_show','unsafe_behaviour','payment_issue','other'
                ))
description     TEXT NOT NULL CHECK (char_length(description) <= 1000)
status          TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','resolved','escalated'))
resolution_note TEXT
resolved_by     UUID REFERENCES users(id)
resolved_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

### notifications_log
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id)
channel         TEXT NOT NULL CHECK (channel IN ('email','sms'))
event_type      TEXT NOT NULL
status          TEXT NOT NULL CHECK (status IN ('sent','failed','retrying'))
attempts        INT NOT NULL DEFAULT 1
booking_id      UUID REFERENCES bookings(id)
sent_at         TIMESTAMPTZ
failed_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

---

## API Contracts

All endpoints return `application/json`. Authentication uses `Authorization: Bearer <token>` unless noted. All timestamps are ISO 8601 UTC.

---

### Auth Service — `POST /auth/register`

**Request:**
```json
{
  "email": "alex@example.com",
  "password": "••••••••",
  "full_name": "Alex Chen",
  "role": "student",
  "phone": "+14165550100"
}
```

**Response `201`:**
```json
{
  "user_id": "uuid",
  "email": "alex@example.com",
  "role": "student",
  "message": "Verification email sent."
}
```

**Error `409`:** Email already registered.

---

### Auth Service — `POST /auth/login`

**Request:**
```json
{ "email": "alex@example.com", "password": "••••••••" }
```

**Response `200`:**
```json
{
  "access_token": "jwt",
  "expires_in": 604800,
  "user": { "id": "uuid", "email": "...", "role": "student", "full_name": "Alex Chen" }
}
```

**Error `401`:** Invalid credentials.

---

### Instructor Service — `POST /instructors/profile`

Authenticated Instructor only.

**Request:**
```json
{
  "bio": "8 years teaching in North York and Scarborough...",
  "hourly_rate_cad": 60.00,
  "years_experience": 8,
  "languages": ["English", "Cantonese"],
  "vehicle_make": "Toyota",
  "vehicle_model": "Corolla",
  "service_areas": ["M1", "M2", "M3", "M4"],
  "mto_cert_number": "MTO-123456"
}
```

**Response `201`:**
```json
{ "profile_id": "uuid", "status": "pending_review" }
```

---

### Instructor Service — `GET /instructors/:id`

Public endpoint.

**Response `200`:**
```json
{
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
  "member_since": "2024-01-15"
}
```

---

### Instructor Service — `POST /instructors/:id/availability`

Authenticated Instructor only.

**Request:**
```json
{
  "start_time": "2025-08-09T09:00:00Z",
  "end_time": "2025-08-09T11:00:00Z",
  "recurrence": "weekly"
}
```

**Response `201`:**
```json
{
  "series_id": "uuid",
  "slots_created": 9,
  "message": "Availability created for 9 weeks."
}
```

**Error `409`:** Overlapping slot exists.

---

### Search Service — `GET /search/instructors`

Public endpoint.

**Query params:** `date_from`, `date_to`, `languages`, `max_rate`, `min_rating`, `lat`, `lng`, `sort_by` (`distance` | `rating` | `price_asc` | `price_desc`), `page`, `per_page`

**Response `200`:**
```json
{
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
}
```

---

### Booking Service — `POST /bookings`

Authenticated Student only.

**Request:**
```json
{
  "slot_id": "uuid",
  "pickup_lat": 43.7731,
  "pickup_lng": -79.3421,
  "pickup_address": "2750 Eglinton Ave E, Toronto, ON"
}
```

**Response `201`:**
```json
{
  "booking_id": "uuid",
  "reference_code": "DB-20250809-A4K2P",
  "status": "confirmed",
  "start_time": "2025-08-09T09:00:00Z",
  "end_time": "2025-08-09T11:00:00Z",
  "instructor": { "id": "uuid", "full_name": "Michael R." },
  "pickup_address": "2750 Eglinton Ave E, Toronto, ON",
  "hourly_rate_cad": 60.00
}
```

**Error `409`:** Slot already reserved.

---

### Booking Service — `PATCH /bookings/:id/cancel`

Authenticated Student or Instructor.

**Request:**
```json
{ "reason": "Schedule conflict" }
```

**Response `200`:**
```json
{
  "booking_id": "uuid",
  "status": "cancelled_by_student",
  "cancelled_at": "2025-08-08T14:30:00Z"
}
```

---

### Booking Service — `POST /bookings/:id/rating`

Authenticated Student only. Booking must have status `completed`.

**Request:**
```json
{
  "score": 5,
  "review_text": "Michael was calm, professional, and knew every street in Scarborough."
}
```

**Response `201`:**
```json
{
  "rating_id": "uuid",
  "score": 5,
  "instructor_new_avg": 4.82
}
```

---

### Payment Service — `POST /webhooks/stripe`

Stripe webhook endpoint (unauthenticated, verified by Stripe signature header).

**Handled events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Response `200`:** Always returns 200 on receipt.

---

### Admin Service — `GET /admin/instructors`

Admin only.

**Query params:** `status` (`pending_review` | `approved` | `rejected` | `suspended`), `page`, `per_page`

**Response `200`:**
```json
{
  "instructors": [
    {
      "id": "uuid",
      "full_name": "Michael R.",
      "email": "michael@example.com",
      "status": "pending_review",
      "submitted_at": "2025-08-01T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

### Admin Service — `PATCH /admin/instructors/:id/approve`

Admin only.

**Response `200`:**
```json
{ "instructor_id": "uuid", "status": "approved" }
```

---

### Admin Service — `PATCH /admin/instructors/:id/reject`

Admin only.

**Request:**
```json
{ "reason": "MTO certificate could not be verified." }
```

**Response `200`:**
```json
{ "instructor_id": "uuid", "status": "rejected" }
```

---

### Admin Service — `GET /admin/disputes`

Admin only.

**Query params:** `status` (`open` | `resolved` | `escalated`), `page`, `per_page`

**Response `200`:**
```json
{
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
}
```

---

### Admin Service — `PATCH /admin/disputes/:id/resolve`

Admin only.

**Request:**
```json
{ "resolution_note": "Instructor confirmed cancellation with less than 1 hour notice. Student was notified." }
```

**Response `200`:**
```json
{ "dispute_id": "uuid", "status": "resolved" }
```

---

## Build Phases

### Phase 1 — Foundation (Weeks 1–2)

Goal: Repo scaffolding, auth, and database.

- Initialise monorepo with Turborepo and pnpm workspaces
- Configure Supabase project, run initial migrations, enable RLS
- Implement `auth-service`: registration, login, JWT, email verification, password reset
- Implement shared `packages/types` and `packages/db`
- Basic Next.js app shell with Supabase Auth client
- CI/CD pipeline: GitHub Actions → Vercel preview deployments

**Milestone:** Student and Instructor can register and log in.

---

### Phase 2 — Instructor Onboarding and Admin (Weeks 3–4)

Goal: Instructor profile creation and admin approval loop.

- Implement `instructor-service`: profile CRUD, document upload to Supabase Storage
- Implement `admin-service`: pending queue, approve/reject actions
- Admin dashboard: instructor list, document viewer, approve/reject UI
- Email notifications for approval/rejection (Notification service skeleton)

**Milestone:** Admin can approve or reject an Instructor from the dashboard.

---

### Phase 3 — Availability and Search (Weeks 5–6)

Goal: Instructors set availability; Students can find them.

- Implement availability slot management in `instructor-service`
- Implement `search-service`: filter and rank by location, language, rating, price
- Integrate map (Mapbox GL JS or Google Maps JS API) into search UI
- Pickup pin component with reverse geocoding

**Milestone:** Student can search, find, and view an Instructor's available slots.

---

### Phase 4 — Booking Flow (Weeks 7–8)

Goal: End-to-end booking creation, confirmation, and cancellation.

- Implement `booking-service`: create, confirm, cancel
- Booking reference code generation
- Full notification integration: confirmation emails, cancellation emails
- Student and Instructor dashboards: upcoming and past bookings

**Milestone:** Student can book a lesson; both parties receive confirmation.

---

### Phase 5 — Payments and Subscriptions (Weeks 9–10)

Goal: Instructor subscription billing via Stripe.

- Implement `payment-service`: Stripe customer creation, subscription checkout, webhook handler
- Stripe subscription status reflected in Instructor listing status
- Billing portal link for Instructors to manage their subscription

**Milestone:** Instructor can subscribe for $20/month and be activated on the platform.

---

### Phase 6 — Reminders, Ratings, and Disputes (Weeks 11–12)

Goal: Post-lesson flow, ratings, and dispute management.

- Reminder scheduler: 24h and 2h notifications via email and SMS (Twilio)
- Automatic lesson completion trigger (15-minute post-lesson job)
- Rating form and rating submission endpoint
- Average rating recalculation and display
- Dispute submission form and Admin dispute resolution UI

**Milestone:** Full booking lifecycle is complete, including ratings and disputes.

---

### Phase 7 — QA, Polish, and Launch Prep (Weeks 13–14)

Goal: Production-ready quality and launch readiness.

- End-to-end testing with Playwright (key user journeys)
- Unit tests for all service handlers
- Performance review and query optimisation
- Accessibility audit (WCAG 2.1 AA)
- Security review: input validation, rate limiting, RLS policy audit
- README, onboarding docs, and environment setup guide
- Production deployment to Vercel + Supabase production project

**Milestone:** DriveBook MVP is live at drivebook.ca.

---

## Agent Instructions for Codex

These instructions guide an AI coding agent (e.g., GitHub Copilot, Cursor, Codex) working on the DriveBook codebase.

### Project Context

You are building DriveBook — a two-sided marketplace for driving lessons in Toronto. The project uses a TypeScript monorepo with Next.js on the frontend and Node/TypeScript microservices-lite on the backend. The database is Supabase (PostgreSQL). Payments use Stripe. The repo is structured with Turborepo.

### General Rules

1. **TypeScript strict mode** is enabled everywhere. Do not use `any`. Use explicit types and interfaces from `packages/types`.
2. All database access goes through the Supabase client in `packages/db/src/client.ts`. Never use raw SQL strings outside of migrations.
3. All environment variables are read through `packages/config/src/env.ts`. Never access `process.env` directly in service code.
4. All API responses follow the standard shape: `{ data: T | null, error: string | null }`.
5. Validate all incoming request bodies using `zod` before processing. Return `400` with a descriptive error for validation failures.
6. Never hardcode secret values. Reference secrets by their env variable names only.
7. Write a unit test for every new handler function. Place tests in `__tests__` directories co-located with the source file.
8. After every code change, check for TypeScript compilation errors with `tsc --noEmit`.

### Service-Specific Guidelines

**auth-service:**
- Use Supabase Auth for all identity operations. Do not implement custom password hashing.
- JWT verification middleware should be shared and importable from `services/auth-service/src/middleware/auth.ts`.

**instructor-service:**
- File uploads (MTO cert, ID, insurance) go to Supabase Storage, bucket `instructor-docs`, with path `{instructor_id}/{document_type}/{filename}`.
- Availability slot overlap prevention is enforced at the database level via the `EXCLUDE` constraint. The service must catch constraint violation errors (code `23P01`) and return `409`.

**booking-service:**
- Reference code generation format: `DB-YYYYMMDD-XXXXX` where `X` is a random alphanumeric character (uppercase). Use `crypto.randomBytes` — do not use `Math.random`.
- Reminder scheduling uses a job queue (BullMQ with Redis, or Supabase Edge Functions with `pg_cron`). Document the chosen approach in `docs/scheduler.md`.
- Lesson completion is triggered by a scheduled job that runs every 15 minutes and updates Bookings where `end_time < now()` and `status = 'confirmed'`.

**search-service:**
- Location proximity is calculated using the Haversine formula against the centre coordinates of each Instructor's service areas. Store service area centroid lat/lng in `instructor_profiles`.
- Cache search results for 60 seconds using Redis or Supabase's in-memory cache to reduce database load.

**payment-service:**
- Always verify Stripe webhook signatures using the `STRIPE_WEBHOOK_SECRET` environment variable before processing any event.
- Idempotency: check if a webhook event ID has already been processed before acting on it. Store processed event IDs in a `stripe_events` table.

**notification-service:**
- Email provider: use Resend (preferred) or SendGrid. Abstract the provider behind a `sendEmail(to, subject, html)` interface so it can be swapped.
- SMS provider: Twilio. Only send SMS if the user record has a verified `phone` field.
- All notification sends are logged to the `notifications_log` table.

**admin-service:**
- All routes require the `admin` role. Check the JWT `role` claim and return `403` if not `admin`.
- Admin actions (approve, reject, suspend) must be logged with `admin_user_id`, `action`, `target_id`, and `timestamp` to an `admin_audit_log` table.

### Frontend Guidelines

- Use `shadcn/ui` as the component library base.
- Map integration: use Mapbox GL JS. The Mapbox access token is read from `NEXT_PUBLIC_MAPBOX_TOKEN`.
- Use React Query (`@tanstack/react-query`) for all data fetching and caching.
- Use `react-hook-form` with `zod` resolvers for all forms.
- All pages must be mobile-responsive. Use Tailwind CSS breakpoints. Mobile-first approach.
- Use Next.js App Router. Server Components for data-heavy pages, Client Components only where interactivity is required.
- Authentication state is managed via Supabase Auth helpers for Next.js (`@supabase/ssr`).

### Coding Standards

- Functions should be small and single-purpose (max 40 lines as a guideline).
- Prefer `async/await` over raw Promises.
- Use named exports. Avoid default exports except for Next.js page components.
- Comment non-obvious logic with inline comments. Document public functions with JSDoc.
- Follow the existing folder structure in `services/` and `apps/web/`. Do not reorganise structure without discussion.
- Before adding a new npm package, check if the functionality is already available in an existing dependency.

---

*Document version 1.0 — DriveBook MVP*  
*Last updated: 2025*

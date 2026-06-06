# DriveBook — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Active  
**Last updated:** June 2026

---

## 1. Product Overview

DriveBook is a Toronto-based two-sided marketplace that connects students preparing for Ontario G2 and G road tests with verified, professional driving instructors.

Students find trusted instructors by availability, language, pickup location, and rating — then book and pay in minutes. Instructors get a steady pipeline of students, automated scheduling, and a subscription-based tool that replaces their patchwork of Facebook ads, Kijiji posts, and WhatsApp messages.

---

## 2. Problem Statement

### Student Problems
- Failed or preparing for G2 / G road test with no trusted source for instructors
- Facebook, Kijiji, and WeChat listings lack accountability and verification
- Scheduling is painful — instructors cancel, don't reply, or don't fit the student's schedule
- Students want language options (Mandarin, Hindi, Cantonese, etc.) but have no way to filter
- Students want pickup at a specific location and cannot coordinate it easily
- No online payment — cash only, no receipts

### Instructor Problems
- Hard to find students consistently
- Full reliance on ads, word of mouth, and manual platforms
- No-shows and last-minute cancellations with no accountability
- Manual scheduling via WhatsApp eats 2–3 hours per week
- Constant re-posting on Kijiji every 30 days
- No professional online profile or reputation system

---

## 3. Solution

- Students book driving lessons on demand through a clean, mobile-first web app
- Students choose instructors by availability, rating, language, location, and price
- Students drop a pickup pin on a map so instructors know exactly where to pick them up
- Instructors upload weekly, bi-weekly, or monthly availability
- Platform handles reminders, payments, cancellations, accountability, and ratings
- Admin approves instructors (MTO cert + ID verification) and manages disputes

---

## 4. Business Model

| Role | Cost | Value |
|---|---|---|
| Students | Free | Find trusted, verified instructors on demand |
| Instructors | $20 CAD/month subscription | Steady student pipeline, automated scheduling, professional profile |
| Platform (Phase 2) | Booking commission (TBD) | Revenue share on each completed lesson |

---

## 5. User Personas

### Persona 1 — The Road Test Repeater (Student)

**Name:** Alex, 23  
**Location:** Scarborough, Toronto  
**Situation:** Failed the G2 road test once. Works part-time. Speaks English and Mandarin.  
**Goals:** Find a Mandarin-speaking instructor near Scarborough, available Saturday afternoons, at a fair hourly rate.  
**Frustrations:** No-shows, last-minute cancellations, cash-only payments, no way to verify credentials.

### Persona 2 — The New Arrival (Student)

**Name:** Priya, 28  
**Location:** Toronto (uses transit)  
**Situation:** Recently moved from India. Has an international licence. Needs the G road test.  
**Goals:** Book lessons in advance with a Hindi-speaking instructor who will pick her up at a specific subway station. Pay online safely.  
**Frustrations:** Language barrier, cash-only payments, no accountability when instructors cancel.

### Persona 3 — The Independent Instructor

**Name:** Michael, 41  
**Location:** North York, Toronto  
**Situation:** MTO-certified, 8 years experience, posts on Kijiji and relies on referrals.  
**Goals:** Fill calendar consistently, stop managing bookings manually, get paid reliably, build an online reputation.  
**Frustrations:** Student no-shows, manually chasing payments, rebuilding Kijiji listings every 30 days, no professional profile.

### Persona 4 — The DriveBook Admin

**Name:** Internal staff member  
**Goals:** Quickly approve or reject instructor applications with supporting documents. Resolve student–instructor disputes. Monitor platform health.  
**Frustrations:** No central tool for disputes, no audit trail for approvals.

---

## 6. MVP Scope

### In Scope (Build Now)

- Student and Instructor registration and authentication (email + Google OAuth via Supabase)
- Instructor profile creation, document upload (MTO cert, photo ID, insurance), and admin approval workflow
- Instructor subscription via Stripe ($20 CAD/month)
- Availability management (weekly, bi-weekly, or one-off slots up to 60 days ahead)
- Student search and filter (location, language, rating, price, availability)
- Pickup pin drop on a Mapbox map with reverse geocoding
- Booking creation, confirmation, and cancellation
- Automated email and SMS reminders (24h and 2h before lesson)
- Post-lesson ratings (1–5) and text reviews
- Dispute submission and admin resolution
- Admin dashboard (instructor approval, dispute management, subscription status)
- Responsive web app (Next.js, mobile-first)

### Out of Scope for MVP

| Feature | Why deferred |
|---|---|
| Mobile native apps (iOS/Android) | MVP is web-first; responsive design covers mobile |
| In-app messaging/chat | Email communication is sufficient for MVP |
| Booking commission fees | Subscription-only model at launch; commission in Phase 2 |
| Multi-city expansion | Toronto-only for MVP |
| Lesson packages or bundles | Single-session booking only at launch |
| Video verification calls | Admin document review is sufficient |
| Referral or loyalty programs | Post-launch growth feature |
| Location Service (dedicated) | Handled client-side in MVP; Phase 2 service |

---

## 7. Key Requirements Summary

| # | Requirement | Priority |
|---|---|---|
| 1 | Student registration and authentication | P0 |
| 2 | Instructor registration and authentication | P0 |
| 3 | Admin instructor approval workflow | P0 |
| 4 | Instructor subscription management (Stripe) | P0 |
| 5 | Instructor profile management | P0 |
| 6 | Instructor availability management | P0 |
| 7 | Student search and discovery | P0 |
| 8 | Pickup pin and location | P0 |
| 9 | Booking creation and confirmation | P0 |
| 10 | Booking cancellation policy | P0 |
| 11 | Lesson completion and rating | P1 |
| 12 | Dispute management | P1 |
| 13 | Student booking history dashboard | P1 |
| 14 | Instructor booking management dashboard | P1 |
| 15 | Notifications and reminders | P1 |
| 16 | Admin dashboard | P1 |

Full acceptance criteria for each requirement are in `.kiro/specs/drivebook-marketplace/requirements.md`.

---

## 8. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 App Router | SEO, Server Components, Vercel deployment |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, accessible |
| Maps | Mapbox GL JS | Fine-grained control, generous free tier |
| Forms | react-hook-form + Zod | Type-safe validation |
| Data fetching | React Query (@tanstack/react-query) | Caching, loading states |
| Backend | Node.js + TypeScript (microservices-lite) | Type safety, junior-friendly |
| Database | Supabase (PostgreSQL) | RLS, Auth, Storage, Realtime — one platform |
| Auth | Supabase Auth (GoTrue) | JWT, OAuth, email verification built-in |
| Payments | Stripe Subscriptions | PCI off-platform, webhooks, billing portal |
| Email | Resend | TypeScript SDK, great DX |
| SMS | Twilio | Reliable Canadian delivery |
| Monorepo | Turborepo + pnpm workspaces | Shared types/config, fast builds |
| Deployment | Vercel | Frontend + serverless functions |
| CI/CD | GitHub Actions | Preview deployments on every PR |

---

## 9. Build Phases

### Phase 1 — Foundation (Weeks 1–2)
Repo scaffolding, auth, database setup, CI/CD.  
**Milestone:** Student and Instructor can register and log in.

### Phase 2 — Instructor Onboarding and Admin (Weeks 3–4)
Instructor profiles, document uploads, admin approval workflow.  
**Milestone:** Admin can approve or reject an Instructor from the dashboard.

### Phase 3 — Availability and Search (Weeks 5–6)
Availability slot management, search service, map integration.  
**Milestone:** Student can search, find, and view an Instructor's available slots.

### Phase 4 — Booking Flow (Weeks 7–8)
End-to-end booking creation, confirmation, and cancellation.  
**Milestone:** Student can book a lesson; both parties receive confirmation.

### Phase 5 — Payments and Subscriptions (Weeks 9–10)
Stripe subscription checkout, webhook handler, billing portal.  
**Milestone:** Instructor can subscribe for $20/month and be activated on the platform.

### Phase 6 — Reminders, Ratings, and Disputes (Weeks 11–12)
Reminder scheduling, auto-completion, rating form, dispute management.  
**Milestone:** Full booking lifecycle complete including ratings and disputes.

### Phase 7 — QA, Polish, and Launch Prep (Weeks 13–14)
E2E tests, accessibility audit, security review, production deployment.  
**Milestone:** DriveBook MVP is live at drivebook.ca.

---

## 10. Glossary

| Term | Definition |
|---|---|
| **Student** | A registered user who books driving lessons |
| **Instructor** | A verified driving professional who lists availability and accepts bookings |
| **Admin** | A DriveBook staff member who approves instructors and manages disputes |
| **Booking** | A confirmed lesson session between a Student and an Instructor |
| **Availability Slot** | A time window an Instructor uploads indicating they are free |
| **Pickup Pin** | A geographic coordinate dropped by a Student to indicate their pickup location |
| **Subscription** | A recurring $20 CAD/month payment made by an Instructor |
| **Rating** | A 1–5 star score submitted by a Student after a completed lesson |
| **Review** | An optional text comment submitted alongside a Rating |
| **Dispute** | A formal complaint raised by a Student or Instructor about a Booking |
| **MVP** | Minimum Viable Product — the initial production-ready release |
| **MTO** | Ministry of Transportation Ontario — issues driving instructor certifications |
| **GTA** | Greater Toronto Area — the geographic boundary of the MVP |

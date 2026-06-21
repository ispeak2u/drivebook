# DriveBook via Claude

**A complete strategic and technical plan for building DriveBook as an enterprise mobile application using Claude Chat and Claude Code.**

---

**Prepared for:** Don (Paul Alfred) and Brother David
**Market:** Toronto, Ontario
**Document version:** 1.0
**Date:** June 2026

---

## Table of contents

1. Executive summary
2. Review of existing DriveBook documentation
3. Top recommendations to action before any code is written
4. The mobile-native pivot — what it means
5. Competitor mobile app research arsenal
6. What to study (and what to ignore)
7. The 11-phase step-by-step build plan
8. Three immediate next actions
9. Appendix A — Why React Native + Expo
10. Appendix B — Quick-reference checklists

---

## 1. Executive summary

DriveBook is a Toronto-based two-sided marketplace connecting students preparing for Ontario G2 and G road tests with verified, professional driving instructors. After reviewing all 15 existing strategy and technical documents, the foundation is strong — the technical architecture is production-grade, the go-to-market strategy is well-sequenced, and the competitive research on Kruzee shows real product discipline.

However, three critical issues must be resolved before a single line of code is written:

- **The revenue model conflicts across three documents.** The PRD says $20/month subscription. The financial model says 10% commission. The pricing strategy says free + 10% commission. These must be reconciled.
- **The cancellation policy has an error code but no actual rule.** Stripe integration cannot be built without it.
- **Booking request timeout logic is undefined.** Students will be stranded and slots will be locked forever without it.

The decision now is to pivot from a web-first MVP to an enterprise mobile-native application built with React Native + Expo, using Claude Chat for strategy and Claude Code for implementation. This document lays out the complete plan to make that happen in approximately 16-18 weeks.

The recommended path forward: launch with a free instructor sign-up and 10% commission model, introduce the $20/month Pro plan with reduced 5% commission in Phase 2, and use the existing TypeScript microservices backend as the foundation for both the mobile app and a responsive web surface for admin and marketing.

---

## 2. Review of existing DriveBook documentation

Fifteen files were reviewed across two categories: technical documentation and business documentation.

### 2.1 Scores at a glance

**Technical documentation**

| Document | Score | Verdict |
|---|---|---|
| PRD clarity and scope | 9.2 / 10 | Production-ready thinking |
| Architecture design | 9.0 / 10 | Excellent microservices-lite design |
| Service contracts | 8.8 / 10 | Comprehensive endpoint documentation |
| Agent instructions | 9.5 / 10 | Best-in-class AI coding guardrails |

**Business documentation**

| Document | Score | Verdict |
|---|---|---|
| Go-to-market strategy | 8.8 / 10 | Strong supply-first sequencing |
| Financial model | 5.5 / 10 | Thin, missing cost structure |
| Competitive analysis | 6.0 / 10 | Surface level, needs depth |
| UI/UX research (Kruzee) | 8.5 / 10 | Thorough and ethically conducted |

### 2.2 What is strong

The technical architecture is exceptional. The microservices-lite approach with clear ownership tables means no service is ambiguous about what it owns. The service contracts cover all 8 services with full request and response shapes. The agent instructions document is one of the most thorough sets of AI coding guardrails available — TypeScript strict mode, Zod validation, environment variable encapsulation, security rules, and MVP discipline are all enforced. The PostgreSQL NOTIFY event bus is a smart zero-infrastructure choice for MVP scale.

The go-to-market strategy demonstrates real marketplace logic. Supply-before-demand sequencing is correct. The 9-language strategy is a genuine competitive differentiator in Toronto. The 30-day execution plan with week-by-week actions is unusually concrete for an MVP specification. The clipping network concept is smart — education content drives organic student acquisition without requiring paid media spend.

The UI/UX research on Kruzee is rare to see at this level of structure. The walkthrough captures trust signals, booking friction, pricing patterns, and UX weaknesses without copying proprietary content. The companion "lessons from Kruzee" document correctly identifies what to emulate versus what to differentiate. Instructor marketplace transparency is correctly identified as the key differentiator.

The personas are sharp and market-specific. Alex (road test repeater), Priya (new arrival), Michael (independent instructor), and the Admin persona keep the product team honest during the build.

### 2.3 Gaps and risks

**Financial model is thin.** Only one revenue scenario is modeled (250 bookings times $6). No cost structure is included — hosting, Twilio SMS, Resend email, Mapbox, Stripe fees, and founder time are all missing. There is no break-even analysis or cash runway estimate. Investors will ask for this immediately.

**Competitive analysis is shallow.** Only 4 competitors are listed and no data is provided — no pricing, no market share, no user counts. The Kruzee walkthrough is actually stronger competitive intelligence than the competitive analysis document itself. Missing competitors include Young Drivers of Canada, DriveTest centres, AMA and CAA driving programs, and US comparables such as Zutobi, Aceable, and DriversEd.com for context.

**Payment model inconsistency.** The PRD says instructors pay $20 per month subscription from day one with no commission. The financial model says 10% commission. The pricing strategy says free to join plus 10% commission. These three documents directly disagree.

**No dispute resolution flow in the UX.** Dispute endpoints exist in the admin service but the student-facing and instructor-facing UI flow for submitting a dispute is never described. How does a student flag a no-show? What happens after submission? This needs a user story.

**Cancellation policy undefined.** The LATE_CANCELLATION error code exists in the service contracts but the actual policy is never written. What is the penalty? Who absorbs it — the student, instructor, or platform? Does the instructor keep 50 percent? This must be defined before Stripe integration begins.

**Instructor acceptance flow gap.** Booking status starts as "pending until instructor accepts" — but what is the service level agreement? If an instructor ignores a request for 48 hours, does it auto-expire? Does the student get auto-refunded? This timeout logic is missing from both the PRD and the service contracts.

**Pitch deck is just an outline.** Twelve slide titles with no content. The investor one-pager is stronger. If this is going to investors, it needs slide content — especially slide 4 (market size with TAM, SAM, SOM), slide 10 (financial projections), and slide 11 (team).

**No MTO compliance documentation.** MTO certificate verification is a core trust mechanic but the actual verification process is not defined. Is it manual admin review only? Is there an MTO API or database to cross-reference? What happens if a certificate is fake? This is a legal and trust risk.

---

## 3. Top recommendations to action before any code is written

Six items must be resolved before the mobile build begins.

### Recommendation 1: Resolve the revenue model conflict

The PRD, financial model, and pricing strategy must align. The recommended approach is to launch with free instructor sign-up plus 10 percent commission (lower friction, faster supply acquisition), then introduce the $20 per month Pro plan with reduced 5 percent commission in Phase 2 once 25-plus instructors are active and 500-plus bookings have been completed. This matches the existing pricing strategy document — the PRD and financial model should be updated to align.

### Recommendation 2: Write the cancellation policy

Define the 24-hour window penalty, who pays it, and how Stripe handles partial charges or holds. The LATE_CANCELLATION error code exists in the service contracts — the business rule behind it just needs to be written. Recommended structure: cancellations more than 24 hours in advance are no penalty; cancellations within 24 hours forfeit 50 percent of the lesson fee; instructor cancellations less than 24 hours in advance result in a service credit for the student and a strike against the instructor.

### Recommendation 3: Add booking request timeout logic

Add timeout rules to SERVICE_CONTRACTS.md defining what happens when an instructor does not respond within X hours — auto-expire the request, notify the student, free the slot. Recommended timeout: 12 hours for next-day bookings, 24 hours for bookings more than 48 hours in advance. Without this, students are stranded and slots are locked forever.

### Recommendation 4: Expand the financial model

Add infrastructure cost estimates (Supabase free tier, Vercel free tier, Twilio per SMS, Stripe 2.9 percent plus 30 cents per transaction, Mapbox), then calculate the real margin per booking. A $6 commission minus Stripe fees is closer to $4.30 net. Add a 12-month projection with assumptions for instructor growth, student growth, lessons per instructor per month, and cancellation rate. Add a sensitivity analysis showing best case, base case, and worst case scenarios.

### Recommendation 5: Flesh out the pitch deck

The investor one-pager is solid. The deck outline is just 12 slide titles. Add content — especially TAM, SAM, SOM for the Ontario driving instruction market, the team slide (who is Don, who is Brother David, what is the founding team's background), and 12-month financial projections.

### Recommendation 6: Create the missing requirements.md and design.md files

AGENT_INSTRUCTIONS.md references `.kiro/specs/drivebook-marketplace/requirements.md` and `design.md` (with 22 correctness properties) — but neither exists. AI coding agents will stop and ask for these files. Create them alongside the existing documents.

---

## 4. The mobile-native pivot — what it means

The current PRD explicitly states that mobile native apps are out of scope for the MVP. The plan is web-first responsive. Pivoting to a mobile-native enterprise application is a meaningful scope expansion that changes the timeline, the tech stack, and the team workload.

The recommended approach is to make the mobile application the primary client and keep the responsive web as a marketing and admin surface. This means:

- Two consumer-facing mobile apps in the app stores — one for students, one for instructors
- A responsive web admin dashboard for DriveBook staff to manage instructor approval, disputes, and platform health
- A responsive web marketing site for SEO, landing pages, language-specific content, and instructor recruitment
- The same TypeScript microservices backend serves all three surfaces

This approach is the right call for a Toronto-based marketplace where the primary user behavior is mobile (booking lessons, dropping pickup pins, receiving reminders, paying on the go) and where the trust signal of being in the App Store and Play Store is a meaningful credibility signal in immigrant communities where DriveBook's language matching strategy targets.

---

## 5. Competitor mobile app research arsenal

The following tools are ranked by value for DriveBook specifically. The total cost of the minimum viable stack is $10 per month.

### 5.1 Tier 1 — buy these, they pay for themselves

**Mobbin (Pro plan, $10 per month, billed annually).** A library of 621,500-plus real app screens and 142,200-plus user flows from shipped apps across fintech, e-commerce, health, productivity, social, and SaaS. Search by industry, pattern, and platform. As of May 2026, Mobbin operates an official MCP server (currently in beta) that connects directly to Claude Code, allowing reference flows to be queried during the build process without leaving the terminal. For DriveBook, search "booking flow", "pickup location", "service marketplace", and "instructor profile". This is the single highest-leverage tool to purchase.

**App Store and Google Play (manual deep dive). Free.** The most underrated research tool available. Download every competitor app, use it as a real student or instructor would, screen-record the flows, and read every 1-star review. The 1-star reviews are the gold mine — they describe exactly what users hate, which becomes the list of differentiators for DriveBook. Filter by recent and sort by "most critical" on every competitor app.

**Claude in Chrome. Included.** Available now. Claude can browse competitor sites, capture screenshots, and analyze flows in real time during a research session. Use it the same way the Kruzee walkthrough was conducted — ethically, with no logins, no payments, and no scraping. Generate a structured walkthrough document for each competitor in one session.

### 5.2 Tier 2 — nice to have, free or freemium

**Appark.ai. Free tier strong, paid tiers available.** The best free alternative to Sensor Tower. Provides download estimates, keyword rankings, revenue trend signals, and a pre-order spy feature for upcoming apps. For DriveBook, pull download estimates on Goldie, Outcoach, Total Drive, and Drive Scout. This reveals which competitor is actually being used versus merely listed on directories like Capterra.

**Sensor Tower (free tier). Free charts, enterprise pricing for full access.** Sensor Tower acquired data.ai (formerly App Annie) in 2024 and is now the largest app intelligence provider. The free tier shows top charts only. Skip the paid plan unless a funding round is imminent. For DriveBook, check the Education and Local Services categories in the Canadian App Store to see who is actually ranking.

**Page Flows. Approximately $99 per year.** Provides video walkthroughs of real app flows, which goes deeper than Mobbin's screenshot library. Filter by industry and flow type. Skip this unless Mobbin's screenshots do not provide enough motion and transition detail. Most teams do not need both.

**AppFollow. Free tier available.** Aggregates and analyzes app store reviews across competitors. Sentiment trends and common complaints. For DriveBook, track what students hate about Kruzee, Young Drivers, and Goldie. The complaints become the differentiators.

**Reddit and YouTube. Free.** Search r/Toronto, r/PersonalFinanceCanada, r/NewToCanada, and r/Ontariodriving. YouTube reviews of driving school apps from real students provide candid feedback that money cannot buy. Mine these for messaging copy.

### 5.3 Tier 3 — skip for now

**Sensor Tower paid and AppTweak. $10,000-plus per year.** Enterprise-priced. Powerful but overkill for a pre-launch MVP. Not until DriveBook has $100,000-plus in monthly recurring revenue and needs to defend market share. Appark.ai provides approximately 80 percent of the value at a fraction of the cost.

**SimilarWeb. $167-plus per month.** Strong on web traffic, weaker on mobile-only competitors. Most Toronto driving instructors do not have enough traffic for this to be useful. Acceptable for a one-off Kruzee check if curious, but not for the smaller competitors.

### 5.4 Minimum viable stack

Mobbin Pro ($10 per month) plus App Store and Play Store manual reviews (free) plus Claude in Chrome (included) plus Appark.ai free tier (free) plus AppFollow free tier (free) plus Reddit and YouTube (free). Total monthly cost: $10. This stack provides approximately 90 percent of what enterprise tools deliver for pre-launch competitive research.

---

## 6. What to study (and what to ignore)

Toronto driving instructor apps will teach what NOT to do. Adjacent two-sided marketplaces such as Uber, Airbnb, and Booksy will teach what works. Spend approximately 70 percent of research time on the marketplaces, not the driving apps.

### 6.1 Direct competitors — Toronto driving instruction

| App | Priority | Why study it |
|---|---|---|
| Kruzee | P1 | Already analyzed in the existing Kruzee UI walkthrough document. The booking funnel is the closest thing to a real competitor in the Canadian market. |
| Young Drivers of Canada | P1 | No real mobile app, but their booking and course portal flow defines what Toronto students expect from a driving school experience. |
| AMB Driving School | P2 | Mentions a "Student App to book and review performance." Worth one screen-record session to understand the feature set. |
| Globe Driving Academy | P3 | LMS-focused. Note their MTO compliance language for trust copy in DriveBook's instructor verification badges. |

### 6.2 Vertical SaaS — driving school management apps

These are tools built for instructors. Study the instructor-side UX, then surpass it.

| App | Priority | Why study it |
|---|---|---|
| Goldie | P1 | Scheduling and payments for independent instructors. Best-in-class instructor calendar UX. |
| Total Drive | P1 | Mobile-native instructor diary, pupil progress tracking, payments. Highly relevant to DriveBook's instructor app. |
| Learnr Driver | P2 | UK-based. ADI profile booking widget. Good reference for instructor public profiles. |
| Outcoach | P2 | All-in-one driving instructor platform. Study their student progress tracking. |
| Drive Scout | P3 | Driving school back-office. Less relevant for marketplace model. |
| Bookedin | P3 | Generic booking software. Skim for confirmation and reminder copy patterns. |

### 6.3 Adjacent two-sided marketplaces — the real masterclass

These have solved trust, discovery, booking, and payments at billion-dollar scale. Steal their UX patterns liberally — never their proprietary content.

| App | Priority | Why study it |
|---|---|---|
| Uber and Lyft | P1 | Pickup pin UX, on-demand booking, driver ratings, two-app architecture (rider plus driver). This is DriveBook's blueprint. |
| Airbnb | P1 | Host verification badges, language matching, reviews, trust density throughout the funnel. The DriveBook instructor profile should feel like an Airbnb listing. |
| Booksy and Fresha | P1 | Service provider marketplace booking. The closest UX pattern to what DriveBook needs. |
| Rover and Wag | P2 | Two-sided service marketplaces with pickup location and trust. Read their dispute resolution flows. |
| TaskRabbit | P2 | Tasker discovery and booking. Study their hourly rate display and provider comparison UX. |
| Mindbody | P3 | Service marketplace with subscriptions. Skim only — too feature-heavy for MVP reference. |

---

## 7. The 11-phase step-by-step build plan

Eleven phases total. Approximately 16-18 weeks. The web acts as a marketing and admin surface. Mobile is the primary product.

### Phase 0 — Foundation reset, fix the docs first

**Timing:** Week 0, 3-5 days. **Owner:** Don, with Claude Chat.
**Goal:** Resolve every contradiction before writing code. AI agents will execute exactly what the docs say, so the docs must be consistent.

Tasks:

- Update PRD: free plus 10 percent commission for Phase 1, $20 per month Pro plan plus 5 percent commission for Phase 2
- Update PRD: mobile-native is the primary client, responsive web is marketing and admin only
- Write the cancellation policy (24-hour window, who pays, Stripe handling)
- Add booking request timeout rules to SERVICE_CONTRACTS.md (auto-expire after 12 or 24 hours)
- Create the missing requirements.md and design.md (with the 22 correctness properties referenced)
- Define MTO certificate verification process (manual admin review for MVP)

**Gate to next phase:** Brother David reads all updated docs and confirms zero ambiguity remains.

### Phase 1 — Competitor mobile app research

**Timing:** Weeks 1-2. **Owner:** Don leads, Brother David reviews. **Tools:** Mobbin plus manual app testing.
**Goal:** A decision matrix that says exactly which features to Adopt, Improve, Abandon, or Invent for DriveBook.

Tasks:

- Set up Mobbin Pro and connect the MCP server to Claude Code
- Download all P1 apps (Kruzee, Goldie, Total Drive, Uber, Airbnb, Booksy) and use them as a real student or instructor for one full week
- Screen-record every key flow: onboarding, search, booking, payment, cancellation, rating
- Mine 1-star reviews on each competitor and categorize complaints (top 10 patterns)
- Generate a Claude in Chrome walkthrough document for each P1 competitor (same format as the existing Kruzee walkthrough)
- Build the Adopt, Improve, Abandon, Invent feature matrix as one Google Sheet, one row per feature
- Identify 3 features no competitor has that DriveBook should invent (deeper language matching, pickup pin pre-confirmation, instructor video bio)

**Deliverable:** One feature decision matrix, one UX inspiration board in Figma, a one-page "what makes DriveBook different" memo.

### Phase 2 — Mobile UX design and tech stack lock-in

**Timing:** Weeks 3-4. **Owner:** Designer or Don in Figma plus Brother David on stack.
**Goal:** A clickable Figma prototype of the student app and instructor app, plus a locked tech stack.

Tasks:

- Lock the stack: React Native plus Expo (see Appendix A for reasoning)
- Set up NativeWind (Tailwind for React Native) so UI styling matches the web responsive admin
- Decide on push notifications: Expo Push (simpler, sufficient for MVP) versus raw FCM and APNs
- Design the student app: home, search, instructor profile, booking, pickup pin, dashboard, rating
- Design the instructor app: onboarding, profile, availability calendar, booking inbox, earnings
- Apply the Kruzee UI lessons doc — trust density everywhere, mobile-first one-action-per-screen
- Build a Figma component library mirroring shadcn/ui patterns (cards, buttons, inputs)

**Gate:** 5 real Toronto driving instructors and 5 students walk through the Figma prototype and rank confusion points.

### Phase 3 — Architecture update for mobile

**Timing:** Week 5. **Owner:** Brother David.
**Goal:** Update ARCHITECTURE.md and SERVICE_CONTRACTS.md so existing services serve mobile as a first-class client.

Tasks:

- Add an Expo mobile app folder structure: `apps/mobile/` alongside `apps/web/`
- Add push notification handling to notification-service (Expo Push API)
- Confirm all existing service endpoints work for mobile (they should — REST and JSON is platform agnostic)
- Add mobile-specific endpoints: device token registration, push preferences, app version check
- Plan offline behavior: which screens need local caching (booking history, instructor profile)
- Set up Expo EAS Build for continuous integration and continuous deployment (Brother David's DevOps wheelhouse)

**Gate:** Updated docs pass the AGENT_INSTRUCTIONS.md review — agents can build mobile features without asking questions.

### Phase 4 — Foundation build, auth and project scaffold

**Timing:** Weeks 6-7. **Owner:** Claude Code plus Brother David.
**Goal:** Expo app boots on iOS and Android simulators, students and instructors can register and log in.

Tasks:

- Scaffold the Expo app in the Turborepo monorepo
- Wire Supabase Auth into Expo (deep links for OAuth callback)
- Build the auth flow: registration, login, email verification, password reset
- Set up the shared React Query data layer (works identically web and mobile)
- Connect to all 8 backend services via the typed API client

**Milestone:** A student and an instructor can register and log in on real iOS and Android devices.

### Phase 5 — Instructor app, onboarding and availability

**Timing:** Weeks 8-9. **Owner:** Claude Code plus Brother David.
**Goal:** An instructor can complete onboarding, upload documents, get approved, and publish availability.

Tasks:

- Instructor onboarding flow: profile, MTO certificate upload, photo ID, insurance, vehicle details
- Admin approval workflow (admin uses responsive web for this — no need for an admin mobile app)
- Availability calendar UI: weekly, bi-weekly, or one-off slots up to 60 days ahead
- Instructor dashboard: pending bookings, earnings preview, profile health

**Milestone:** Admin approves a real instructor from the web dashboard; instructor publishes availability from the mobile app.

### Phase 6 — Student app, search and booking flow

**Timing:** Weeks 10-11. **Owner:** Claude Code plus Brother David.
**Goal:** A student can find a Toronto instructor by language, drop a pickup pin, and book a lesson.

Tasks:

- Student home: search by area, language, rating, price
- Instructor card and profile screens (trust density per the Kruzee lessons document)
- Mapbox React Native integration: instructor markers, pickup pin drop, reverse geocoding
- Booking flow: slot selection, pickup pin, confirmation, pending, accepted
- Cancellation flow using the policy written in Phase 0

**Milestone:** A student in Scarborough books a Mandarin-speaking instructor and both parties see the confirmation.

### Phase 7 — Payments and Stripe Connect

**Timing:** Weeks 12-13. **Owner:** Claude Code plus Brother David.
**Goal:** Students pay through the app, instructors receive payouts minus the 10 percent commission.

Tasks:

- Stripe Connect (Express accounts) for instructor payouts — switch from Stripe Subscriptions per the resolved revenue model
- Student payment at booking confirmation
- 10 percent platform commission held until lesson completion
- Instructor payout flow (weekly Stripe scheduled transfers)
- Refund flow tied to the cancellation policy

**Milestone:** Real $1 test transaction: student pays, lesson completes (simulated), instructor receives $0.90.

### Phase 8 — Notifications, reminders, ratings, and disputes

**Timing:** Weeks 14-15. **Owner:** Claude Code plus Brother David.
**Goal:** The full booking lifecycle closes, including ratings and dispute submission.

Tasks:

- Push notifications via Expo Push (booking confirmed, 24-hour reminder, 2-hour reminder, rating request)
- Email and SMS via Resend and Twilio (same as the PRD)
- Post-lesson rating UI (1-5 stars plus optional text)
- Dispute submission flow from both student and instructor sides
- Admin dispute resolution on web

**Milestone:** A full lesson lifecycle runs end-to-end on real devices with real notifications.

### Phase 9 — QA, polish, beta release

**Timing:** Week 16. **Owner:** Don leads testing, Brother David on bug fixes.
**Goal:** Closed beta with 25 instructors and 100 students using TestFlight and Play Console Internal Testing.

Tasks:

- End-to-end tests with Detox (Expo's testing tool)
- Accessibility audit (VoiceOver and TalkBack)
- Security review: JWT handling, deep link safety, file upload limits
- TestFlight build for iOS plus Internal Track for Android
- Run the Phase 1 marketing plan to recruit beta instructors and students

**Milestone:** 10 real bookings completed in beta with no critical bugs.

### Phase 10 — Public launch and iterate

**Timing:** Weeks 17-18. **Owner:** Don leads go-to-market, Brother David on monitoring.
**Goal:** App Store and Play Store live in Toronto. Marketing engine running per the GTM plan.

Tasks:

- App Store and Play Store submissions (allow 1-2 weeks for review)
- App Store Optimization: keywords, screenshots, description per the Marketing Plan
- Execute the clipping network strategy from the Marketing Plan
- Monitor analytics: PostHog or Amplitude for behavior, Sentry for errors
- Weekly competitor recheck via Mobbin and Appark.ai

**90-day goal:** 25 active instructors, 100 students, 100 completed bookings.

---

## 8. Three immediate next actions

Stop reading and do these before touching code.

**Today.** Subscribe to Mobbin Pro at $10 per month and connect the MCP server to Claude Code. Brother David will appreciate this — it means Claude Code can pull real app reference flows mid-build without ever leaving the terminal.

**This week.** Run Phase 0. Sit down for half a day with Claude Chat and bang out the doc fixes — revenue model alignment, cancellation policy, booking timeout rules, and the missing requirements.md and design.md files. Claude can draft any of these on request — just specify which one.

**Next two weeks.** Run Phase 1 properly. Do not skip the manual app testing. Download Kruzee, Goldie, Total Drive, Uber, Airbnb, and Booksy. Use them as a real student would. Screen-record everything. The 1-star reviews on each one will hand over the differentiators on a plate.

---

## 9. Appendix A — Why React Native + Expo

The React Native plus Expo recommendation is deliberate.

It reuses the entire TypeScript backend, the shared types package, the Supabase Auth integration, the Stripe integration, and the validation schemas. Everything that has been designed in the existing PRD and SERVICE_CONTRACTS works without rewrite.

Flutter would force a Dart rewrite of the type layer. Native iOS and Android (Swift plus Kotlin) would double the build cost and require two separate codebases. Expo with EAS Build is the only choice that lets a small team ship enterprise-grade mobile in 16 weeks.

Other reasons:

- Claude Code has strong fluency in React Native and Expo
- Expo handles push notifications, deep links, OTA updates, and app store builds out of the box
- The same React Query, Zod, and TypeScript patterns used in Next.js work identically in Expo
- NativeWind brings Tailwind utility classes to React Native, matching the design system in the existing apps/web
- EAS Build provides CI/CD that fits Brother David's DevOps background

---

## 10. Appendix B — Quick-reference checklists

### Pre-build checklist

- [ ] Revenue model conflict resolved across PRD, financial model, and pricing strategy
- [ ] Cancellation policy written and reviewed
- [ ] Booking timeout logic added to SERVICE_CONTRACTS.md
- [ ] requirements.md created
- [ ] design.md created with the 22 correctness properties
- [ ] MTO verification process defined
- [ ] PRD updated to reflect mobile-native primary client
- [ ] Mobbin Pro subscribed
- [ ] Mobbin MCP server connected to Claude Code

### Research deliverables checklist

- [ ] Competitor walkthrough document for Kruzee (exists)
- [ ] Competitor walkthrough document for Goldie
- [ ] Competitor walkthrough document for Total Drive
- [ ] Competitor walkthrough document for Uber
- [ ] Competitor walkthrough document for Airbnb
- [ ] Competitor walkthrough document for Booksy
- [ ] 1-star review patterns spreadsheet
- [ ] Feature decision matrix (Adopt, Improve, Abandon, Invent)
- [ ] UX inspiration board in Figma
- [ ] "What makes DriveBook different" one-page memo

### Build phase milestones checklist

- [ ] Phase 4: Auth working on iOS and Android
- [ ] Phase 5: Real instructor onboarded and approved
- [ ] Phase 6: Real booking placed in Scarborough with language match
- [ ] Phase 7: $1 test transaction with payout completed
- [ ] Phase 8: Full lifecycle with notifications on real devices
- [ ] Phase 9: 10 bookings completed in beta
- [ ] Phase 10: Live in App Store and Play Store

---

*DriveBook via Claude, version 1.0. Prepared for Don and Brother David. June 2026.*

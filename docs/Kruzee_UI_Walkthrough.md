# Kruzee UI Walkthrough

## Research Metadata

- Date of research: 2026-06-07
- Target: https://kruzee.com
- Device / viewport used: mobile-sized viewport, approximately 390 x 844, iPhone-style user agent where available
- Research purpose: Competitive UI/UX reference for DriveBook, using public information only
- Ethical boundary: No login, no private account access, no payment submission, no hidden API scraping, no personal information collection

## Sources Observed

- Public marketing homepage: `https://kruzee.com`
- Public lessons page: `https://kruzee.com/driving-lessons`
- Public app entry point: `https://app.kruzee.com`

## Page-by-Page Walkthrough

### 1. Homepage

The homepage opens with a location/province selection layer and prominent public navigation for services, cities, sign up, login, and booking.

Observed public homepage content included:

- Province/location selector with Ontario, British Columbia, Alberta, and New York.
- Primary student CTA: `Book Online`.
- Secondary account CTAs: sign up and login.
- Headline positioning around learning to drive safely and confidently.
- Benefit bullets around top-rated instructors, online scheduling, progress tracking, and insurance discount eligibility.
- Trust signals such as large student counts, award-style claims, partner references, instructor badges, ratings, and testimonials.

### 2. Search or Booking Entry Point

The public booking entry is a `Book Online` / `Book Now` CTA that sends the user to `app.kruzee.com`.

The app entry point is a simple first step:

- Kruzee logo at top.
- Heading asking the user to enter a postal/zip code.
- Helper text explaining this is used to find instructors in the user's area.
- Postal/zip code input.
- Disabled `Continue` button until input is provided.

This is a clear location-first funnel. It asks for geography before showing instructor availability or full package details inside the app.

### 3. Lesson / Package Selection

Public package information is visible before entering the app.

Observed public pricing/package signals:

- Hourly Driving Lessons shown on the homepage as `$85/hr + HST`.
- Beginner Driver Education course shown as `$795 + HST`.
- Driving lessons page shows hourly lessons with visible "Starting at" pricing and multiple regional/package price points, including `$85/hr + HST`, `$95/hr + HST`, `$85/hr`, and `$75/hr`.
- Public copy emphasizes transparent pricing, no hidden fees, payment plans, and satisfaction guarantee.

The exact in-app package-selection step was not fully traversed because the app required location progression and the research stopped before any account/payment-sensitive steps.

### 4. Location Selection

Kruzee uses two visible location patterns:

- Marketing site: province/location selector.
- Booking app: postal/zip code entry.

The location-first approach likely helps determine service availability, regional pricing, and eligible instructors. It also introduces friction before the user sees precise availability.

### 5. Instructor / Course Details

The public site includes instructor trust and course detail patterns rather than a full searchable instructor marketplace.

Observed instructor-detail style content:

- Instructor example card with name, region, certification/training badges, review score, and review count.
- Badges such as government-certified, background-checked, defensive-driving trained, ministry approved, multilingual, hours taught, and top-rated.
- Qualitative instructor bio emphasizing calm guidance, safe habits, and student confidence.

Course/service details emphasize:

- Personalized in-car lessons.
- Defensive driving.
- Road test preparation.
- Online scheduling.
- Progress tracking.
- Insurance discount eligibility for BDE.

### 6. Scheduling / Availability Flow

Public marketing copy strongly emphasizes online scheduling and rescheduling, but the exact schedule grid was not reached during this ethical public walkthrough.

Observed scheduling-related signals:

- "Schedule your lessons online and track your progress."
- Login option for managing in-car lessons, rescheduling, and booking more lessons.
- Testimonials mention pre-booking lessons and online scheduling as a major differentiator.

DriveBook should treat scheduling as a first-class user flow, not a hidden secondary step.

### 7. Checkout / Payment Entry Point

The public pages expose `Book Now` CTAs and pricing. The app entry point loaded a booking flow and includes payment-related infrastructure in the page, but no payment form was reached or interacted with.

Research stopped before payment or account-sensitive steps.

Observed public payment-related signals:

- Payment plans available.
- Package pricing displayed before app entry.
- Checkout/payment implied by `Book Now`, but not completed or inspected beyond public entry.

### 8. Reviews / Trust Signals

Kruzee puts heavy emphasis on trust.

Observed trust elements:

- "Trusted by 15,000+ drivers."
- "Chosen by 15,000+ New Drivers."
- Google review count and rating presentation.
- Student testimonial carousel/list.
- Instructor rating example such as 4.9 with review count.
- Satisfaction rate and lesson-delivery volume.
- Road test pass rate.
- Partner references such as MADD.
- Certification and background-check badges.
- Vehicle safety messaging.

Trust signals appear repeatedly across the page, not only near checkout.

### 9. Calls to Action

Observed CTA patterns:

- `Book Online`
- `Book Now`
- `Sign Up`
- `Login`
- `Learn More`
- Course access login options for existing students

The strongest CTA pattern is booking-oriented, with account login kept available but secondary.

## Screens Observed

- Homepage / location selector.
- Homepage hero and trust sections.
- Services/course cards.
- Driving lessons pricing section.
- Reviews/testimonials section.
- Public app postal/zip code entry screen.

## UX Strengths

- Strong trust-building throughout the funnel.
- Clear public pricing before entering the app.
- Mobile-friendly short booking entry step.
- Location-first flow likely keeps availability relevant.
- Repeated CTAs make it easy to continue.
- The messaging directly addresses student anxiety, safety, confidence, and road test success.
- Instructor trust badges help reduce perceived risk.

## UX Weaknesses

- Location/province content appears dense and repeated in the page text structure.
- The user is asked for postal/zip code before seeing instructor options or schedule availability.
- Public pages mix many regions and services, which can feel noisy for a Toronto-only student.
- The booking app lives on a separate subdomain, which may feel like a context switch.
- Pricing varies by section/region, which may require careful presentation to avoid confusion.
- The public path emphasizes school/course packaging more than individual instructor comparison.

## Trust-Building Elements

- Student volume claims.
- Google review ratings.
- Student testimonials.
- Instructor profile examples.
- Certification, background check, and ministry approval language.
- Safety-focused vehicle and defensive-driving messaging.
- Partner/award-style credibility markers.
- Satisfaction guarantee.
- Payment plan messaging.

## Booking Friction Points

- Postal/zip code is required before seeing local instructor availability.
- The app does not expose enough context on the first booking screen beyond location.
- Students who want to browse instructors first may feel blocked.
- Region switching and service categories can add cognitive load.
- Payment plan/checkout details are deferred until later.

## Pricing / Package Observations

Public pricing was visible:

- Hourly lessons: `$85/hr + HST` observed on the homepage.
- BDE course: `$795 + HST` observed on the homepage.
- Driving lessons page showed multiple "Starting at" prices by region/package, including `$85/hr + HST`, `$95/hr + HST`, `$85/hr`, and `$75/hr`.
- Payment plans are publicly promoted.

## Ideas DriveBook Can Learn From

- Put trust signals near every major decision point, not only on a reviews page.
- Use location early, but explain why it is needed.
- Make pricing visible before account creation.
- Use instructor cards with concrete credibility badges.
- Let students understand what happens after booking: schedule, reminders, progress, completion, review.
- Position safety and confidence as core outcomes, not just lesson logistics.
- Use testimonials to validate specific student anxieties: nervous drivers, newcomers, road test repeaters, busy schedules.

## Ideas DriveBook Should Avoid Copying Directly

- Do not copy Kruzee branding, color system, images, icons, testimonials, copy, instructor examples, or proprietary content.
- Do not duplicate the exact province/location selector pattern.
- Do not duplicate their app flow or checkout wording.
- Do not copy their exact pricing/package structure.
- Do not rely on broad national/regional content if DriveBook is initially Toronto-focused.

## Screenshots

Screenshots were attempted with local headless Chrome/Edge at a mobile viewport. The available browser runtime did not produce usable image files due local headless/GPU/runtime failures, so no screenshot files are included in this commit.

If screenshots are needed later, capture manually from a normal browser and save them under:

`docs/research/screenshots/`


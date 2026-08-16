# Session State: 16 August 2026

**Purpose:** resume point after reboot. Delete once the work below is done.

---

## Decisions made this session

| # | Decision | Status |
|---|---|---|
| 1 | **Mobile stack stays React Native + Expo.** Native iOS + native Android formally reconsidered at David's request and rejected. Use prebuild and development builds, not Expo Go. | Decided |
| 2 | **Pricing stays $60 / $45 / $15.** A proposed move to $65/$50/$15 was considered and dropped. `PRICING_MODEL.md` v1.1 remains correct as written. | Decided |
| 3 | **`.kiro/specs/` owns the technical spec.** `requirements.md` and `design.md` are the single authority for what gets built. `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/SERVICE_CONTRACTS.md` get reduced to short pointers. `docs/` keeps business content only: journeys, policy, strategy, competitive analysis. | Decided, not yet executed |

### Reasoning behind decision 1, in brief

David's position was that native opens up SDK utilisation. That premise applies to **Expo Go** (a fixed pre-built container that cannot accept new native code) and not to **development builds with config plugins**, which impose no limit on native SDK access. Stripe's own documentation confirms `@stripe/stripe-react-native` internally wraps the native iOS and Android SDKs, so native does not unlock anything there.

Where David is right: `rnmapbox/maps` is community-maintained with no formal Mapbox support, and `expo-location` stops delivering on iOS once the app is terminated. Neither is in current MVP scope.

The deciding factor was team capacity, not SDKs. Two non-specialists maintaining two codebases would roughly double a 16 to 18 week plan, and AI assistance does not change this because it accelerates both options equally while leaving review capacity, the actual bottleneck, unchanged.

Full memo: `DriveBook_Mobile_Stack_Decision_Memo.md` (currently outside the repo, needs filing into `docs/`).

---

## The problem to fix next

`.kiro/specs/drivebook-marketplace/requirements.md` duplicates most of three `docs/` files:

| Section of `requirements.md` | Duplicates |
|---|---|
| Introduction, Glossary, Personas, MVP Scope | `docs/PRD.md` |
| Service Architecture, Folder Structure, Database Model | `docs/ARCHITECTURE.md` |
| API Contracts | `docs/SERVICE_CONTRACTS.md` |

Some passages are identical (`PRD.md` line 13 and `requirements.md` line 7 are the same sentence). `design.md` overlaps the same ground again.

**Consequence:** the dead $20/month subscription model is not one defect in eleven files. It is one defect copied across two or three parallel versions of the same spec. Consolidation must happen before or alongside the pricing correction, otherwise the same fix gets applied five times and re-diverges later.

### Confirmed defects in the spec files

`.kiro/specs/drivebook-marketplace/requirements.md`

- Requirement 4, "Instructor Subscription Management", mandates $20/month Stripe checkout
- Phase 5 of the build plan is titled "Payments and Subscriptions"
- Glossary defines Subscription as a core concept
- Line 72, line 80, line 86, line 325, line 367, lines 852 to 854

`.kiro/specs/drivebook-marketplace/design.md`

- Correctness Property 6 is subscription status sync
- `payment-service` specified as owning Stripe subscription lifecycle
- Three `customer.subscription.*` webhook handlers
- Line 20, lines 115 to 116, line 133, lines 256 to 257, lines 400 to 425, line 1399

These are what Kiro generates code from. Left as-is, an agent will correctly implement a subscription billing system for a product that does not sell subscriptions.

The authoritative correction list is `docs/PRICING_MODEL.md` Section 6.

---

## Work queue

1. **Fix the two `.kiro` spec files.** Replace subscription requirements with fixed $60/$45/$15 booking and payout requirements. Replace Correctness Property 6. Highest risk, do first.
2. **Execute the consolidation** per decision 3.
3. **Work down `PRICING_MODEL.md` Section 6** for the remaining non-conforming files.
4. **File the two memos** into `docs/`.

---

## Security: deferred dependency advisories

`npm audit fix` on 16 August 2026 took the count from 13 advisories to 3. The remaining three are `postcss`, `sharp`, and `next`, all reachable only through `apps/web`, and all resolvable only by installing `next@16.3.1`, a breaking major upgrade from the current `15.5.23`.

**Decision: deferred, deliberately.**

Reasoning:

- Nothing is deployed. There is no running instance, so exposure is zero rather than low.
- The advisories live in `apps/web`, which is a throwaway prototype scheduled for deletion. Upgrading code that is going to be deleted is wasted effort.
- A Next 15 to 16 major upgrade risks breaking a build with no production value.
- The permanent fix is free: start the real admin and marketing surface on Next 16 or later, and the problem never exists.

**Trigger condition. This is the part that matters.**

> Before any web surface is deployed to a publicly reachable URL, `npm audit`
> must report zero advisories, or every remaining advisory must be listed here
> with a written, dated acceptance by Don and David.

A deferral without a trigger is just forgetting. The trigger is what makes this a decision.

Two of the deferred Next.js advisories are worth re-reading at that point rather than accepting blind, because both are internet-facing:

- Server-Side Request Forgery in Server Actions
- Unauthenticated disclosure of internal Server Function endpoints

---

## Repository status

Already correct, no action needed:

- Remote `origin` at `github.com/ispeak2u/drivebook.git`, branch `main`
- `.gitignore` blocks `.env`, `.env.*`, `node_modules/`, `.kiro/mcp.json`
- `.gitattributes` has `* text=auto` plus explicit binary and line-ending rules

Open items:

| Item | Detail |
|---|---|
| Git identity | `user.name` is `ispeak2u`. Convention calls for `Paul Alfred` on Windows and `Hermy (hermes-agent)` on the server, so `git log` shows origin at a glance. |
| Remote protocol | HTTPS. Hermy needs SSH with a deploy key scoped to `drivebook` only, plus its own `~/.ssh/config` entry, then clone to `~/projects/drivebook`. New repo means new key. |
| Repo visibility | Unconfirmed whether private. Confirm before anything else. |
| OneDrive | Unconfirmed whether `C:\Users\Paul\Paul Alfred 2020\` is inside OneDrive. There is a live `.git` directory there, and standing policy is no git repos inside OneDrive. |

---

## Open specification questions, unresolved

| Question | Why it matters |
|---|---|
| Weekly recurring availability vs one-off slots | "Instructors add their schedule each week" implies recurring templates. Phase 5 says only "availability calendar". Different data model, different UI. Settle before Phase 5. |
| HST treatment | `PRICING_MODEL.md` 5.2. Whether $60 is tax inclusive or exclusive, and who is supplier of record. Needs professional advice. |
| Instructor payout schedule | `PRICING_MODEL.md` 5.3. Needs a stated day, cutoff, and minimum threshold. |
| MTO certificate verification | Manual admin review assumed for MVP, never specified. |

---

## Note on UX research

David's proposal to scrape Airbnb and similar apps will not work as described. Native mobile apps have no HTML to scrape, and scraping the websites yields web UI rather than app UI, against their terms.

The tool that does this properly is already a P1 item on the task hub: **Mobbin Pro at $10/month**, a curated library of real app screens and flows, Airbnb included, with an MCP server that connects to Claude Code. Pair it with the competitor-app week already in the plan (Kruzee, Goldie, Total Drive, Uber, Airbnb, Booksy: install, use for a week, screen-record flows, mine 1-star reviews). This approach has already produced two good documents for Kruzee.

Output should be the Adopt / Improve / Abandon / Invent matrix that Phase 1 already calls for.

---

## Environment note

The Linux shell was unavailable for the latter part of this session ("VM service not running"), which is why no `git` commands were run and all inspection was done with file reads. The reboot should restore it.

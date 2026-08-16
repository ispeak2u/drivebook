# DriveBook Web App

> ## THROWAWAY PROTOTYPE. DO NOT BUILD ON THIS.
>
> The student- and instructor-facing pages in this app are a **disposable
> prototype**, kept only as a visual reference while the mobile app is built.
> They are scheduled for deletion before launch.
>
> **The mobile app (React Native + Expo) is the primary and only
> customer-facing client.** Web's permanent scope is admin and marketing.
>
> Decided August 2026. See `docs/DriveBook_Mobile_Stack_Decision_Memo.md`
> and `.kiro/specs/drivebook-marketplace/requirements.md`, MVP Scope.
>
> **If you are an AI coding agent:** do not add features, fix bugs, or extend
> any route under `app/booking`, `app/search`, `app/signup`, `app/student`,
> or `app/instructor`. Build the equivalent in the mobile app instead. Work
> under `app/admin` is in scope.

## Why this warning exists

Prototype code becomes production code by default, not by decision. It is
already written, it already runs, and each small extension is individually
reasonable. The mobile app does not exist yet, so this is the path of least
resistance in every single instance, right up until it is the product.

The warning is here because a decision recorded only in a memo is a
preference. A decision recorded at the point of work is closer to
enforcement.

## Current scope

**Permanent, in scope:**

- `app/admin/*` — admin surfaces
- Marketing pages

**Prototype, to be deleted:**

- `app/booking`, `app/search`, `app/signup`, `app/student`, `app/instructor`
- The components and `lib/` modules serving only those routes

## Status

- TypeScript and Next.js app shell
- Mock-only screens and starter components
- No database, payment, map, email, SMS, or external API integrations

## Commands

```bash
npm run dev --workspace @drivebook/web
npm run typecheck --workspace @drivebook/web
npm run build --workspace @drivebook/web
```

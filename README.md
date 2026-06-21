# DriveBook

DriveBook is a TypeScript monorepo for a driving instructor booking marketplace.

Students use DriveBook to find instructors, request lessons, manage bookings, and leave verified reviews. Instructors use it to manage profiles, availability, lesson requests, and reputation. Admins use it to review marketplace activity, approvals, and disputes.

This repository is intentionally early-stage. Phase 1 should stay focused on clean structure, TypeScript foundations, shared contracts, and mock-only starter code. Do not connect Supabase, Stripe, maps, email, SMS, or other external APIs until that work is explicitly planned.

## Workspace Layout

- `apps/web` - student and instructor-facing web application.
- `apps/admin` - operations and admin application.
- `services/*` - independently owned backend service boundaries.
- `packages/shared-types` - shared domain and API types.
- `packages/api-client` - client helpers for app-to-service calls.
- `packages/ui` - shared UI components.
- `docs` - product, architecture, service contract, and agent guidance placeholders.
- `scripts` - automation and repository scripts.

## Laptop and Desktop Workflow

GitHub is the source of truth.

When working between Don's laptop and desktop:

- Always pull from GitHub before starting work.
- Never work directly on `main`.
- Create a feature branch for each focused task.
- Commit small changes with clear messages.
- Push before switching machines.
- Use the external drive for backups only, not as the active project copy.

Basic Git flow:

```bash
git checkout main
git pull origin main
git checkout -b feature/short-task-name
git status
git add .
git commit -m "Describe the small change"
git push origin feature/short-task-name
```

## Getting Started

Install dependencies from the repository root:

```bash
npm install
```

Run workspace checks when implementation begins:

```bash
npm run typecheck
npm run build
```

Run the web app during local development:

```bash
npm run dev --workspace @drivebook/web
```

## Source of Truth

Read these docs before changing service boundaries or product behavior:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/SERVICE_CONTRACTS.md`
- `docs/AGENT_INSTRUCTIONS.md`

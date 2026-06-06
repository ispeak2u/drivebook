# AGENT INSTRUCTIONS — DriveBook

> **Read this file before writing a single line of code.**
> This applies to Codex, Kiro, GitHub Copilot, Cursor, and any other AI coding agent working on DriveBook.

---

## 1. Before You Start Any Task

Always read these three files first — in this order:

1. `docs/PRD.md` — What we are building and why. Understand the product before touching code.
2. `docs/ARCHITECTURE.md` — How services are structured, what each service owns, and how they communicate.
3. `docs/SERVICE_CONTRACTS.md` — Every API endpoint, request/response shape, and event contract. This is the source of truth for inter-service communication.

If any of these files do not exist yet, stop and ask before proceeding.

---

## 2. Scope Rules

### Work on one feature at a time

- Accept one clearly scoped task.
- Complete it fully before moving to the next.
- Do not bundle unrelated changes into the same output.

### Never touch unrelated services

- If your task is in `services/booking-service`, do not modify files in `services/instructor-service`, `services/payment-service`, or any other service unless the task explicitly requires cross-service changes.
- If a change requires updates in more than two services, stop and ask for confirmation before proceeding.

### Keep changes small

- Prefer targeted edits over large rewrites.
- If a file is over 200 lines and you need to add logic, add a new function — do not rewrite the existing file.
- One pull request = one feature or one bug fix.

---

## 3. Language and Style

- **TypeScript everywhere.** Strict mode is on. Never use `any`. If you don't know the type, check `packages/types/src/` — the type likely already exists.
- **Named exports only** in service files. Default exports are only allowed in Next.js page components (`apps/web/app/**/page.tsx`).
- **File names** must be descriptive and use camelCase for TypeScript files (`createBooking.ts`, not `cb.ts` or `handler.ts`).
- **Functions** should be small and do one thing. Aim for under 40 lines per function. If it is getting longer, split it.
- **No magic numbers or hardcoded strings.** Use constants defined in the relevant service or in `packages/config`.

---

## 4. Environment Variables

- Never access `process.env` directly in service code.
- Always import `env` from `packages/config/src/env.ts`.
- If you need a new environment variable, add it to the Zod schema in `env.ts` first, then use it.

```typescript
// ✅ Correct
import { env } from '@drivebook/config';
const apiKey = env.RESEND_API_KEY;

// ❌ Wrong
const apiKey = process.env.RESEND_API_KEY;
```

---

## 5. Database Rules

- Use the Supabase client from `packages/db/src/client.ts` for all queries.
- Do not write raw SQL in handler files. Raw SQL belongs only in migration files under `packages/db/migrations/`.
- Do not write directly to a table owned by another service. Call that service's HTTP endpoint instead.
- Check the ownership table in `docs/ARCHITECTURE.md` before writing to any table.

```typescript
// ✅ Correct — use Supabase client
import { supabase } from '@drivebook/db';
const { data, error } = await supabase.from('bookings').select('*').eq('student_id', userId);

// ❌ Wrong — raw SQL in a handler
const result = await pool.query('SELECT * FROM bookings WHERE student_id = $1', [userId]);
```

---

## 6. Input Validation

Every handler that accepts a request body must validate it with **Zod** before doing anything else. Return a `400` with structured error details on validation failure.

```typescript
import { z } from 'zod';

const schema = z.object({
  slot_id: z.string().uuid(),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
});

const parsed = schema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: parsed.error.flatten(),
    },
  });
}
```

---

## 7. Response Format

All service endpoints must return the standard response envelope. No exceptions.

```typescript
// Success
{ "data": <payload>, "error": null }

// Error
{ "data": null, "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": {} } }
```

HTTP status codes to use:

| Code | When |
|---|---|
| 200 | Successful read or update |
| 201 | Resource created |
| 400 | Validation failure |
| 401 | Missing or expired JWT |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 409 | Duplicate or constraint conflict |
| 422 | Business rule violation |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error (never expose stack traces) |

---

## 8. API Contracts

- Do not rename, remove, or change the shape of any existing API endpoint without also updating `docs/SERVICE_CONTRACTS.md`.
- If you add a new endpoint, add it to `SERVICE_CONTRACTS.md` in the same output.
- Endpoint paths use lowercase kebab-case: `/bookings/:id/cancel`, not `/bookings/:id/Cancel`.
- Route parameters use camelCase in code but kebab-case in paths.

---

## 9. Security

- Every protected endpoint must run the auth middleware from `services/auth-service/src/middleware/auth.ts`.
- Admin-only endpoints must run `requireAdmin` from `services/admin-service/src/middleware/requireAdmin.ts`.
- Service-to-service calls must include the `X-Internal-Key` header using `env.INTERNAL_SERVICE_KEY`.
- Never log JWT tokens, passwords, Stripe keys, or any secret value.
- Error messages for auth failures must not reveal whether an email exists or which credential was wrong.
- Use `crypto.randomBytes()` or `crypto.randomUUID()` for any ID or token generation. Never use `Math.random()`.

---

## 10. Testing

- Write at least one unit test for every new handler function.
- Place tests in a `__tests__/` directory co-located with the source file.
- Use **Vitest** for unit and integration tests.
- Use **fast-check** for property-based tests where the function has universal correctness properties (see `docs/ARCHITECTURE.md` for the full list of properties to cover).
- Tag each property test with its reference:

```typescript
// Feature: drivebook-marketplace, Property 9: Slot reservation is exclusive
it('rejects double booking of the same slot', () => { ... });
```

- Tests are not optional for handler functions. If time is short, write the test stub and mark it `it.todo(...)` rather than skipping it entirely.

---

## 11. Refactoring Rules

- Do not rename files, functions, or exported interfaces without confirmation from Don.
- Do not restructure the folder layout without confirmation.
- Do not move shared logic into a new package without confirmation.
- Before any refactor that touches more than three files, write a one-paragraph summary of what you plan to change and why, and wait for a "go ahead" before doing it.

---

## 12. What to Return

Return only the files you changed or created. Do not return:
- Files you read but did not modify
- Auto-generated lock files (`pnpm-lock.yaml`, etc.)
- Build output files

For each file you return, include:
1. The full file path from the repo root
2. The complete file content (not a diff)
3. A one-line comment at the top of new files explaining its purpose

---

## 13. MVP First

DriveBook is an MVP targeting the Toronto market. Optimise for **working software shipped quickly**, not for elegant abstraction.

- Do not add configuration options that are not needed today.
- Do not add caching unless a specific performance problem is identified.
- Do not abstract patterns into shared utilities until the pattern appears in at least three places.
- Do not add support for future features that are explicitly listed as "Out of scope for MVP" in `docs/PRD.md`.
- Phase 2 features (Location Service, native apps, in-app chat, booking commissions) are off-limits until explicitly unlocked.

When in doubt, ask: *"Does this make the MVP ship faster and work more reliably?"* If the answer is not clearly yes, leave it out.

---

## 14. When to Stop and Ask

Stop and ask Don before proceeding if:

- The task requires changing the database schema in a way not covered by an existing migration.
- The task requires adding a new external dependency (npm package).
- The task requires changes in three or more services simultaneously.
- The acceptance criteria are ambiguous or contradict the requirements document.
- A large refactor is the cleanest path forward.
- You are unsure which service should own a new piece of logic.

A short question is always better than a large incorrect output.

---

## 15. Quick Reference

| Rule | Short Version |
|---|---|
| Read first | PRD → ARCHITECTURE → SERVICE_CONTRACTS |
| Scope | One feature, one service, one PR |
| Language | TypeScript strict, no `any` |
| File names | Descriptive camelCase |
| Env vars | Always via `env` from `@drivebook/config` |
| Database | Supabase client only, no raw SQL in handlers |
| Validation | Zod on every request body |
| Responses | Always `{ data, error }` envelope |
| APIs | Update SERVICE_CONTRACTS.md when you change an endpoint |
| Security | Auth middleware on every protected route |
| IDs/tokens | `crypto.randomBytes()` only |
| Tests | One test per handler, use Vitest + fast-check |
| Refactors | Ask before touching more than 3 files |
| Return | Changed files only, full content |
| MVP | Simple and working beats clever and future-proof |

---

*DriveBook — Agent Instructions v1.0*

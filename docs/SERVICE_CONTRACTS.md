# Service Contracts

Placeholder for DriveBook API and event contracts.

## Contract Principles

- Services should expose explicit typed request and response shapes.
- Cross-service calls should use shared DTOs from `packages/shared-types`.
- Public APIs should return a consistent response envelope.
- Implementation details should stay inside the owning service.

## Initial Contract Areas

- Auth registration and login.
- Instructor profile and availability.
- Instructor search and discovery.
- Booking creation, cancellation, completion, and rating.
- Payment webhooks and subscription status.
- Admin instructor approval and dispute resolution.

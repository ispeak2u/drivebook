# Architecture

Placeholder for the DriveBook architecture.

## Current Scaffold

The repository is organized as a TypeScript monorepo with separate apps, services, and shared packages.

## Service Boundaries

- `auth-service` owns identity, sessions, and role-aware authentication.
- `student-service` owns student profile concerns.
- `instructor-service` owns instructor profiles, approval status, and availability.
- `booking-service` owns booking lifecycle and cancellation behavior.
- `payment-service` owns Stripe integration, payments, and subscriptions.
- `review-service` owns ratings, reviews, and dispute intake.
- `notification-service` owns reminder and notification delivery.
- `admin-service` owns administrative workflows.

## Future Decisions

- Runtime framework for services.
- Database migration strategy.
- Eventing implementation.
- Deployment topology.

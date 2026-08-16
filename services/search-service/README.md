# Search Service

Owns instructor search, filtering, and result ranking. Reads from `instructor_profiles` and `availability_slots`; owns no persistent tables of its own.

Filters: location (Haversine distance from the student's pickup pin), language, minimum rating, and availability window.

Sort modes are `distance` and `rating` only. **Price sorting and a `max_rate` filter are deliberately absent**: every instructor charges the same $60.00 in Phase 1, so sorting on price would return an arbitrary order while implying a meaningful one. An unsupported `sort_by` value returns 400 rather than silently falling back.

Results are cached for 60 seconds, keyed by a hash of the query parameters.

Spec: `.kiro/specs/drivebook-marketplace/design.md`, section 5. Requirements: `requirements.md`, Requirement 7.

This service is scaffold-only. Add handlers, contracts, tests, and persistence when implementation begins.

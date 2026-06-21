# F1 HUD Feature and Provenance Reference

This file records the current implementation rather than an accuracy or product-performance promise.

## Feature matrix

| Feature | Status | Source classification | Notes |
| --- | --- | --- | --- |
| Timing tower | Implemented | OpenF1 / cached | Position order, lap durations, stints, and pits come from OpenF1. Gap timing remains unavailable when not supplied. |
| Tire strategy | Implemented | Derived / estimated | Tire age is derived from stint context; degradation and pit windows are deterministic estimates. |
| Sector analysis | Implemented | Estimated | Deterministic split model based on valid lap duration; not official sector telemetry. |
| Gap and overtake analysis | Implemented with limitations | Derived / unavailable | Requires a valid gap input. The app no longer fabricates live gaps from position order. |
| Strategy advisor | Implemented | Estimated | Deterministic fuel, pit-window, finish, risk, and what-if models. |
| Form and momentum | Implemented | Estimated | Deterministic model requiring a valid positive lap time. |
| Telemetry panel | Implemented | Estimated | Not connected to official car-data telemetry; labeled accordingly. |
| Incident tracker | Implemented | Demo simulation | Deterministic demonstration feed, not official race control. |
| Head-to-head | Implemented | Mixed OpenF1 / derived / estimated | Recent finishes use OpenF1; comparison analytics inherit their individual classifications. |
| Team radio | Implemented | Demo simulation | Deterministic transcript demonstration, not an official radio feed. |
| Weather | Implemented | Demo simulation | Deterministic weather demonstration, not an official weather feed. |
| Winner probability | Implemented | Estimated | Unofficial deterministic model; no external accuracy benchmark is claimed. |
| Track map | Implemented | OpenF1 / demo simulation | Uses location points when available and explicitly labeled simulated positions otherwise. |

## Correctness rules

- Future sessions are never selected as the current/latest race.
- Selector entries retain their actual session type.
- Completed sessions do not poll.
- Upcoming sessions do not request unavailable race details.
- OpenF1 requests are cached, deduplicated, stale-aware, and rate-limit-aware.
- Zero, negative, non-finite, stale, missing, and incomplete inputs resolve to guarded UI states.
- Estimates and simulations are deterministic for identical inputs.
- Demo-only values are visibly labeled and cannot appear as live feeds.

## Testing requirements

The maintained suite covers:

- live/completed/upcoming session selection
- Practice, Qualifying, Sprint, and Race labels
- circuit lap totals and unknown fallback
- cache hits and in-flight deduplication
- stale-while-revalidate
- `Retry-After`, exponential backoff, and global 429 cooldown
- invalid lap, time, tire, percentage, gap, and signed-value guards
- deterministic analytics and demo fixtures
- H2H success, empty, and error states
- all major analytics tabs and session-selector rendering

## Future work

Potential future additions should prioritize authoritative inputs over visual breadth:

1. Official interval/gap ingestion when a dependable endpoint is available.
2. Official race-control incident feed.
3. Official weather and car-data telemetry.
4. Persistent server-side caching and observability.
5. Measured prediction evaluation against historical datasets.
6. Expanded circuit metadata sourced from a maintained schedule dataset.

No prediction accuracy, frame-rate, latency, or engagement target is considered achieved unless it is measured by tests or data stored in this repository.

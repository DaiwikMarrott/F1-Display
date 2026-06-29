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
| Track map | Implemented with limitations | OpenF1 / cached / estimated | Uses a bounded lap trace and synchronized snapshot when valid. Completed data is latest-known, not live; invalid or collapsed snapshots fall back to an explicitly labeled deterministic estimate. |

## Correctness rules

- Future sessions are never selected as the current/latest race.
- Selector entries retain their actual session type.
- Completed sessions do not poll.
- Upcoming sessions do not request unavailable race details.
- Session-bound state clears synchronously, and stale responses cannot overwrite the selected session.
- Selected circuit identity controls the map; ambiguous country fallbacks are not used.
- OpenF1 location requests are bounded, geometry is cached per session, and markers share one stable projection with the path.
- Invalid and collapsed map coordinates are omitted.
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
- immediate session reset and out-of-order response protection
- Miami, Austin, Las Vegas, Catalunya, Madrid, and unknown circuit resolution
- bounded location URLs, geometry caching, synchronized snapshots, collapsed coordinates, partial markers, and freshness labels
- tooltip clamping/reset, keyboard marker details, Escape/outside-click selector behavior
- race, non-race, upcoming, and impossible-string UI semantics

## Future work

Potential future additions should prioritize authoritative inputs over visual breadth:

1. Full historical location replay and scrubbing.
2. Official interval/gap ingestion when a dependable endpoint is available.
3. Official race-control incident feed.
4. Official weather, radio, and car-data telemetry.
5. Persistent server-side caching and observability.
6. Measured prediction evaluation against historical datasets.
7. Expanded circuit metadata sourced from a maintained schedule dataset.

No prediction accuracy, frame-rate, latency, or engagement target is considered achieved unless it is measured by tests or data stored in this repository.

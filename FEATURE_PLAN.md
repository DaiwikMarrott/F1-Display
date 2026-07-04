# F1 HUD Feature and Provenance Reference

This file records the current implementation rather than an accuracy or product-performance promise.

## Audited implementation matrix

Audit date: 2026-07-03. “Implemented” means the current code path exists; it does not imply official accuracy. Replay status describes the baseline before the historical replay checkpoints in `complete_feature_replay_analytics`.

| Feature | Current status | Source classification | Replay status and limitations |
| --- | --- | --- | --- |
| Session catalogue and selector | Partial | OpenF1 / demo fallback | Fetches only the runtime’s current year and exposes every session as a flat option. Session keys are de-duplicated, but weekends are not normalized or grouped by season/event and official meeting names are not retained. |
| Timing tower | Partial | OpenF1 / cached | Uses latest position, lap, stint, and pit records. OpenF1 gap/interval data is not integrated. Completed sessions show final/latest records rather than state at a historical timestamp. |
| Live/replay standings | Partial | OpenF1 / cached | Live/latest order is implemented and session switching is isolated. Historical replay standings do not yet exist. |
| Track map and driver locations | Partial | OpenF1 / cached / estimated | Uses a bounded reference lap and synchronized snapshot. Completed sessions are latest-known only; deterministic path placement is explicitly estimated. No progressive historical replay exists yet. |
| Tire age and current stint | Implemented with limitations | OpenF1-derived | Derived from latest lap and stint records with non-negative guards. Completed sessions currently expose final stint state rather than replay-time state. |
| Tire degradation | Estimated | Deterministic estimate | Uses compound lifespan and tire age, not measured lap-by-lap degradation. No benchmark or official accuracy claim. |
| Tire and pit strategy | Estimated | Deterministic estimate | Pit window, pit loss, fuel, finish, risk, and scenarios are heuristics. Actual stint/pit history is displayed indirectly but does not yet drive replay-time recommendations. |
| Sector analysis | Misleadingly broad; estimated | Deterministic estimate | Splits one valid lap time into synthetic 33/40/27 sectors even though lap records can contain real sector durations. Must use real sector records when available or remain explicitly estimated/unavailable. |
| Gap and overtake analysis | Mostly unavailable for OpenF1 sessions | Derived / unavailable | The app correctly avoids fabricating gap-to-leader from position order. The heuristic model only runs when a valid numeric gap exists, which is generally demo data because `/intervals` is not integrated. |
| Winner probability | Estimated | Deterministic heuristic | Race-only display is enforced. It uses current position, gap when available, and laps remaining; completed sessions currently use final state and are not replay-aware. |
| Form and momentum | Estimated | Deterministic estimate | Builds five synthetic samples around one valid lap value. It rejects zero/invalid laps but does not yet use the driver’s actual recent lap sequence. |
| Telemetry | Demo-quality estimate | Deterministic estimate | Generates plausible speed, acceleration, and G-load values from driver identity/position. It does not consume OpenF1 `car_data` and must not be described as telemetry measurement. |
| Incident tracker | Demo-only | Deterministic demo simulation | Generates seeded events from standing patterns. OpenF1 race-control records are not integrated. |
| Team radio | Demo-only | Deterministic demo simulation | Displays generated transcript-style content; no official OpenF1 radio feed is consumed. |
| Weather | Demo-only | Deterministic demo simulation | Displays generated conditions; no official OpenF1 weather feed is consumed. |
| Head-to-head and driver comparison | Partial | Mixed OpenF1 / derived / estimated | Current-session comparison works and recent final positions come from OpenF1. Recent-race de-duplication is not season-aware, while telemetry/form/strategy comparison fields inherit their estimated status. |
| Pit notifications and position changes | Partial | OpenF1-derived | Live pit notifications and local position-change animations exist. Historical replay-time event emission does not yet exist. |
| Data provenance labels | Implemented with gaps | OpenF1 / cached / derived / estimated / demo / unavailable | Major panels are labeled, but there is no first-class historical replay provenance or centralized session mode yet. |

## Data and endpoint inventory

| OpenF1 resource | Current use | Audit result |
| --- | --- | --- |
| `sessions` | Current-year flat selector and latest-race selection | Real data, cached and rate-limit aware; needs multi-season normalization and event identity. |
| `drivers` | Standing identity and teams | Real data. |
| `position` | Latest/final order and H2H finishing positions | Real data; full-session reads are used and historical filtering is not yet centralized. |
| `laps` | Latest/best lap, current lap, map reference lap | Real data; contains sector fields that analytics currently discard. |
| `stints` | Current/final compound and tire age | Real data; needs replay-time filtering. |
| `pit` | Pit counts and live notifications | Real data; needs replay-time filtering. |
| `location` | Bounded geometry and synchronized latest marker snapshot | Real data when valid; no replay timestamp input yet. |
| `intervals` | Not used | Deferred until added through bounded replay/live access. Gap analytics must remain unavailable without it. |
| `car_data` | Not used | Telemetry remains an estimate until bounded car data is integrated. |
| `race_control` | Not used | Incidents remain demo-only until bounded records are integrated. |
| weather/radio | Not used | Panels remain demo-only; no official feed is claimed. |

## Required correction priorities

1. Normalize a 2024/2025 season and event catalogue without duplicate weekends or collapsed multi-race countries.
2. Enforce canonical circuit identity for every supported 2024/2025 event.
3. Add an explicit live/replay/completed-static/upcoming/unavailable/demo session mode and deterministic replay clock.
4. Filter positions, laps, stints, pits, and locations to records known at the replay timestamp.
5. Replace synthetic sector/form/telemetry behavior with real bounded records where practical; otherwise keep it explicitly estimated or unavailable.
6. Add replay-aware provenance and request budgets before claiming historical replay support.

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

# F1 HUD Feature and Provenance Reference

This file records the current implementation rather than an accuracy or product-performance promise.

## Audited implementation matrix

Audit date: 2026-07-04. “Implemented” means the current code path exists; it does not imply official accuracy.

| Feature | Current status | Source classification | Replay status and limitations |
| --- | --- | --- | --- |
| Session catalogue and selector | Implemented | OpenF1 / demo fallback | Loads current year, 2025, and 2024 sessions plus meetings; de-duplicates records and groups distinct sessions beneath season/event weekends. |
| Timing tower | Implemented with limitations | OpenF1 / replay / cached | Uses records known at live/replay time. Official interval/gap data is not integrated, so unsupported gaps remain unavailable. |
| Live/replay standings | Implemented | OpenF1 / historical replay | Completed sessions start from race time zero and advance position/lap/stint/pit state by timestamp rather than exposing final results immediately. |
| Track map and driver locations | Implemented with limitations | OpenF1 / replay / cached / estimated | Uses bounded lap geometry and narrow synchronized snapshots. Replay positions update in five-minute timeline buckets; sparse/collapsed data is estimated or unavailable. |
| Tire age and current stint | Implemented | OpenF1-derived / replay-derived | Derived from the stint and lap known at the current live/replay timestamp with non-negative guards. |
| Tire degradation | Estimated | Deterministic estimate | Uses compound lifespan and tire age, not measured lap-by-lap degradation. No benchmark or official accuracy claim. |
| Tire and pit strategy | Estimated | Deterministic estimate | Pit window, pit loss, fuel, finish, risk, and scenarios are heuristics. Actual stint/pit history is displayed indirectly but does not yet drive replay-time recommendations. |
| Sector analysis | Implemented when data exists | OpenF1 / historical replay | Uses actual OpenF1 sector durations from valid completed laps; unavailable when sector records are absent. |
| Gap and overtake analysis | Mostly unavailable for OpenF1 sessions | Derived / unavailable | The app correctly avoids fabricating gap-to-leader from position order. The heuristic model only runs when a valid numeric gap exists, which is generally demo data because `/intervals` is not integrated. |
| Winner probability | Estimated | Deterministic heuristic | Race-only and replay-aware; uses only current replay/live position and laps remaining. No external accuracy benchmark is claimed. |
| Form and momentum | Implemented when data exists | OpenF1-derived / replay-derived | Uses up to five valid recent completed lap records; zero and pit-out laps are excluded. |
| Telemetry | Unavailable/deferred | Unavailable | Synthetic telemetry measurements were removed. The panel remains unavailable until bounded OpenF1 `car_data` is integrated. |
| Incident tracker | Demo-only | Deterministic demo simulation | Generates seeded events from standing patterns. OpenF1 race-control records are not integrated. |
| Team radio | Demo-only | Deterministic demo simulation | Displays generated transcript-style content; no official OpenF1 radio feed is consumed. |
| Weather | Demo-only | Deterministic demo simulation | Displays generated conditions; no official OpenF1 weather feed is consumed. |
| Head-to-head and driver comparison | Implemented with limitations | Mixed OpenF1 / replay / derived / estimated | Current-session comparison and recent results work with season-aware event identity. Missing telemetry renders unavailable. |
| Pit notifications and position changes | Partial | OpenF1-derived / replay-derived | Live notifications exist; replay pit counts advance historically, but replay does not emit transient historical pit popups. |
| Data provenance labels | Implemented | Live / replay / latest-known / cached / stale / derived / estimated / demo / unavailable | Timing, map, analytics, and demo-only feeds are distinguished explicitly. |

## Feature priority map

The app intentionally mixes live OpenF1 inputs, derived analytics, replay behavior, and a few demo-style surfaces. The labels below are a planning guide for what should stay central in the product.

| Priority | Features | Notes |
| --- | --- | --- |
| Important | Session catalogue and selector, live/replay standings, timing tower, track map, replay clock, tire age/current stint, sector analysis, data provenance labels, session-bound state isolation, stale-safe request handling | These are the core HUD and correctness features. They should remain truthful, fast, and visually primary. |
| Not that important | Gap analysis, head-to-head, winner probability, form and momentum, strategy advisor, tire strategy, pit notifications | These are useful supporting views, but they should not be treated as authoritative race-control data. They can stay secondary as long as they remain clearly labeled. |
| For fun | Incident tracker, team radio, weather, demo fallback content | These add atmosphere and presentation value. They are fine to keep lightweight, playful, and clearly separated from live facts. |

## Next API integrations

The free OpenF1 data that is currently not integrated yet should be added in this order so the app gains real race context without losing its truthfulness:

1. `intervals` for real gap and overtake analysis.
	- This would replace the current mostly unavailable gap surface with authoritative interval data.
	- It also unlocks more reliable race-flow context for the timing tower and strategic analysis panels.
2. `car_data` for bounded telemetry.
	- This would turn the telemetry panel into a real measurement view with speed, throttle, brake, gear, and DRS-style signals when available.
	- The panel should continue to fall back to unavailable states whenever the endpoint or session coverage is incomplete.
3. `race_control` for incidents and flags.
	- This would replace the seeded incident tracker with official race-control events such as incidents, penalties, safety-car phases, and track-limits context.
4. weather feed coverage where OpenF1 exposes usable weather data.
	- This would let the weather panel show real session conditions instead of generated weather.
5. radio feed coverage where OpenF1 exposes usable radio data.
	- This would replace the demo transcript surface with actual team communication if the endpoint quality is sufficient.

If any of those sources are sparse or inconsistent, the app should keep the current behavior of showing a labeled unavailable or demo-only state instead of inferring values.

## Data and endpoint inventory

| OpenF1 resource | Current use | Audit result |
| --- | --- | --- |
| `sessions` / `meetings` | Multi-season grouped catalogue and latest-race selection | Real data, event/season normalized, cached, and rate-limit aware. |
| `drivers` | Standing identity and teams | Real data. |
| `position` | Live order, replay-time order, H2H finishes | Real data filtered centrally by replay timestamp. |
| `laps` | Latest/best/current lap, sectors, form, replay state, map geometry | Real data; only completed laps are visible in replay. |
| `stints` | Current compound and tire age | Real data filtered by current/replay lap. |
| `pit` | Live notifications and replay-time pit counts | Real data filtered by date/lap. |
| `location` | Live/latest and replay marker snapshots | Real bounded data with per-session geometry and replay bucket caching. |
| `intervals` | Not used | Deferred until added through bounded replay/live access. Gap analytics must remain unavailable without it. |
| `car_data` | Not used | Telemetry remains unavailable until bounded car data is integrated. |
| `race_control` | Not used | Incidents remain demo-only until bounded records are integrated. |
| weather/radio | Not used | Panels remain demo-only; no official feed is claimed. |

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
- 2024/2025 event de-duplication and cross-season circuit identity
- replay mode, deterministic clock, reset, speed, hidden-tab pause, and time cutoffs
- replay standings/laps/stints/pits, bounded replay map windows, and request buckets
- real sector/form inputs and truthful telemetry unavailability

## Future work

Potential future additions should prioritize authoritative inputs over visual breadth:

1. Official interval/gap ingestion when a dependable endpoint is available.
2. Bounded OpenF1 `car_data` telemetry.
3. Official race-control incident feed.
4. Official weather and radio feeds.
5. Frame-level replay interpolation or manual timeline scrubbing.
6. Persistent server-side caching and observability.
7. Measured prediction evaluation against historical datasets.

No prediction accuracy, frame-rate, latency, or engagement target is considered achieved unless it is measured by tests or data stored in this repository.

# F1-Display

F1-Display is a React, TypeScript, and Vite Formula 1 heads-up display. The application can show OpenF1 session data, cached replay data, deterministic estimates, and an explicit demo simulation. It labels those sources separately so simulated values are not presented as live facts.

## Data provenance

| Label | Meaning |
| --- | --- |
| `OPENF1 DATA` | A successful response from the OpenF1 API. |
| `HISTORICAL REPLAY` | OpenF1 records filtered to what was known at the selected replay timestamp. |
| `CACHED DATA` / `STALE DATA` | A previously successful response retained while offline, cooling down, or revalidating. |
| `DERIVED` | A deterministic calculation based on available race data. |
| `ESTIMATED` | A deterministic model where the required live measurement is unavailable. |
| `DEMO SIMULATION` | Seeded synthetic data used only when the app is explicitly in demo fallback mode. |
| `UNAVAILABLE` / `WAITING FOR DATA` / `NO SESSION DATA` | The app does not have enough valid information to display the metric. |

The analytics source strip above the active panel identifies whether the panel is OpenF1-backed, derived, estimated, or demo-only.

## OpenF1-backed data

- Session catalogue and session metadata
- Drivers
- Position order
- Lap durations
- Stints and tire compounds
- Pit-stop records
- Location points when the endpoint supplies them
- Recent final positions used by the head-to-head season snapshot

OpenF1 position responses used here do not provide trustworthy gap-to-leader timing. The app therefore displays unavailable gaps instead of fabricating live timing.

## Derived and estimated features

- Tire age and condition are derived from stint and lap context.
- Winner probability is an unofficial deterministic estimate.
- Sector splits use real OpenF1 lap-sector durations when present.
- Form and momentum use the driver’s valid recent lap records.
- Strategy scenarios and winner probability are deterministic estimates, not official predictions.
- Telemetry is unavailable unless bounded `car_data` is integrated; the app no longer fabricates telemetry measurements.
- Incident alerts, team radio, and weather are deterministic demo simulations and are labeled as non-live feeds.
- Track positions use one bounded OpenF1 lap trace and a narrow synchronized position snapshot when valid data is available.
- Completed sessions enter `HISTORICAL REPLAY`. Position, completed laps, standings, stints, tire age, pit counts, sectors, form, and estimates are rebuilt from records known at the replay timestamp.
- Replay map positions use a bounded synchronized historical snapshot and are labeled `REPLAY POSITIONS`.
- If OpenF1 geometry or synchronized positions are missing or collapsed, the map uses deterministic estimated positions and labels them `ESTIMATED POSITIONS`.

## Session and map behavior

- The catalogue loads the current season plus 2025 and 2024, groups sessions beneath one season/event weekend, and removes duplicate API records without collapsing Practice, Qualifying, Sprint, and Race.
- Official meeting names are joined from OpenF1 meetings. The same circuit in different seasons remains distinct, and Miami, Austin, and Las Vegas remain separate events.
- Selecting a session clears the prior session’s standings, laps, analytics, pits, map, hover, and position-change state immediately.
- Late responses from an older selection cannot overwrite the current selection.
- Circuit identity comes from the selected session’s circuit name first. Miami, Austin, Las Vegas, Catalunya, and Madrid resolve independently; unsupported circuits show an unavailable layout.
- Location history requests are bounded by driver and lap dates. Geometry is cached per session, while live marker snapshots refresh on the existing visibility-aware cadence.
- Completed sessions never poll repeatedly. Upcoming sessions render explicit no-data states and do not inherit old or demo race details.
- Map markers with invalid or collapsed coordinates are omitted rather than placed at the center.

## Historical replay

- A completed session starts at its official session start and advances on one centralized deterministic clock.
- Controls provide play/pause, reset, and 1×, 10×, 30×, 60×, and 120× speeds.
- Final results are not shown at replay time zero. Records become visible only after their historical timestamps.
- Replay location requests are grouped into five-minute replay buckets. Each marker request covers only a narrow window around that historical timestamp; geometry is loaded once from a completed lap and cached per session.
- The replay pauses while the document is hidden. Switching sessions resets the clock and request generation, preventing old replay responses from overwriting the new session.
- If historical geometry or markers are sparse/collapsed, the map truthfully falls back to `ESTIMATED POSITIONS` or unavailable.

## Reliability behavior

- Identical in-flight requests are deduplicated.
- Responses use endpoint-specific cache and stale windows.
- Stale data remains visible while a refresh runs.
- HTTP 429 responses respect `Retry-After`, use bounded exponential backoff, and establish a shared cooldown.
- Completed sessions stop polling.
- Upcoming sessions use a slow metadata cadence and do not request race details.
- Live sessions refresh on a bounded five-second cadence, while stable and heavier endpoints retain longer TTLs.
- Polling pauses when the browser tab is hidden.
- “Latest Race” selects a live Race session or the most recent completed Race; it never silently selects a future event.
- Session selector entries retain their Race, Sprint, Qualifying, or Practice identity.
- Known circuits use circuit-specific race lap totals; unknown totals remain unavailable.

## Development

Requirements:

- Node.js 20+ or 22+
- npm

Commands:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:watch
npm run test:coverage
npm run build
npm run preview
npm run check
```

`npm run check` runs typechecking, linting, the complete mocked test suite, and the production build.

Tests use Vitest, React Testing Library, jsdom, and mocked fetch functions. They do not depend on live OpenF1 availability.

## Current limitations

- OpenF1 availability and historical completeness vary by season and endpoint.
- OpenF1 location coverage can be sparse. A bounded reference lap may be unavailable even when timing data exists, causing an explicitly labeled estimated map.
- Replay is snapshot-based rather than a frame-perfect broadcast reconstruction; location markers update on bounded five-minute replay buckets.
- Circuit lap totals are maintained locally; an unknown or newly introduced circuit may show an unavailable total until metadata is added.
- The application does not ingest official weather, team radio, race-control, interval/gap, or bounded car-telemetry feeds. Those panels remain demo-only or unavailable as labeled.
- Predictions and estimates have not been benchmarked against an external accuracy dataset and must not be treated as official strategy guidance.
- Browser memory caching is not persisted between page reloads; a persistent server-side cache is deferred.
- The application is a client-side MVP and does not provide authentication, a server-side cache, or multi-user persistence.

## Architecture

- `src/services/openf1/` — cached API client, endpoint policies, polling policy, and season summary access
- `src/domain/` — calendar normalization, session modes, replay snapshots, circuit selection, and analytics provenance rules
- `src/hooks/useF1Data.ts` — React orchestration over normalized OpenF1 and demo data
- `src/hooks/useReplayClock.ts` — centralized deterministic replay controller
- `src/hooks/useAnalytics.ts` — real lap-sector/form derivation plus deterministic strategy estimates
- `src/types/dataQuality.ts` — source, freshness, availability, and error contracts
- `src/utils/formatters.ts` — guarded display formatting
- `src/components/` — presentation and interaction

See `IMPLEMENTATION_PROGRESS.md` for checkpoint history and `FEATURE_PLAN.md` for the current feature/provenance reference.

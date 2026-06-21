# F1-Display

F1-Display is a React, TypeScript, and Vite Formula 1 heads-up display. The application can show OpenF1 session data, cached replay data, deterministic estimates, and an explicit demo simulation. It labels those sources separately so simulated values are not presented as live facts.

## Data provenance

| Label | Meaning |
| --- | --- |
| `OPENF1 DATA` | A successful response from the OpenF1 API. |
| `CACHED DATA` / `STALE DATA` | A previously successful response retained while offline, cooling down, or revalidating. |
| `DERIVED` | A deterministic calculation based on available race data. |
| `ESTIMATED` | A deterministic model where the required live measurement is unavailable. |
| `DEMO SIMULATION` | Seeded synthetic data used only when the app is explicitly in demo fallback mode. |
| `UNAVAILABLE` / `WAITING FOR DATA` | The app does not have enough valid information to display the metric. |

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
- Sector splits, strategy scenarios, form, and telemetry are deterministic estimates, not official telemetry.
- Incident alerts, team radio, and weather are deterministic demo simulations and are labeled as non-live feeds.
- Track positions use OpenF1 location points when available; otherwise the map explicitly shows simulated positions.

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
- Circuit lap totals are maintained locally; an unknown or newly introduced circuit may show an unavailable total until metadata is added.
- The application does not yet ingest official weather, team radio, race-control, interval, or full car-telemetry feeds.
- Predictions and estimates have not been benchmarked against an external accuracy dataset and must not be treated as official strategy guidance.
- Browser memory caching is not persisted between page reloads.
- The application is a client-side MVP and does not provide authentication, a server-side cache, or multi-user persistence.

## Architecture

- `src/services/openf1/` — cached API client, endpoint policies, polling policy, and season summary access
- `src/domain/` — session selection and analytics provenance rules
- `src/hooks/useF1Data.ts` — React orchestration over normalized OpenF1 and demo data
- `src/hooks/useAnalytics.ts` — deterministic derived and estimated analytics
- `src/types/dataQuality.ts` — source, freshness, availability, and error contracts
- `src/utils/formatters.ts` — guarded display formatting
- `src/components/` — presentation and interaction

See `IMPLEMENTATION_PROGRESS.md` for checkpoint history and `FEATURE_PLAN.md` for the current feature/provenance reference.

# F1 HUD Analytics Implementation Progress

## Current Status

The current app shell is implemented and wired in `App.tsx` with three main layers: race data ingestion, derived analytics, and presentation tabs. The feature set now includes timing, tires, sectors, gaps, strategy, form, telemetry, incidents, head-to-head, radio, weather, winner probability, track map positioning, and pit-stop overlays.

## Implemented Feature Areas

1. Timing tower
- Shows sorted standings, gaps, fastest lap state, tire compound, and tire age.
- Uses hover tooltips for per-driver detail.

2. Tire strategy
- Computes tire age, degradation rate, condition percent, performance loss, and optimal pit lap.
- Uses compound-specific lifespan rules and a predicted pit-loss estimate.

3. Sector analysis
- Simulates sector splits from lap time and compares each sector against the leader.
- Marks sectors as purple, green, yellow, or red.

4. Gap analysis
- Calculates gap-to-leader, gap trend, DRS window eligibility, and overtake probability.
- Estimates laps until an overtake where the closing rate supports one.

5. Strategy advisor
- Produces pit-now, stay-out, monitor, and push recommendations.
- Includes risk and confidence scoring plus an optimal next-stop compound suggestion.
- Now also includes fuel burn per lap, estimated fuel remaining, lift-and-coast gain, and what-if scenario cards.

6. Form and momentum
- Uses a rolling five-lap window for average pace, consistency, momentum, and peak window.
- Distinguishes improving, stable, and declining drivers.

7. Telemetry panel
- Displays simulated top speed, average speed, acceleration, corner speed, and G-force.
- Renders the telemetry as ranked bars and compact metric chips.

8. Incident tracker and pit overlay
- `useIncidentDetection` generates simulated pit issues, spins, safety cars, and VSC events from race state.
- `IncidentTracker` separates active and resolved incidents.
- `PitStopOverlay` surfaces pit notifications and dismisses them automatically.

9. Head-to-head, team radio, and weather
- Head-to-head compares two drivers across standings and analytics, plus a season snapshot built from recent race results.
- Team radio turns race state and incidents into short broadcast-style messages and a strategy timeline.
- Weather simulates track temperature, air temperature, rain probability, and condition.

## Documentation Update Notes

- The README now captures the implementation methods used for the three newly completed features.
- The feature reference now marks Strategy Advisor, Head-to-Head, and Team Radio as implemented instead of planned.
- These updates were documented after the code changes so future work can reference the current behavior instead of the original plan wording.

10. Track map and circuit rendering
- Track positions use live location data when available.
- Fallback positioning uses SVG path sampling with `getPointAtLength()` on the selected circuit shape.
- Circuits are defined in `src/data/circuits.ts` as realistic Bézier-style approximations.

## Current Tabs

- TIMING
- TIRES
- SECTOR
- GAPS
- STRAT
- FORM
- TELEM
- ALERT
- H2H
- RADIO
- WTHR

## Data And Logic Notes

- `useF1Data` fetches sessions, latest race metadata, drivers, positions, laps, stints, pit stops, and locations.
- The hook caches session lists and completed races to reduce repeat network work.
- When OpenF1 is unavailable, the app falls back to cached data or a demo race so the UI stays populated.
- `useAnalytics` currently returns tire, sector, gap, strategy, form, and telemetry maps.
- Incident generation is intentionally separate from `useAnalytics` and lives in `useIncidentDetection`.

## Operational Notes

- OpenF1 can return HTTP 429, so the demo fallback is part of the normal runtime path.
- The dev server runs on port 5173.
- The build script is `npm run build` and the development script is `npm run dev`.

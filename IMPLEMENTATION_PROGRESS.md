# F1 HUD Implementation Progress

## Current status

The application has completed both the data-reliability hardening pass and the UI/map finishing sprint. Session state, circuit identity, bounded map data, interaction behavior, responsive layouts, and data labels are covered by mocked automated tests and browser smoke checks.

The feature/replay audit on 2026-07-03 established that completed sessions are currently final/latest-known snapshots, not historical replay. Calendar options are current-year and session-level rather than normalized multi-season events. Sector, form, strategy, winner probability, and telemetry surfaces are deterministic estimates; incidents, radio, and weather are demo-only. The audited source-by-source inventory and correction priorities are maintained in `FEATURE_PLAN.md`.

## Completed checkpoints

1. Validation foundation — `21f21ae`
   - Added compatible Vite, Vitest, Testing Library, jsdom, MSW, ESLint, coverage, typecheck, and aggregate validation scripts.
   - Removed latent TypeScript and lint failures.

2. Data provenance contracts — `110a35d`
   - Added explicit OpenF1, cached, stale, derived, estimated, demo, unavailable, loading, empty, and error states.
   - Added guarded number, lap, time, percentage, tire-age, and signed-value formatters.

3. Centralized OpenF1 access — `a2a9f1e`
   - Added request deduplication, endpoint TTLs, stale-while-revalidate, bounded retries, `Retry-After`, deterministic backoff jitter, and shared 429 cooldown.
   - Removed raw OpenF1 fetches from the main race-data hook.

4. Session and lap correctness — `a5dd0bb`
   - “Latest Race” now selects only an active or completed Race.
   - Future events remain upcoming.
   - Practice, Qualifying, Sprint, and Race labels remain distinct.
   - Known circuits use circuit-specific race lap totals.

5. Polling load reduction — `ac1810f`
   - Completed sessions no longer poll.
   - Upcoming sessions avoid detail endpoints.
   - Live sessions use a bounded cadence and endpoint cache policies.
   - Hidden tabs pause polling.

6. Invalid metric guards — `0113d63`
   - Removed negative tire-age paths, zero-second form calculations, fabricated live gaps, lap-zero labels, double-signed gains, and visible non-finite values.
   - Added truthful waiting and unavailable states.

7. Deterministic analytics — `3c83bbc`
   - Removed all `Math.random` usage.
   - Added seeded deterministic demo and estimate generation.
   - Added visible analytics provenance labels.
   - Marked unofficial probability, telemetry, radio, incident, and weather outputs honestly.

8. H2H terminal states — `eba4e0d`
   - Head-to-head now uses the shared OpenF1 client.
   - Loading resolves to success, partial, empty, or error.
   - Added retry behavior and cached request reuse.

9. Critical-flow coverage — `f715230`
   - Added application smoke coverage for all eleven tabs and the session selector.
   - The suite covers session fallback, future sessions, labels, lap counts, caching, deduplication, backoff, cooldown, invalid metrics, determinism, H2H states, and major rendering paths.

10. Documentation and release hardening
   - Updated data-source definitions, commands, limitations, and feature claims.
   - Removed unsupported accuracy targets.

## UI and map finishing sprint

1. Session-state isolation — `3e5463b`
   - Clears selected-session data synchronously and rejects stale, out-of-order responses.
   - Upcoming and missing selected sessions remain empty instead of inheriting prior or unrelated demo state.

2. Session-bound circuit identity — `02f4655`
   - Resolves circuit names before country fallbacks and distinguishes Miami, Austin, Las Vegas, Catalunya, and Madrid.
   - Unsupported circuits show an explicit unavailable layout.

3. Bounded OpenF1 map projection — `a754bde`
   - Uses a driver/date-bounded reference lap, a narrow synchronized marker snapshot, and one shared projection.
   - Caches geometry per session, rejects collapsed coordinates, and labels live, latest-known, cached, stale, estimated, demo, and unavailable states.

4. Stable interactions — `6c43b58`
   - Clamps tooltips to the viewport, resets stale hover state, adds keyboard-accessible markers and visible focus, and supports Escape/outside-click selector dismissal.

5. Responsive and session-aware UI — `200f510`
   - Removes fixed-width panel overflow at 1280×720, 1024×768, and 768px.
   - Adds a compact desktop layout, responsive tire cards, stable map sizing, namespaced timing/standings styles, and non-race/upcoming semantics.

6. Regression coverage and truthful release documentation — `test: cover session map and polished UI flows` (this commit)
   - Expands focused coverage for map freshness, partial location snapshots, session-remount history, and impossible rendered strings.
   - Updates release documentation to match implemented behavior and deferred scope.

## Data-source summary

- Real OpenF1: sessions, drivers, positions, laps, stints, pits, locations, recent finishing positions.
- Cached/stale: any previously successful OpenF1 response retained within its policy window or while revalidation is unavailable.
- Derived: tire state, race progress, winner estimate, and comparisons computed from available data.
- Estimated: sectors, strategy, form, and telemetry models where direct measurements are unavailable.
- Demo-only: fallback standings, incidents, radio transcript, and weather simulation.
- Unavailable: invalid, missing, future, incomplete, or unsupported metrics.

For the map specifically, completed OpenF1 positions are `LATEST KNOWN`, not live. Invalid, sparse, or collapsed location data produces an explicitly labeled deterministic estimate or unavailable state.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run check
npm audit
git diff --check
```

The tests use fixtures and mocked requests rather than the real OpenF1 service.

## Remaining limitations

- No official interval/gap feed is currently integrated.
- Weather, radio, incidents, and full telemetry remain explicitly labeled simulations or estimates.
- Full map replay/scrubbing is not implemented; the map shows a synchronized snapshot.
- The cache is in-memory and browser-local; a persistent server-side cache is deferred.
- Unknown circuit lap counts remain unavailable.
- No externally validated prediction-accuracy dataset is included.

# F1 HUD Implementation Progress

## Current status

The application has completed both the data-reliability hardening pass and the UI/map finishing sprint. Session state, circuit identity, bounded map data, interaction behavior, responsive layouts, and data labels are covered by mocked automated tests and browser smoke checks.

The historical replay and analytics correctness sprint is complete. Completed sessions now replay timestamped OpenF1 records; calendar options are grouped across current year, 2025, and 2024; sectors/form use real lap records; unsupported telemetry, intervals, incidents, radio, and weather remain explicitly unavailable or demo-only.

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

6. Regression coverage and truthful release documentation — `2180911`
   - Expands focused coverage for map freshness, partial location snapshots, session-remount history, and impossible rendered strings.
   - Updates release documentation to match implemented behavior and deferred scope.

## Data-source summary

- Real OpenF1: sessions, drivers, positions, laps, stints, pits, locations, recent finishing positions.
- Cached/stale: any previously successful OpenF1 response retained within its policy window or while revalidation is unavailable.
- Derived: tire state, race progress, winner estimate, and comparisons computed from available data.
- Estimated: tire degradation, strategy scenarios, winner probability, and map placement when synchronized coordinates are unavailable.
- OpenF1-derived: sector analysis and form/momentum when valid completed lap records exist.
- Demo-only: fallback standings, incidents, radio transcript, and weather simulation.
- Unavailable: invalid, missing, future, incomplete, or unsupported metrics.

For the map specifically, completed OpenF1 positions are `REPLAY POSITIONS`, not live. Invalid, sparse, or collapsed location data produces an explicitly labeled deterministic estimate or unavailable state.

## Feature replay and analytics sprint

1. Feature inventory — `82fd5ef`
   - Audited every documented analytical surface and recorded real, derived, estimated, demo-only, unavailable, and deferred behavior.
2. Season/event catalogue — `4b0282a`
   - Added current-year/2025/2024 session and meeting loading, duplicate-safe event grouping, and season-aware labels.
3. Canonical circuit identity — `a3554ca`
   - Added complete 2024/2025 circuit aliases including Imola and safe event-name fallback without ambiguous country substitution.
4. Replay mode and clock — `2b9ce8a`
   - Added live/replay/completed-static/upcoming/unavailable/demo modes and deterministic play/pause/reset/speed controls.
5. Timeline-driven race state — `4b8afd5`
   - Rebuilt standings, laps, stints, pits, tire state, probability, and map positions from records known at replay time.
6. Analytics correctness — `3e5845c`
   - Replaced synthetic sectors/form with real lap records, removed synthetic telemetry, and made H2H/replay provenance truthful.
7. Request budgets — `175a58b`
   - Added replay buckets, immutable historical cache windows, hidden-tab pause, session-aware reuse, and endpoint policy coverage.
8. End-to-end coverage and release documentation — `test: cover replay calendar and analytics behavior`
   - Locks down calendar, replay, map, analytics, provenance, request, and impossible-value behavior and reconciles release documentation.

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
- Weather, radio, and incidents remain explicitly labeled deterministic simulations.
- Telemetry and official gaps remain unavailable until bounded `car_data` and interval sources are integrated.
- Replay uses synchronized five-minute location buckets rather than frame-level interpolation or manual scrubbing.
- The cache is in-memory and browser-local; a persistent server-side cache is deferred.
- Unknown circuit lap counts remain unavailable.
- No externally validated prediction-accuracy dataset is included.

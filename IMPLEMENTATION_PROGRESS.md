# F1 HUD Data Reliability Progress

## Current status

The application has completed a data-reliability hardening pass focused on truthful UX, bounded OpenF1 usage, deterministic analytics, terminal error states, and automated verification.

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

## Data-source summary

- Real OpenF1: sessions, drivers, positions, laps, stints, pits, locations, recent finishing positions.
- Cached: any previously successful OpenF1 response within its stale window.
- Derived: tire state, race progress, winner estimate, and comparisons computed from available data.
- Estimated: sectors, strategy, form, and telemetry models where direct measurements are unavailable.
- Demo-only: fallback standings, incidents, radio transcript, and weather simulation.
- Unavailable: invalid, missing, future, incomplete, or unsupported metrics.

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
- The cache is in-memory and browser-local.
- Unknown circuit lap counts remain unavailable.
- No externally validated prediction-accuracy dataset is included.

# F1-Display

F1-Display is a React + Vite heads-up display for Formula 1 race analysis. It combines live OpenF1 data, cached race sessions, and simulated analytics so the app stays usable in live mode, replay mode, and API-limited demo mode.

## What the app shows

- Top bar: session name, live/demo state, lap counter, race selector, and error status.
- Left rail: winner probability and live standings.
- Center stage: circuit-aware track map with hover tooltips.
- Right rail: tabbed analytics for timing, tires, sectors, gaps, strategy, form, telemetry, incidents, head-to-head, team radio, and weather.
- Overlay: pit-stop notifications that auto-dismiss after a short delay.

## Data Flow

1. `useF1Data` fetches sessions, selects a target race, and loads drivers, positions, laps, stints, pit stops, and location points.
2. When the API is unavailable, the hook falls back to cached race data or a deterministic demo race so the UI remains populated.
3. `useAnalytics` derives tire, sector, gap, strategy, form, and telemetry views from the standings and lap context.
4. `useIncidentDetection` generates incident records for the Alerts tab.
5. Presentational components render the derived data directly, keeping calculation logic in hooks and display logic in the UI components.

## Core Implementation Methods

- Tire strategy: compound lifespan rules, degradation curves, optimal pit lap estimation, and predicted pit-loss time.
- Sector analysis: lap split simulation from the current lap time, sector deltas, and colored sector status flags.
- Gap analysis: gap trend, DRS window detection, overtake probability, and laps-until-overtake estimation.
- Strategy advice: pit-now, stay-out, monitor, or push recommendations with risk and confidence scores.
- Form and momentum: rolling five-lap averages, consistency scoring, momentum score, and peak-performance window.
- Telemetry panel: simulated top speed, average speed, acceleration, corner speed, and G-force metrics.
- Track map: real location points when available, otherwise SVG path sampling with `getPointAtLength()`.
- Winner probability: position, gap, and laps-remaining scoring normalized into top-five probability bars.
- Team radio and weather: simulated messages and weather states derived from the current race state.

## Local Development

- Install dependencies with `npm install`.
- Start the dev server with `npm run dev`.
- Build production assets with `npm run build`.
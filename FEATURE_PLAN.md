# F1 HUD Feature Reference

## Overview
Adding modern, dynamic features to create a data-driven pit wall analyst experience that engages users with real-time strategic insights.

## Current Status Update

The following items from the original plan are now implemented in the app and documented in the progress log:

- Strategy Recommendation Engine: fuel burn estimates, fuel remaining, lift-and-coast gain, and what-if scenario cards are now in `StrategyAdvisor.tsx`.
- Head-to-Head Comparison: recent-race season snapshot data is now shown in `HeadToHead.tsx`.
- Team Radio Highlights: transcript-style radio messages and a strategy changes log are now shown in `TeamRadio.tsx`.

Implementation methods used:

- Strategy recommendation was extended in the analytics hook, then rendered as additional metrics and scenario cards.
- Head-to-head now loads recent race results for the selected drivers and summarizes finishing positions across those sessions.
- Team radio now labels each call by source and orders messages chronologically to read like a transcript.

## Phase 1: Core Analytics Features (Priority 1)

### 1. Tire Strategy & Degradation Panel
**Goal**: Show tire compound, age, performance impact, and optimal pit stop windows
**Components**:
- TireStrategy.tsx - Main panel showing tire info for all drivers
- Tire age indicator with visual degradation
- Compound color coding (Soft=Red, Medium=Yellow, Hard=White)
- Pit stop window predictions (optimal lap range to pit)
- Tire life remaining percentage visualization

**Data Used**: currentStint (compound), tireAge, lastLap times, bestLap
**Visual**: Horizontal progress bars, color-coded badges, animated indicators

---

### 2. Sector Analysis Dashboard
**Goal**: Show S1/S2/S3 times to identify strong/weak corners
**Components**:
- SectorAnalysis.tsx - Break down lap into sectors
- Per-driver sector comparison
- Fastest sector indicators (purple times)
- Relative sector performance (-0.3s vs leader)
- Sector-by-sector trend charts

**Data Used**: Laps API data (split times when available), position changes
**Visual**: 3-column layout with mini charts, color gradient (green=fast, red=slow)

---

### 3. Gap Analysis & Overtake Predictor
**Goal**: Show gap trends and predict overtakes within 2-3 laps
**Components**:
- GapAnalysis.tsx - Real-time gap tracking and prediction
- Gap trend visualization (narrowing/widening) with arrows
- Overtake prediction algorithm (gap closing rate)
- DRS window detection (within 1 second of lead car)
- Chase/Defend strategy recommendations

**Data Used**: Position data, lap times, gapToLeader
**Visual**: Animated gap indicators, trend arrows, overtake probability meter

---

### 4. Strategy Recommendation Engine
**Goal**: Suggest pit strategies and race finishes
**Components**:
- StrategyAdvisor.tsx - Real-time strategy recommendations
- Pit stop window calculator
- Fuel consumption estimator
- Race finish position prediction
- "What-if" scenario simulations

**Status**: Implemented

**Method Used**: Extended the strategy analytics model with fuel burn, fuel remaining, and scenario objects, then rendered them as extra metrics and what-if cards.

**Data Used**: currentLap, totalLaps, pitCount, compound, tireAge
**Visual**: Recommendation cards, strategy tree visualization

---

### 5. Real-time Driver Form & Momentum
**Goal**: Show driver performance trends and momentum indicators
**Components**:
- FormIndicator.tsx - Driver form/momentum visualization
- Last 5-lap average trend
- Momentum indicator (improving/declining)
- Consistency metric (variance)
- Peak performance window indicator

**Data Used**: lastLap, bestLap, historical lap data
**Visual**: Spark charts, trend indicators, momentum gauge

---

### 6. Telemetry Mini Dashboard
**Goal**: Compare braking, acceleration, top speed across drivers
**Components**:
- TelemetryCompare.tsx - Quick telemetry comparison
- Braking zone identification
- Top speed ranking
- Acceleration comparison
- G-force indicators

**Data Used**: Location data (can infer from position coordinates), simulated telemetry
**Visual**: Radar charts, bar comparisons, heatmaps

---

### 7. Safety & Incident Tracker
**Goal**: Real-time incident detection and safety alerts
**Components**:
- IncidentTracker.tsx - Detect incidents, crashes, VSC/SC
- Timeline of incidents
- Affected drivers
- VSC/Safety Car impact analysis
- Alert notifications

**Data Used**: Position gaps (sudden changes), pit stops (unplanned)
**Visual**: Timeline, alert banners, incident markers on track

---

## Phase 2: Advanced Features (Priority 2)

### 8. Head-to-Head Comparison
- SelectableDrivers comparison overlay
- Detailed telemetry comparison
- Season-to-date stats vs real-time race

**Status**: Implemented

**Method Used**: Loaded recent race position data for the selected drivers, summarized their finishing history, and displayed the resulting season snapshot in the comparison panel.

### 9. Team Radio Highlights
- Key pit calls transcript
- Driver communication timeline
- Strategy changes log

**Status**: Implemented

**Method Used**: Structured the generated messages into a transcript with source labels and added a strategy changes timeline for the most relevant calls.

### 10. Weather Impact Analysis
- Track condition display
- Rain probability prediction
- Weather-based strategy changes

---

## Implementation Order (Context Window Safe)

**Commit Cycle 1**: Tire Strategy Panel
- Create TireStrategy component
- Integrate with existing data
- Add pit window calculation
- Test and commit

**Commit Cycle 2**: Sector Analysis
- Create SectorAnalysis component
- Fetch/simulate sector data
- Add visualization
- Test and commit

**Commit Cycle 3**: Gap Analysis & Overtake Predictor
- Create GapAnalysis component
- Implement gap trend calculation
- DRS window detection
- Overtake prediction
- Test and commit

**Commit Cycle 4**: Strategy Advisor
- Create StrategyAdvisor component
- Pit stop optimizer
- Fuel calculator
- Scenario simulator
- Test and commit

**Commit Cycle 5**: Form & Momentum
- Create FormIndicator component
- Lap trend analysis
- Consistency calculation
- Test and commit

**Commit Cycle 6**: Telemetry Dashboard
- Create TelemetryCompare component
- Braking/accel analysis
- Top speed comparison
- Test and commit

**Commit Cycle 7**: Safety & Incidents
- Create IncidentTracker component
- Incident detection logic
- Timeline visualization
- Test and commit

---

## Data Pipeline

### Current Available Data:
- standings (position, gaps, lap times, tire info)
- session (track, conditions)
- currentLap / totalLaps
- location (x, y coordinates)

### New Data to Calculate:
- Sector times (from lap duration and position timeline)
- Fuel consumption rate (from lap time increases)
- Tire degradation rate (from lap time delta)
- Gap trends (from historical gap data)
- Overtake probability (from gap closing rate)
- Driver momentum (from last N laps)

### Simulation Strategy:
For API endpoints not available, we'll simulate realistic data based on F1 patterns:
- Tire degradation: 0.1-0.3s per lap
- Fuel effect: 0.05-0.1s per lap
- Sector distribution: S1=33%, S2=40%, S3=27%
- DRS activation: within 1.0s of car ahead

---

## UI/UX Approach

### Layout Enhancements:
1. Expand center area with collapsible/tabbed panels
2. Add mini-panels in top info bar
3. Hover cards with detailed analysis
4. Right-click driver for detailed view
5. Timeline scrubber for replaying race

### Design Philosophy:
- Data-dense but scannable
- Color-coded for quick understanding
- Animated transitions for trends
- Real-time updates with smooth animations
- F1-style aesthetic (grid, red accents, data typography)

---

## Technical Implementation

### New Components:
```
src/components/
  ├── analytics/
  │   ├── TireStrategy.tsx
  │   ├── SectorAnalysis.tsx
  │   ├── GapAnalysis.tsx
  │   ├── StrategyAdvisor.tsx
  │   ├── FormIndicator.tsx
  │   ├── TelemetryCompare.tsx
  │   └── IncidentTracker.tsx
  └── analytics/
      └── [corresponding .css files]
```

### New Hooks:
```
src/hooks/
  ├── useAnalytics.ts - Main analytics engine
  ├── useSectorAnalysis.ts - Sector calculations
  ├── useOvertakePrediction.ts - Overtake logic
  ├── useStrategyCalculator.ts - Strategy optimizer
  └── useIncidentDetection.ts - Incident detection
```

### New Types:
```
src/types/
  └── analytics.ts
    ├── TireAnalysis
    ├── SectorData
    ├── GapTrend
    ├── StrategyRecommendation
    ├── DriverForm
    ├── TelemetryData
    └── Incident
```

---

## Success Metrics

✅ Real-time data accuracy (matches official F1 data within 0.1%)
✅ Prediction accuracy (overtakes predicted 80%+ of time)
✅ User engagement (users interact with 3+ different panels per race)
✅ Performance (smooth 60fps animations, <100ms data updates)
✅ Responsive (all features work on laptop screens)

---

## Context Window Checkpoints

When context resets, reference these commits:
- `Tire Strategy Panel` - Base for all analytics
- `Sector Analysis` - Foundation for performance comparisons
- `Gap & Overtake` - Core prediction engine
- `Strategy Advisor` - Decision support system

Each commit is self-contained and can be referenced independently.

---

## Start Date: May 2, 2026
## Estimated Completion: 4-5 context windows

---

import { describe, expect, it } from 'vitest';
import type { DriverStanding } from '../types/f1';
import { calculateAnalytics } from './useAnalytics';

const standing: DriverStanding = {
  driver: {
    driver_number: 16,
    broadcast_name: 'C LECLERC',
    full_name: 'Charles Leclerc',
    name_acronym: 'LEC',
    team_name: 'Ferrari',
    team_colour: 'E8002D',
    session_key: 1,
  },
  position: 2,
  gapToLeader: '+0.850',
  lastLap: 91.4,
  bestLap: 90.9,
  isFastestLap: false,
  currentStint: {
    driver_number: 16,
    stint_number: 1,
    lap_start: 1,
    lap_end: null,
    compound: 'MEDIUM',
    tyre_age_at_start: 0,
    session_key: 1,
    meeting_key: 1,
  },
  tireAge: 12,
  pitCount: 0,
  location: null,
  winProbability: 25,
};

function serialise(result: ReturnType<typeof calculateAnalytics>) {
  return {
    tires: [...result.tireAnalysis.entries()],
    sectors: [...result.sectors.entries()],
    gaps: [...result.gapTrends.entries()],
    strategies: [...result.strategies.entries()],
    form: [...result.formData.entries()],
    telemetry: [...result.telemetry.entries()],
  };
}

describe('deterministic analytics', () => {
  it('returns stable output for identical inputs', () => {
    const first = serialise(calculateAnalytics([standing], 20, 66));
    const second = serialise(calculateAnalytics([standing], 20, 66));

    expect(second).toEqual(first);
  });

  it('does not create estimates from invalid lap data', () => {
    const result = calculateAnalytics([{
      ...standing,
      lastLap: 0,
      bestLap: null,
      gapToLeader: '—',
      currentStint: null,
    }], 0, 0);

    expect(result.sectors.size).toBe(0);
    expect(result.gapTrends.size).toBe(0);
    expect(result.formData.size).toBe(0);
    expect(result.strategies.size).toBe(0);
  });
});

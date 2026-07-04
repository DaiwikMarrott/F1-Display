import { describe, expect, it } from 'vitest';
import type { Driver, Lap, PitStop, Position, Stint } from '../types/f1';
import type { ReplayDataset } from './replaySnapshot';
import { buildReplaySnapshot } from './replaySnapshot';

const driver: Driver = {
  driver_number: 1,
  broadcast_name: 'TEST DRIVER',
  full_name: 'Test Driver',
  name_acronym: 'TST',
  team_name: 'Test',
  team_colour: 'FFFFFF',
  session_key: 1,
};

const positions: Position[] = [
  { driver_number: 1, position: 5, date: '2025-05-25T13:00:05Z', session_key: 1, meeting_key: 1 },
  { driver_number: 1, position: 2, date: '2025-05-25T13:10:00Z', session_key: 1, meeting_key: 1 },
  { driver_number: 1, position: 1, date: '2025-05-25T14:59:00Z', session_key: 1, meeting_key: 1 },
];

const laps: Lap[] = [
  {
    driver_number: 1,
    lap_number: 1,
    lap_duration: 90,
    duration_sector_1: 30,
    duration_sector_2: 35,
    duration_sector_3: 25,
    i1_speed: null,
    i2_speed: null,
    st_speed: null,
    date_start: '2025-05-25T13:00:10Z',
    is_pit_out_lap: false,
    session_key: 1,
    meeting_key: 1,
  },
  {
    driver_number: 1,
    lap_number: 20,
    lap_duration: 90,
    duration_sector_1: 30,
    duration_sector_2: 35,
    duration_sector_3: 25,
    i1_speed: null,
    i2_speed: null,
    st_speed: null,
    date_start: '2025-05-25T13:33:00Z',
    is_pit_out_lap: false,
    session_key: 1,
    meeting_key: 1,
  },
  {
    driver_number: 1,
    lap_number: 70,
    lap_duration: 88,
    duration_sector_1: 29,
    duration_sector_2: 34,
    duration_sector_3: 25,
    i1_speed: null,
    i2_speed: null,
    st_speed: null,
    date_start: '2025-05-25T14:58:00Z',
    is_pit_out_lap: false,
    session_key: 1,
    meeting_key: 1,
  },
];

const stints: Stint[] = [
  { driver_number: 1, stint_number: 1, lap_start: 1, lap_end: 20, compound: 'SOFT', tyre_age_at_start: 0, session_key: 1, meeting_key: 1 },
  { driver_number: 1, stint_number: 2, lap_start: 21, lap_end: null, compound: 'HARD', tyre_age_at_start: 0, session_key: 1, meeting_key: 1 },
];

const pits: PitStop[] = [
  { driver_number: 1, lap_number: 20, pit_duration: 22, date: '2025-05-25T13:35:00Z', session_key: 1, meeting_key: 1 },
];

const dataset: ReplayDataset = {
  drivers: [driver],
  positions,
  laps,
  stints,
  pits,
  partial: false,
};

describe('replay snapshot', () => {
  it('does not expose final-only state at replay start', () => {
    const snapshot = buildReplaySnapshot(dataset, '2025-05-25T13:00:00Z', 70);
    expect(snapshot.standings).toEqual([]);
    expect(snapshot.currentLap).toBe(0);
  });

  it('advances positions and laps only after their historical timestamps', () => {
    const early = buildReplaySnapshot(dataset, '2025-05-25T13:01:45Z', 70);
    expect(early.currentLap).toBe(1);
    expect(early.standings[0]).toMatchObject({
      position: 5,
      pitCount: 0,
      currentStint: { compound: 'SOFT' },
    });

    const later = buildReplaySnapshot(dataset, '2025-05-25T13:40:00Z', 70);
    expect(later.standings[0]).toMatchObject({ position: 2, pitCount: 1 });
    expect(later.standings[0].position).not.toBe(1);
  });
});

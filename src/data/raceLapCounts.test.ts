import { describe, expect, it } from 'vitest';
import type { Session } from '../types/f1';
import { getRaceLapCount } from './raceLapCounts';

function race(circuit: string, sessionType = 'Race'): Session {
  return {
    session_key: 1,
    session_name: sessionType,
    session_type: sessionType,
    status: 'completed',
    date_start: '2026-01-01T00:00:00Z',
    date_end: '2026-01-01T02:00:00Z',
    circuit_short_name: circuit,
    country_name: 'Test',
    year: 2026,
    meeting_key: 1,
  };
}

describe('race lap counts', () => {
  it('returns circuit-specific totals', () => {
    expect(getRaceLapCount(race('Catalunya'))).toBe(66);
    expect(getRaceLapCount(race('Monaco'))).toBe(78);
    expect(getRaceLapCount(race('Spa-Francorchamps'))).toBe(44);
  });

  it('returns null for unknown circuits and non-race sessions', () => {
    expect(getRaceLapCount(race('Madring'))).toBeNull();
    expect(getRaceLapCount(race('Catalunya', 'Practice 1'))).toBeNull();
  });
});

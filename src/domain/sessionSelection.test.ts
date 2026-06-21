import { describe, expect, it } from 'vitest';
import type { Session } from '../types/f1';
import {
  getSessionDisplayLabel,
  isRaceSession,
  normalizeSessionType,
  selectCurrentOrLatestRace,
} from './sessionSelection';

const NOW = Date.parse('2026-06-20T12:00:00Z');

function session(overrides: Partial<Session>): Session {
  return {
    session_key: 1,
    session_name: 'Race',
    session_type: 'Race',
    status: '',
    date_start: '2026-06-01T12:00:00Z',
    date_end: '2026-06-01T14:00:00Z',
    circuit_short_name: 'Catalunya',
    country_name: 'Spain',
    year: 2026,
    meeting_key: 1,
    ...overrides,
  };
}

describe('session selection', () => {
  it('never selects a future race as latest', () => {
    const completed = session({ session_key: 10 });
    const future = session({
      session_key: 20,
      country_name: 'United Arab Emirates',
      status: 'completed',
      date_start: '2026-12-06T13:00:00Z',
      date_end: '2026-12-06T15:00:00Z',
    });

    expect(selectCurrentOrLatestRace([future, completed], NOW)?.session_key).toBe(10);
  });

  it('prefers an active race over the last completed race', () => {
    const active = session({
      session_key: 30,
      status: 'started',
      date_start: '2026-06-20T11:00:00Z',
      date_end: '2026-06-20T13:00:00Z',
    });

    expect(selectCurrentOrLatestRace([session({ session_key: 10 }), active], NOW)?.session_key).toBe(30);
  });

  it('does not treat practice or qualifying as a race', () => {
    const practice = session({ session_type: 'Practice', session_name: 'Practice 1' });
    const qualifying = session({ session_type: 'Qualifying', session_name: 'Qualifying' });

    expect(isRaceSession(practice)).toBe(false);
    expect(isRaceSession(qualifying)).toBe(false);
    expect(normalizeSessionType(practice)).toBe('Practice 1');
    expect(normalizeSessionType(qualifying)).toBe('Qualifying');
  });

  it('labels sprint and upcoming sessions explicitly', () => {
    expect(normalizeSessionType(session({ session_type: 'Sprint', session_name: 'Sprint' }))).toBe('Sprint');
    expect(getSessionDisplayLabel(session({
      date_start: '2026-12-06T13:00:00Z',
      date_end: '2026-12-06T15:00:00Z',
    }), NOW)).toBe('Race · UPCOMING');
  });
});

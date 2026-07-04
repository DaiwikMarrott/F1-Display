import { describe, expect, it } from 'vitest';
import type { Session } from '../types/f1';
import { getSessionMode, getSessionModeLabel } from './sessionMode';

const NOW = Date.parse('2025-06-01T12:00:00Z');

function session(overrides: Partial<Session>): Session {
  return {
    session_key: 1,
    meeting_key: 1,
    session_name: 'Race',
    session_type: 'Race',
    status: '',
    date_start: '2025-06-01T10:00:00Z',
    date_end: '2025-06-01T11:30:00Z',
    circuit_short_name: 'Monaco',
    country_name: 'Monaco',
    ...overrides,
  };
}

describe('session mode', () => {
  it('classifies live, completed replay, and upcoming sessions', () => {
    expect(getSessionMode(session({
      status: 'active',
      date_end: '2025-06-01T13:00:00Z',
    }), undefined, NOW)).toBe('live');
    expect(getSessionMode(session({}), undefined, NOW)).toBe('replay');
    expect(getSessionMode(session({
      date_start: '2025-07-01T10:00:00Z',
      date_end: '2025-07-01T11:30:00Z',
    }), undefined, NOW)).toBe('upcoming');
    expect(getSessionMode(session({
      status: 'completed',
      date_start: 'invalid',
      date_end: 'invalid',
    }), undefined, NOW)).toBe('completed-static');
  });

  it('keeps demo and unavailable modes explicit', () => {
    expect(getSessionMode(null, { provenance: 'demo' }, NOW)).toBe('demo');
    expect(getSessionMode(null, { provenance: 'unavailable' }, NOW)).toBe('unavailable');
    expect(getSessionModeLabel('replay')).toBe('HISTORICAL REPLAY');
  });
});

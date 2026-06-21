import { describe, expect, it } from 'vitest';
import type { Session } from '../../types/f1';
import { getSessionPollingInterval } from './pollingPolicy';

const NOW = Date.parse('2026-06-20T12:00:00Z');

function session(overrides: Partial<Session> = {}): Session {
  return {
    session_key: 1,
    session_name: 'Race',
    session_type: 'Race',
    status: '',
    date_start: '2026-06-20T11:00:00Z',
    date_end: '2026-06-20T13:00:00Z',
    circuit_short_name: 'Test',
    country_name: 'Test',
    meeting_key: 1,
    ...overrides,
  };
}

describe('OpenF1 polling policy', () => {
  it('uses bounded polling only for live sessions', () => {
    expect(getSessionPollingInterval(session(), NOW)).toBe(5_000);
  });

  it('does not poll completed sessions', () => {
    expect(getSessionPollingInterval(session({
      date_start: '2026-06-01T11:00:00Z',
      date_end: '2026-06-01T13:00:00Z',
    }), NOW)).toBeNull();
  });

  it('uses a slow metadata cadence for upcoming sessions', () => {
    expect(getSessionPollingInterval(session({
      date_start: '2026-12-01T11:00:00Z',
      date_end: '2026-12-01T13:00:00Z',
    }), NOW)).toBe(300_000);
  });
});

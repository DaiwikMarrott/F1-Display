import { describe, expect, it } from 'vitest';
import type { Session } from '../types/f1';
import {
  buildSessionCatalogue,
  getCatalogueSessionLabel,
  normalizeSessionRecords,
} from './sessionCatalogue';

const NOW = Date.parse('2025-08-01T12:00:00Z');

function session(overrides: Partial<Session>): Session {
  return {
    session_key: 1,
    meeting_key: 10,
    year: 2025,
    meeting_name: 'Japanese Grand Prix',
    session_name: 'Race',
    session_type: 'Race',
    status: 'completed',
    date_start: '2025-04-06T05:00:00Z',
    date_end: '2025-04-06T07:00:00Z',
    circuit_short_name: 'Suzuka',
    country_name: 'Japan',
    ...overrides,
  };
}

describe('session catalogue', () => {
  it('de-duplicates repeated records while retaining distinct session types', () => {
    const race = session({});
    const practice = session({
      session_key: 2,
      session_name: 'Practice 1',
      session_type: 'Practice',
      date_start: '2025-04-04T02:30:00Z',
      date_end: '2025-04-04T03:30:00Z',
    });

    const records = normalizeSessionRecords([race, { ...race }, practice, { ...practice }]);
    expect(records.map(record => record.session_key)).toEqual([1, 2]);

    const [event] = buildSessionCatalogue(records, NOW);
    expect(event.eventName).toBe('Japanese Grand Prix');
    expect(event.sessions.map(record => record.session_name)).toEqual(['Practice 1', 'Race']);
  });

  it('keeps Suzuka once per season event and separates 2024 from 2025', () => {
    const events = buildSessionCatalogue([
      session({}),
      session({ session_key: 2, session_name: 'Qualifying', session_type: 'Qualifying' }),
      session({
        session_key: 3,
        meeting_key: 20,
        year: 2024,
        date_start: '2024-04-07T05:00:00Z',
        date_end: '2024-04-07T07:00:00Z',
      }),
    ], NOW);

    expect(events).toHaveLength(2);
    expect(events.map(event => event.year)).toEqual([2025, 2024]);
    expect(events.every(event => event.circuitShortName === 'Suzuka')).toBe(true);
  });

  it('keeps Miami, Austin, and Las Vegas as distinct United States events', () => {
    const events = buildSessionCatalogue([
      session({ meeting_key: 30, session_key: 30, country_name: 'United States', circuit_short_name: 'Miami', meeting_name: 'Miami Grand Prix' }),
      session({ meeting_key: 31, session_key: 31, country_name: 'United States', circuit_short_name: 'Austin', meeting_name: 'United States Grand Prix' }),
      session({ meeting_key: 32, session_key: 32, country_name: 'United States', circuit_short_name: 'Las Vegas', meeting_name: 'Las Vegas Grand Prix' }),
    ], NOW);

    expect(events.map(event => event.circuitShortName).sort()).toEqual(['Austin', 'Las Vegas', 'Miami']);
  });

  it('labels season, event, circuit, session type, and upcoming state', () => {
    const upcoming = session({
      session_name: 'Sprint Qualifying',
      session_type: 'Sprint Qualifying',
      date_start: '2099-04-06T05:00:00Z',
      date_end: '2099-04-06T06:00:00Z',
    });

    expect(getCatalogueSessionLabel(upcoming, NOW)).toContain(
      '2025 · Japan · Suzuka · Japanese Grand Prix · Sprint Qualifying · UPCOMING',
    );
  });
});

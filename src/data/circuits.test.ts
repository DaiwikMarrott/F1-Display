import { describe, expect, it } from 'vitest';
import type { Session } from '../types/f1';
import {
  getCircuitByCountry,
  getCircuitForSession,
} from './circuits';

function session(circuit: string, country: string): Session {
  return {
    session_key: 1,
    meeting_key: 1,
    session_name: 'Race',
    session_type: 'Race',
    status: 'completed',
    date_start: '2026-06-01T12:00:00Z',
    date_end: '2026-06-01T14:00:00Z',
    circuit_short_name: circuit,
    country_name: country,
  };
}

describe('session circuit resolution', () => {
  it('resolves United States circuits independently', () => {
    expect(getCircuitForSession(session('Miami', 'United States'))?.id).toBe('miami');
    expect(getCircuitForSession(session('Austin', 'United States'))?.id).toBe('austin');
    expect(getCircuitForSession(session('Las Vegas', 'United States'))?.id).toBe('las-vegas');
    expect(getCircuitByCountry('United States')).toBeNull();
  });

  it('resolves Barcelona and Madrid independently', () => {
    expect(getCircuitForSession(session('Catalunya', 'Spain'))?.id).toBe('spain');
    expect(getCircuitForSession(session('Madring', 'Spain'))?.id).toBe('madrid');
    expect(getCircuitByCountry('Spain')).toBeNull();
  });

  it('does not substitute an unrelated circuit for an unknown session', () => {
    expect(getCircuitForSession(session('Imaginary Ring', 'United States'))).toBeNull();
  });
});

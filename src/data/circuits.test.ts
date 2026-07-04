import { describe, expect, it } from 'vitest';
import type { Session } from '../types/f1';
import {
  getAllCircuits,
  getCircuitByCountry,
  getCircuitByEventName,
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

  it('covers every canonical 2024 and 2025 circuit identity', () => {
    const expected: Record<string, string> = {
      Sakhir: 'bahrain',
      Jeddah: 'saudi-arabia',
      Melbourne: 'australia',
      Suzuka: 'japan',
      Shanghai: 'china',
      Miami: 'miami',
      Imola: 'imola',
      'Monte Carlo': 'monaco',
      Montreal: 'canada',
      Catalunya: 'spain',
      Spielberg: 'austria',
      Silverstone: 'silverstone',
      Hungaroring: 'hungary',
      'Spa-Francorchamps': 'belgium',
      Zandvoort: 'netherlands',
      Monza: 'monza',
      Baku: 'azerbaijan',
      'Marina Bay': 'singapore',
      Austin: 'austin',
      'Mexico City': 'mexico',
      Interlagos: 'brazil',
      'Las Vegas': 'las-vegas',
      Lusail: 'qatar',
      'Yas Marina Circuit': 'abu-dhabi',
    };

    for (const [shortName, id] of Object.entries(expected)) {
      expect(getCircuitForSession(session(shortName, 'Unknown'))?.id).toBe(id);
    }
  });

  it('uses official event names only as a safe secondary identity', () => {
    expect(getCircuitByEventName('FORMULA 1 JAPANESE GRAND PRIX 2025')?.id).toBe('japan');
    expect(getCircuitByEventName('Emilia Romagna Grand Prix')?.id).toBe('imola');
    expect(getCircuitByEventName('United States Grand Prix')?.id).toBe('austin');
    expect(getCircuitForSession({
      ...session('Unknown', 'Italy'),
      meeting_name: 'Italian Grand Prix',
    })?.id).toBe('monza');
    expect(getCircuitByCountry('Italy')).toBeNull();
  });

  it('has one unique canonical id and name per layout', () => {
    const circuits = getAllCircuits();
    expect(new Set(circuits.map(circuit => circuit.id)).size).toBe(circuits.length);
    expect(new Set(circuits.map(circuit => circuit.name)).size).toBe(circuits.length);
  });
});

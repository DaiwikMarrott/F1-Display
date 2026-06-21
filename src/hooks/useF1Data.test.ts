import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Driver, Session } from '../types/f1';
import { getOpenF1Data } from '../services/openf1/client';
import { INITIAL_TRACK_MAP_DATA } from '../types/map';
import { buildDemoStandings, useF1Data } from './useF1Data';

vi.mock('../services/openf1/client', () => ({
  getOpenF1Data: vi.fn(),
}));

vi.mock('../services/openf1/location', () => ({
  loadSessionLocationMap: vi.fn().mockResolvedValue(INITIAL_TRACK_MAP_DATA),
}));

function session(overrides: Partial<Session>): Session {
  return {
    session_key: 1,
    session_name: 'Race',
    session_type: 'Race',
    status: 'completed',
    date_start: '2026-06-01T12:00:00Z',
    date_end: '2026-06-01T14:00:00Z',
    circuit_short_name: 'Catalunya',
    country_name: 'Spain',
    year: 2026,
    meeting_key: 1,
    ...overrides,
  };
}

function driver(sessionKey: number, acronym: string): Driver {
  return {
    driver_number: sessionKey,
    broadcast_name: `${acronym} DRIVER`,
    full_name: `${acronym} Driver`,
    name_acronym: acronym,
    team_name: 'Test Team',
    team_colour: 'FFFFFF',
    session_key: sessionKey,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(next => {
    resolve = next;
  });
  return { promise, resolve };
}

function installSessionMock(sessions: Session[], delayedDrivers?: Map<number, Promise<Driver[]>>) {
  vi.mocked(getOpenF1Data).mockImplementation(async path => {
    if (path.startsWith('/sessions?')) return sessions;
    const key = Number(new URLSearchParams(path.split('?')[1]).get('session_key'));
    if (path.startsWith('/drivers?')) {
      return delayedDrivers?.get(key) ?? [driver(key, key === 1 ? 'ESP' : 'MON')];
    }
    return [];
  });
}

describe('demo race data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is seeded and deterministic for the same lap', () => {
    expect(buildDemoStandings(20)).toEqual(buildDemoStandings(20));
  });

  it('changes predictably when the demo lap advances', () => {
    expect(buildDemoStandings(21)).not.toEqual(buildDemoStandings(20));
  });

  it('clears previous session data immediately when switching sessions', async () => {
    const sessions = [
      session({ session_key: 1 }),
      session({
        session_key: 2,
        meeting_key: 2,
        country_name: 'Monaco',
        circuit_short_name: 'Monte Carlo',
        date_start: '2026-05-25T12:00:00Z',
        date_end: '2026-05-25T14:00:00Z',
      }),
    ];
    const monacoDrivers = deferred<Driver[]>();
    installSessionMock(sessions, new Map([[2, monacoDrivers.promise]]));

    const { result } = renderHook(() => useF1Data());
    await waitFor(() => expect(result.current.standings[0]?.driver.name_acronym).toBe('ESP'));

    act(() => result.current.setSelectedRaceKey(2));

    expect(result.current.session?.session_key).toBe(2);
    expect(result.current.standings).toEqual([]);
    expect(result.current.currentLap).toBe(0);
    expect(result.current.pitNotifications).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('ignores a late response from an older selected session', async () => {
    const spainDrivers = deferred<Driver[]>();
    const monacoDrivers = deferred<Driver[]>();
    const sessions = [
      session({ session_key: 1 }),
      session({
        session_key: 2,
        meeting_key: 2,
        country_name: 'Monaco',
        circuit_short_name: 'Monte Carlo',
        date_start: '2026-06-08T12:00:00Z',
        date_end: '2026-06-08T14:00:00Z',
      }),
    ];
    installSessionMock(sessions, new Map([
      [1, spainDrivers.promise],
      [2, monacoDrivers.promise],
    ]));

    const { result } = renderHook(() => useF1Data());
    await waitFor(() => expect(result.current.availableRaces).toHaveLength(2));

    act(() => result.current.setSelectedRaceKey(1));
    act(() => result.current.setSelectedRaceKey(2));
    await act(async () => {
      monacoDrivers.resolve([driver(2, 'MON')]);
    });
    await waitFor(() => expect(result.current.standings[0]?.driver.name_acronym).toBe('MON'));

    await act(async () => {
      spainDrivers.resolve([driver(1, 'ESP')]);
    });

    expect(result.current.session?.session_key).toBe(2);
    expect(result.current.standings[0]?.driver.name_acronym).toBe('MON');
  });

  it('keeps upcoming and missing selections empty instead of entering demo mode', async () => {
    const upcoming = session({
      session_key: 3,
      meeting_key: 3,
      country_name: 'United States',
      circuit_short_name: 'Las Vegas',
      date_start: '2099-11-01T12:00:00Z',
      date_end: '2099-11-01T14:00:00Z',
    });
    installSessionMock([session({ session_key: 1 }), upcoming]);

    const { result } = renderHook(() => useF1Data());
    await waitFor(() => expect(result.current.availableRaces).toHaveLength(2));

    act(() => result.current.setSelectedRaceKey(3));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.standings).toEqual([]);
    expect(result.current.dataQuality.provenance).toBe('unavailable');

    act(() => result.current.setSelectedRaceKey(999));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.standings).toEqual([]);
    expect(result.current.dataQuality.availability).toBe('error');
    expect(result.current.dataQuality.provenance).not.toBe('demo');
  });
});

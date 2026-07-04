import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '../types/f1';
import {
  advanceReplayClock,
  createReplayClockState,
  useReplayClock,
} from './useReplayClock';

function session(key: number, circuit = 'Monaco'): Session {
  return {
    session_key: key,
    meeting_key: key,
    session_name: 'Race',
    session_type: 'Race',
    status: 'completed',
    date_start: '2025-05-25T13:00:00Z',
    date_end: '2025-05-25T15:00:00Z',
    circuit_short_name: circuit,
    country_name: circuit,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('replay clock', () => {
  it('advances deterministically and stops at the session end', () => {
    const initial = createReplayClockState(session(1), 'replay', 10);
    const advanced = advanceReplayClock(initial, 1_000);
    expect(advanced.elapsedMs).toBe(10_000);
    expect(advanced.timestamp).toBe('2025-05-25T13:00:10.000Z');

    const complete = advanceReplayClock(advanced, 24 * 60 * 60 * 1_000);
    expect(complete.progress).toBe(100);
    expect(complete.isPlaying).toBe(false);
  });

  it('resets timestamp and identity when the selected completed session changes', () => {
    vi.useFakeTimers();
    const japan = session(1, 'Suzuka');
    const monaco = {
      ...session(2, 'Monaco'),
      date_start: '2024-05-26T13:00:00Z',
      date_end: '2024-05-26T15:00:00Z',
    };
    const { result, rerender } = renderHook(
      ({ selected }) => useReplayClock(selected, 'replay'),
      { initialProps: { selected: japan } },
    );

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.elapsedMs).toBe(60_000);

    rerender({ selected: monaco });
    expect(result.current.sessionKey).toBe(2);
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.timestamp).toBe('2024-05-26T13:00:00.000Z');
  });
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '../types/f1';
import type {
  ReplayClockState,
  ReplayController,
  SessionMode,
} from '../types/replay';

const DEFAULT_REPLAY_DURATION_MS = 2 * 60 * 60 * 1_000;
const DEFAULT_REPLAY_SPEED = 60;
const TICK_MS = 1_000;

function parsedTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function createReplayClockState(
  session: Session | null,
  mode: SessionMode,
  speed = DEFAULT_REPLAY_SPEED,
): ReplayClockState {
  if (!session || mode !== 'replay') {
    return {
      sessionKey: session?.session_key ?? null,
      startMs: null,
      endMs: null,
      timestamp: null,
      elapsedMs: 0,
      durationMs: 0,
      progress: 0,
      isPlaying: false,
      speed,
    };
  }

  const startMs = parsedTimestamp(session.date_start);
  const parsedEnd = parsedTimestamp(session.date_end);
  if (startMs === null) {
    return {
      sessionKey: session.session_key,
      startMs: null,
      endMs: null,
      timestamp: null,
      elapsedMs: 0,
      durationMs: 0,
      progress: 0,
      isPlaying: false,
      speed,
    };
  }
  const endMs = parsedEnd !== null && parsedEnd > startMs
    ? parsedEnd
    : startMs + DEFAULT_REPLAY_DURATION_MS;

  return {
    sessionKey: session.session_key,
    startMs,
    endMs,
    timestamp: new Date(startMs).toISOString(),
    elapsedMs: 0,
    durationMs: endMs - startMs,
    progress: 0,
    isPlaying: true,
    speed,
  };
}

export function advanceReplayClock(
  state: ReplayClockState,
  realElapsedMs: number,
): ReplayClockState {
  if (!state.isPlaying || state.startMs === null || state.durationMs <= 0) return state;
  const elapsedMs = Math.min(
    state.durationMs,
    state.elapsedMs + Math.max(0, realElapsedMs) * state.speed,
  );
  const complete = elapsedMs >= state.durationMs;
  return {
    ...state,
    elapsedMs,
    timestamp: new Date(state.startMs + elapsedMs).toISOString(),
    progress: Math.min(100, (elapsedMs / state.durationMs) * 100),
    isPlaying: !complete,
  };
}

export function formatReplayElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(value => String(value).padStart(2, '0'))
    .join(':');
}

export function useReplayClock(
  session: Session | null,
  mode: SessionMode,
): ReplayController {
  const initial = useMemo(
    () => createReplayClockState(session, mode),
    [mode, session],
  );
  const [state, setState] = useState<ReplayClockState>(initial);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  useEffect(() => {
    if (mode !== 'replay' || !state.isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setState(current => advanceReplayClock(current, TICK_MS));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [mode, state.isPlaying, state.sessionKey]);

  const play = useCallback(() => {
    setState(current => current.elapsedMs < current.durationMs
      ? { ...current, isPlaying: true }
      : current);
  }, []);
  const pause = useCallback(() => {
    setState(current => ({ ...current, isPlaying: false }));
  }, []);
  const reset = useCallback(() => {
    setState(createReplayClockState(session, mode, state.speed));
  }, [mode, session, state.speed]);
  const setSpeed = useCallback((speed: number) => {
    if (!Number.isFinite(speed) || speed <= 0) return;
    setState(current => ({ ...current, speed: Math.min(120, speed) }));
  }, []);

  return {
    ...state,
    play,
    pause,
    reset,
    setSpeed,
  };
}

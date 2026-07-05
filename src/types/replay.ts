export type SessionMode =
  | 'live'
  | 'replay'
  | 'completed-static'
  | 'upcoming'
  | 'unavailable'
  | 'demo';

export interface ReplayClockState {
  sessionKey: number | null;
  startMs: number | null;
  endMs: number | null;
  timestamp: string | null;
  elapsedMs: number;
  durationMs: number;
  progress: number;
  isPlaying: boolean;
  speed: number;
}

export interface ReplayController extends ReplayClockState {
  play: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
}

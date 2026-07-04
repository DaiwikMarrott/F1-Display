import type { DataQuality } from '../types/dataQuality';
import type { Session } from '../types/f1';
import type { SessionMode } from '../types/replay';
import { getSessionPhase } from './sessionSelection';

export function getSessionMode(
  session: Session | null,
  quality?: Pick<DataQuality, 'provenance'>,
  now = Date.now(),
): SessionMode {
  if (quality?.provenance === 'demo') return 'demo';
  if (!session) return 'unavailable';

  switch (getSessionPhase(session, now)) {
    case 'live':
      return 'live';
    case 'completed':
      return Number.isFinite(Date.parse(session.date_start))
        ? 'replay'
        : 'completed-static';
    case 'upcoming':
      return 'upcoming';
    case 'unknown':
      return 'completed-static';
  }
}

export function getSessionModeLabel(mode: SessionMode): string {
  switch (mode) {
    case 'live':
      return 'LIVE';
    case 'replay':
      return 'HISTORICAL REPLAY';
    case 'completed-static':
      return 'LATEST KNOWN';
    case 'upcoming':
      return 'UPCOMING';
    case 'demo':
      return 'DEMO SIMULATION';
    default:
      return 'UNAVAILABLE';
  }
}

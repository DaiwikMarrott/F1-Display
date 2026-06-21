import type { Session } from '../../types/f1';
import { getSessionPhase } from '../../domain/sessionSelection';

const SECOND = 1_000;
const MINUTE = 60 * SECOND;

export function getSessionPollingInterval(
  session: Session | null,
  now = Date.now(),
): number | null {
  if (!session) return 60 * SECOND;

  switch (getSessionPhase(session, now)) {
    case 'live':
      return 5 * SECOND;
    case 'upcoming':
      return 5 * MINUTE;
    case 'unknown':
      return 60 * SECOND;
    case 'completed':
      return null;
  }
}

import type { Session } from '../types/f1';

export type SessionPhase = 'live' | 'completed' | 'upcoming' | 'unknown';

function timestamp(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeSessionType(session: Pick<Session, 'session_type' | 'session_name'>): string {
  const value = `${session.session_type ?? ''} ${session.session_name ?? ''}`.toLowerCase();
  if (value.includes('sprint') && value.includes('qual')) return 'Sprint Qualifying';
  if (value.includes('sprint')) return 'Sprint';
  if (value.includes('qual')) return 'Qualifying';
  if (value.includes('practice')) return session.session_name || 'Practice';
  if (value.includes('race')) return 'Race';
  return session.session_name || session.session_type || 'Session';
}

export function isRaceSession(session: Pick<Session, 'session_type' | 'session_name'>): boolean {
  return normalizeSessionType(session) === 'Race';
}

export function getSessionPhase(session: Session, now = Date.now()): SessionPhase {
  const startsAt = timestamp(session.date_start);
  const endsAt = timestamp(session.date_end);
  if (startsAt !== null && startsAt > now) return 'upcoming';

  const status = session.status?.toLowerCase();
  if (status === 'started' || status === 'active' || status === 'live') return 'live';
  if (status === 'completed' || status === 'finished' || status === 'ended') return 'completed';

  if (startsAt !== null && startsAt <= now && (endsAt === null || endsAt > now)) return 'live';
  if (endsAt !== null && endsAt <= now) return 'completed';
  return 'unknown';
}

export function selectCurrentOrLatestRace(
  sessions: Session[],
  now = Date.now(),
): Session | null {
  const races = sessions.filter(isRaceSession);
  const live = races
    .filter(session => getSessionPhase(session, now) === 'live')
    .sort((a, b) => (timestamp(b.date_start) ?? 0) - (timestamp(a.date_start) ?? 0));
  if (live[0]) return live[0];

  return races
    .filter(session => getSessionPhase(session, now) === 'completed')
    .sort((a, b) => (timestamp(b.date_start) ?? 0) - (timestamp(a.date_start) ?? 0))[0] ?? null;
}

export function getSessionOptions(sessions: Session[], now = Date.now()): Session[] {
  const seen = new Set<number>();
  return [...sessions]
    .filter(session => {
      if (seen.has(session.session_key)) return false;
      seen.add(session.session_key);
      return true;
    })
    .sort((a, b) => {
      const phaseOrder: Record<SessionPhase, number> = {
        live: 0,
        completed: 1,
        upcoming: 2,
        unknown: 3,
      };
      const phaseDifference = phaseOrder[getSessionPhase(a, now)] - phaseOrder[getSessionPhase(b, now)];
      if (phaseDifference !== 0) return phaseDifference;
      return (timestamp(b.date_start) ?? 0) - (timestamp(a.date_start) ?? 0);
    });
}

export function getSessionDisplayLabel(session: Session, now = Date.now()): string {
  const phase = getSessionPhase(session, now);
  const phaseLabel = phase === 'upcoming' ? ' · UPCOMING' : phase === 'live' ? ' · LIVE' : '';
  return `${normalizeSessionType(session)}${phaseLabel}`;
}

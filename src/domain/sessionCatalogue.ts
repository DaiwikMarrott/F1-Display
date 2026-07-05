import type { Meeting, Session } from '../types/f1';
import {
  getSessionDisplayLabel,
  getSessionPhase,
  normalizeSessionType,
} from './sessionSelection';
import type { SessionPhase } from './sessionSelection';

export interface SessionCatalogueEvent {
  id: string;
  year: number;
  meetingKey: number;
  eventName: string;
  officialName: string | null;
  countryName: string;
  circuitShortName: string;
  location: string | null;
  dateStart: string;
  phase: SessionPhase;
  sessions: Session[];
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sessionYear(session: Session): number {
  return session.year ?? new Date(session.date_start).getUTCFullYear();
}

function richerSession(current: Session, candidate: Session): Session {
  const currentScore = [
    current.meeting_name,
    current.meeting_official_name,
    current.location,
    current.country_code,
  ].filter(Boolean).length;
  const candidateScore = [
    candidate.meeting_name,
    candidate.meeting_official_name,
    candidate.location,
    candidate.country_code,
  ].filter(Boolean).length;
  return candidateScore > currentScore ? candidate : current;
}

export function normalizeSessionRecords(sessions: Session[]): Session[] {
  const bySessionKey = new Map<number, Session>();
  for (const session of sessions) {
    if (!Number.isFinite(session.session_key) || !Number.isFinite(session.meeting_key)) continue;
    const normalized = { ...session, year: sessionYear(session) };
    const existing = bySessionKey.get(session.session_key);
    bySessionKey.set(
      session.session_key,
      existing ? richerSession(existing, normalized) : normalized,
    );
  }

  const byStableIdentity = new Map<string, Session>();
  for (const session of bySessionKey.values()) {
    const identity = [
      session.year,
      session.meeting_key,
      normalizeSessionType(session),
      session.date_start,
    ].join(':');
    const existing = byStableIdentity.get(identity);
    byStableIdentity.set(identity, existing ? richerSession(existing, session) : session);
  }
  return [...byStableIdentity.values()];
}

export function enrichSessionsWithMeetings(
  sessions: Session[],
  meetings: Meeting[],
): Session[] {
  const meetingByKey = new Map(meetings.map(meeting => [meeting.meeting_key, meeting]));
  return normalizeSessionRecords(sessions).map(session => {
    const meeting = meetingByKey.get(session.meeting_key);
    if (!meeting) return session;
    return {
      ...session,
      year: session.year ?? meeting.year,
      meeting_name: meeting.meeting_name,
      meeting_official_name: meeting.meeting_official_name,
      location: meeting.location,
      circuit_key: session.circuit_key ?? meeting.circuit_key,
      country_code: session.country_code ?? meeting.country_code,
    };
  });
}

function eventPhase(sessions: Session[], now: number): SessionPhase {
  const phases = sessions.map(session => getSessionPhase(session, now));
  if (phases.includes('live')) return 'live';
  if (phases.every(phase => phase === 'upcoming')) return 'upcoming';
  if (phases.some(phase => phase === 'completed')) return 'completed';
  return 'unknown';
}

export function buildSessionCatalogue(
  sessions: Session[],
  now = Date.now(),
): SessionCatalogueEvent[] {
  const grouped = new Map<string, Session[]>();
  for (const session of normalizeSessionRecords(sessions)) {
    const id = `${sessionYear(session)}:${session.meeting_key}`;
    const group = grouped.get(id) ?? [];
    group.push(session);
    grouped.set(id, group);
  }

  return [...grouped.entries()]
    .map(([id, eventSessions]): SessionCatalogueEvent => {
      const ordered = [...eventSessions].sort((a, b) => timestamp(a.date_start) - timestamp(b.date_start));
      const representative = ordered.find(session => normalizeSessionType(session) === 'Race')
        ?? ordered[ordered.length - 1];
      const year = sessionYear(representative);
      return {
        id,
        year,
        meetingKey: representative.meeting_key,
        eventName: representative.meeting_name || `${representative.country_name} Grand Prix`,
        officialName: representative.meeting_official_name ?? null,
        countryName: representative.country_name,
        circuitShortName: representative.circuit_short_name,
        location: representative.location ?? null,
        dateStart: ordered[0].date_start,
        phase: eventPhase(ordered, now),
        sessions: ordered,
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return timestamp(b.dateStart) - timestamp(a.dateStart);
    });
}

export function getCatalogueSessionLabel(session: Session, now = Date.now()): string {
  const year = sessionYear(session);
  const eventName = session.meeting_name || `${session.country_name} Grand Prix`;
  return [
    year,
    session.country_name,
    session.circuit_short_name,
    eventName,
    getSessionDisplayLabel(session, now),
  ].join(' · ');
}

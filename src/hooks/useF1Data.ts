import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Driver,
  Position,
  Lap,
  Stint,
  PitStop,
  Session,
  DriverStanding,
  PitNotification,
  Meeting,
} from '../types/f1';
import type { DataQuality } from '../types/dataQuality';
import { createDataQuality, INITIAL_DATA_QUALITY } from '../types/dataQuality';
import type { TrackMapData } from '../types/map';
import { INITIAL_TRACK_MAP_DATA } from '../types/map';
import type { ReplayController, SessionMode } from '../types/replay';
import { getOpenF1Data } from '../services/openf1/client';
import { loadSessionLocationMap } from '../services/openf1/location';
import {
  getSessionPhase,
  isRaceSession,
  selectCurrentOrLatestRace,
} from '../domain/sessionSelection';
import { getRaceLapCount } from '../data/raceLapCounts';
import { getSessionPollingInterval } from '../services/openf1/pollingPolicy';
import { deterministicRange } from '../utils/deterministic';
import { fulfilledArray, hasRejected } from '../services/openf1/settled';
import {
  plausiblePitDuration,
  shouldEmitPitNotifications,
} from '../domain/pitNotifications';
import {
  enrichSessionsWithMeetings,
  normalizeSessionRecords,
} from '../domain/sessionCatalogue';
import { getSessionMode } from '../domain/sessionMode';
import { useReplayClock } from './useReplayClock';

function formatGap(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds === 0) return 'LEADER';
  return `+${seconds.toFixed(3)}`;
}

function calcWinProbability(position: number, gapSeconds: number, lapsRemaining: number): number {
  const posScore = 1 / Math.pow(position, 1.5);
  const gapPenalty = Math.min(gapSeconds * 0.02, 0.5);
  const lapFactor = Math.max(0.1, lapsRemaining / 60);
  const raw = (posScore - gapPenalty) * lapFactor;
  return Math.max(0, raw);
}

const DEMO_LAPS_REMAINING = 30;

function applyWinProbabilities(items: DriverStanding[], lapsRemaining: number): DriverStanding[] {
  const rawScores = items.map(s => {
    const gapSec = s.gapToLeader === 'LEADER' ? 0
      : parseFloat(s.gapToLeader.replace('+', '')) || 0;
    return calcWinProbability(s.position, gapSec, lapsRemaining);
  });
  const total = rawScores.reduce((a, b) => a + b, 0) || 1;
  return items.map((s, i) => ({ ...s, winProbability: (rawScores[i] / total) * 100 }));
}

const DEMO_DRIVERS: Driver[] = [
  { driver_number: 1, broadcast_name: 'M VERSTAPPEN', full_name: 'Max Verstappen', name_acronym: 'VER', team_name: 'Red Bull Racing', team_colour: '3671C6', session_key: 0 },
  { driver_number: 16, broadcast_name: 'C LECLERC', full_name: 'Charles Leclerc', name_acronym: 'LEC', team_name: 'Ferrari', team_colour: 'E8002D', session_key: 0 },
  { driver_number: 44, broadcast_name: 'L HAMILTON', full_name: 'Lewis Hamilton', name_acronym: 'HAM', team_name: 'Ferrari', team_colour: 'E8002D', session_key: 0 },
  { driver_number: 63, broadcast_name: 'G RUSSELL', full_name: 'George Russell', name_acronym: 'RUS', team_name: 'Mercedes', team_colour: '00D2BE', session_key: 0 },
  { driver_number: 4, broadcast_name: 'L NORRIS', full_name: 'Lando Norris', name_acronym: 'NOR', team_name: 'McLaren', team_colour: 'FF8000', session_key: 0 },
  { driver_number: 81, broadcast_name: 'O PIASTRI', full_name: 'Oscar Piastri', name_acronym: 'PIA', team_name: 'McLaren', team_colour: 'FF8000', session_key: 0 },
  { driver_number: 14, broadcast_name: 'F ALONSO', full_name: 'Fernando Alonso', name_acronym: 'ALO', team_name: 'Aston Martin', team_colour: '358C75', session_key: 0 },
  { driver_number: 18, broadcast_name: 'L STROLL', full_name: 'Lance Stroll', name_acronym: 'STR', team_name: 'Aston Martin', team_colour: '358C75', session_key: 0 },
  { driver_number: 10, broadcast_name: 'P GASLY', full_name: 'Pierre Gasly', name_acronym: 'GAS', team_name: 'Alpine', team_colour: '0093CC', session_key: 0 },
  { driver_number: 31, broadcast_name: 'E OCON', full_name: 'Esteban Ocon', name_acronym: 'OCO', team_name: 'Alpine', team_colour: '0093CC', session_key: 0 },
  { driver_number: 23, broadcast_name: 'A ALBON', full_name: 'Alexander Albon', name_acronym: 'ALB', team_name: 'Williams', team_colour: '64C4FF', session_key: 0 },
  { driver_number: 2, broadcast_name: 'L SARGEANT', full_name: 'Logan Sargeant', name_acronym: 'SAR', team_name: 'Williams', team_colour: '64C4FF', session_key: 0 },
  { driver_number: 22, broadcast_name: 'Y TSUNODA', full_name: 'Yuki Tsunoda', name_acronym: 'TSU', team_name: 'RB', team_colour: '6692FF', session_key: 0 },
  { driver_number: 3, broadcast_name: 'D RICCIARDO', full_name: 'Daniel Ricciardo', name_acronym: 'RIC', team_name: 'RB', team_colour: '6692FF', session_key: 0 },
  { driver_number: 20, broadcast_name: 'K MAGNUSSEN', full_name: 'Kevin Magnussen', name_acronym: 'MAG', team_name: 'Haas F1 Team', team_colour: 'B6BABD', session_key: 0 },
  { driver_number: 27, broadcast_name: 'N HULKENBERG', full_name: 'Nico Hülkenberg', name_acronym: 'HUL', team_name: 'Haas F1 Team', team_colour: 'B6BABD', session_key: 0 },
  { driver_number: 24, broadcast_name: 'G ZHOU', full_name: 'Guanyu Zhou', name_acronym: 'ZHO', team_name: 'Kick Sauber', team_colour: 'C92D4B', session_key: 0 },
  { driver_number: 77, broadcast_name: 'V BOTTAS', full_name: 'Valtteri Bottas', name_acronym: 'BOT', team_name: 'Kick Sauber', team_colour: 'C92D4B', session_key: 0 },
  { driver_number: 55, broadcast_name: 'C SAINZ', full_name: 'Carlos Sainz', name_acronym: 'SAI', team_name: 'Williams', team_colour: '64C4FF', session_key: 0 },
  { driver_number: 87, broadcast_name: 'O BEARMAN', full_name: 'Oliver Bearman', name_acronym: 'BEA', team_name: 'Haas F1 Team', team_colour: 'B6BABD', session_key: 0 },
];

export function buildDemoStandings(currentLap: number = 14): DriverStanding[] {
  const compounds: Stint['compound'][] = ['SOFT', 'MEDIUM', 'HARD', 'SOFT', 'MEDIUM'];
  const raw = DEMO_DRIVERS.map((driver, idx) => {
    // Simulate realistic gaps that grow as laps progress
    const position = idx + 1;
    const baseGap = idx === 0 ? 0 : idx * 1.1;
    // Gap grows slightly as race progresses (some drivers drop back)
    const lapFactor = (currentLap - 14) * 0.1;
    const gapSec = baseGap + lapFactor
      + deterministicRange(0, 1.5, driver.driver_number, currentLap, 'demo-gap');

    // Simulate lap times that vary slightly
    const baseLapTime = 90 + idx * 0.3;
    const lapVariation = Math.sin(currentLap * 0.3 + idx) * 0.8;
    const lastLap = baseLapTime + lapVariation;

    const compound = compounds[idx % compounds.length];
    const tireAge = Math.floor((currentLap - 10) / 2) + (idx % 3);

    return {
      driver,
      position,
      gapToLeader: formatGap(gapSec),
      lastLap,
      bestLap: baseLapTime - 0.8
        + deterministicRange(0, 0.2, driver.driver_number, currentLap, 'demo-best-lap'),
      isFastestLap: idx === 3 && currentLap > 20,
      currentStint: {
        driver_number: driver.driver_number,
        stint_number: 2,
        lap_start: 10,
        lap_end: null,
        compound,
        tyre_age_at_start: 0,
        session_key: 0,
        meeting_key: 0,
      },
      tireAge: Math.max(1, tireAge),
      pitCount: idx % 3 === 0 ? 1 : 0,
      location: null,
      winProbability: 0,
    };
  });
  return applyWinProbabilities(raw, DEMO_LAPS_REMAINING);
}

export interface F1DataState {
  standings: DriverStanding[];
  session: Session | null;
  currentLap: number;
  totalLaps: number;
  pitNotifications: PitNotification[];
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  dismissPitNotification: (id: string) => void;
  availableRaces: Session[];
  selectedRaceKey: number | null;
  setSelectedRaceKey: (key: number | null) => void;
  dataQuality: DataQuality;
  mapData: TrackMapData;
  sessionMode: SessionMode;
  replay: ReplayController;
}

export function useF1Data(): F1DataState {
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [currentLap, setCurrentLap] = useState(0);
  const [totalLaps, setTotalLaps] = useState(0);
  const [pitNotifications, setPitNotifications] = useState<PitNotification[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableRaces, setAvailableRaces] = useState<Session[]>([]);
  const [selectedRaceKey, setSelectedRaceKeyState] = useState<number | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality>(INITIAL_DATA_QUALITY);
  const [mapData, setMapData] = useState<TrackMapData>(INITIAL_TRACK_MAP_DATA);
  const sessionMode = getSessionMode(session, dataQuality);
  const replay = useReplayClock(session, sessionMode);

  // Caching references
  const sessionListCacheRef = useRef<Session[] | null>(null);
  const raceDataCacheRef = useRef<Map<number, {
    standings: DriverStanding[];
    maxLap: number;
    totalLaps: number;
    mapData: TrackMapData;
  }>>(new Map());
  const requestGenerationRef = useRef(0);

  const prevPitDataRef = useRef<Map<number, number>>(new Map());
  const prevPitSessionKeyRef = useRef<number | null>(null);
  const standingsRef = useRef<DriverStanding[]>([]);
  standingsRef.current = standings;
  const demoLapRef = useRef(14);

  const dismissPitNotification = useCallback((id: string) => {
    setPitNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const setSelectedRaceKey = useCallback((key: number | null) => {
    requestGenerationRef.current += 1;
    setSelectedRaceKeyState(key);
    setSession(key === null
      ? null
      : availableRaces.find(candidate => candidate.session_key === key) ?? null);
    setStandings([]);
    setCurrentLap(0);
    setTotalLaps(0);
    setPitNotifications([]);
    setIsLive(false);
    setIsLoading(true);
    setError(null);
    setDataQuality(INITIAL_DATA_QUALITY);
    setMapData(INITIAL_TRACK_MAP_DATA);
    prevPitDataRef.current = new Map();
    prevPitSessionKeyRef.current = null;
  }, [availableRaces]);

  const fetchData = useCallback(async () => {
    const requestGeneration = requestGenerationRef.current;
    const isCurrentRequest = () => requestGeneration === requestGenerationRef.current;

    try {
      // 1. Fetch or use the normalized multi-season session catalogue.
      let sessionsResp: Session[] = [];
      if (sessionListCacheRef.current) {
        sessionsResp = sessionListCacheRef.current;
      } else {
        try {
          const currentYear = new Date().getFullYear();
          const catalogueYears = [...new Set([currentYear, 2025, 2024])];
          const [sessionBatches, meetingBatches] = await Promise.all([
            Promise.allSettled(
              catalogueYears.map(year => getOpenF1Data<Session[]>(`/sessions?year=${year}`)),
            ),
            Promise.allSettled(
              catalogueYears.map(year => getOpenF1Data<Meeting[]>(`/meetings?year=${year}`)),
            ),
          ]);
          if (!isCurrentRequest()) return;
          const sessionRows = sessionBatches.flatMap(fulfilledArray);
          const meetingRows = meetingBatches.flatMap(fulfilledArray);
          if (sessionRows.length === 0 && sessionBatches.every(result => result.status === 'rejected')) {
            throw new Error('OpenF1 session catalogue is unavailable');
          }
          sessionsResp = enrichSessionsWithMeetings(sessionRows, meetingRows);
          if (sessionsResp.length > 0) {
            sessionListCacheRef.current = sessionsResp;
          }
        } catch (e) {
          console.warn('Failed to fetch sessions, injecting fallback DEMO races:', e);
          sessionsResp = [
            { session_key: 9158, meeting_name: 'Bahrain Grand Prix', session_name: 'Race', session_type: 'Race', status: 'completed', date_start: '2024-03-02T15:00:00', date_end: '2024-03-02T17:00:00', circuit_short_name: 'Sakhir', country_name: 'Bahrain', year: 2024, meeting_key: 1229 },
            { session_key: 9166, meeting_name: 'Saudi Arabian Grand Prix', session_name: 'Race', session_type: 'Race', status: 'completed', date_start: '2024-03-09T17:00:00', date_end: '2024-03-09T19:00:00', circuit_short_name: 'Jeddah', country_name: 'Saudi Arabia', year: 2024, meeting_key: 1230 },
            { session_key: 9173, meeting_name: 'Australian Grand Prix', session_name: 'Race', session_type: 'Race', status: 'completed', date_start: '2024-03-24T04:00:00', date_end: '2024-03-24T06:00:00', circuit_short_name: 'Melbourne', country_name: 'Australia', year: 2024, meeting_key: 1231 },
          ];
          sessionsResp = normalizeSessionRecords(sessionsResp);
          sessionListCacheRef.current = sessionsResp;
        }
      }

      if (!isCurrentRequest()) return;

      if (sessionsResp.length > 0) {
        setAvailableRaces(sessionsResp);
      }

      // 2. Determine which race to load
      let targetSession: Session | null = null;

      if (selectedRaceKey !== null) {
        // User selected a specific race
        targetSession = sessionsResp.find(s => s.session_key === selectedRaceKey) || null;
      } else {
        targetSession = selectCurrentOrLatestRace(sessionsResp);
      }

      if (!targetSession) {
        if (selectedRaceKey !== null) {
          setSession(null);
          setStandings([]);
          setCurrentLap(0);
          setTotalLaps(0);
          setIsLive(false);
          setError('Selected session is unavailable');
          setDataQuality(createDataQuality('unavailable', {
            availability: 'error',
            freshness: 'unknown',
            message: 'The selected session is not present in the session catalogue',
          }));
          setMapData({
            ...INITIAL_TRACK_MAP_DATA,
            quality: createDataQuality('unavailable', {
              availability: 'error',
              message: 'Selected session is unavailable',
            }),
            mode: 'unavailable',
          });
          return;
        }

        // No session available, use demo mode
        if (demoLapRef.current < 57) demoLapRef.current += 1;
        setCurrentLap(demoLapRef.current);
        setTotalLaps(57);
        const demoStandings = buildDemoStandings(demoLapRef.current);
        setStandings(demoStandings);
        setSession(null);
        setDataQuality(createDataQuality('demo', { message: 'OpenF1 session data is unavailable' }));
        setMapData({
          geometry: [],
          positions: [],
          quality: createDataQuality('demo', { message: 'Demo map simulation' }),
          mode: 'demo',
          snapshotAt: null,
        });
        setIsLoading(false);
        return;
      }

      setSession(targetSession);
      const sk = targetSession.session_key;
      const isRace = isRaceSession(targetSession);
      const sessionPhase = getSessionPhase(targetSession);
      const isLiveSession = sessionPhase === 'live';
      const raceLapCount = getRaceLapCount(targetSession);
      setTotalLaps(raceLapCount ?? 0);

      if (sessionPhase === 'upcoming') {
        setStandings([]);
        setCurrentLap(0);
        setIsLive(false);
        setError(null);
        setDataQuality(createDataQuality('unavailable', {
          availability: 'empty',
          freshness: 'fresh',
          message: 'Upcoming session; race data is not available yet',
        }));
        setMapData({
          geometry: [],
          positions: [],
          quality: createDataQuality('unavailable', {
            availability: 'empty',
            message: 'Upcoming session has no location data',
          }),
          mode: 'unavailable',
          snapshotAt: null,
        });
        return;
      }

      // 3. Stale-while-revalidate: check cache for complete races
      if (!isLiveSession && raceDataCacheRef.current.has(sk)) {
        const cached = raceDataCacheRef.current.get(sk)!;
        setStandings(cached.standings);
        setCurrentLap(cached.maxLap);
        setTotalLaps(cached.totalLaps);
        setMapData({
          ...cached.mapData,
          quality: createDataQuality('cache', {
            freshness: 'stale',
            updatedAt: cached.mapData.quality.updatedAt,
            message: 'Showing cached completed-session map data',
          }),
          mode: cached.mapData.positions.length > 0 ? 'stale' : cached.mapData.mode,
        });
        setIsLive(false);
        setIsLoading(false);
        setError(null);
        setDataQuality(createDataQuality('cache', { freshness: 'stale', message: 'Showing cached completed-session data' }));
        return;
      }

      // 4. Fetch all race data in parallel
      const [drivers, rawPositions, laps, stints, pits] = await Promise.allSettled([
        getOpenF1Data<Driver[]>(`/drivers?session_key=${sk}`),
        getOpenF1Data<Position[]>(`/position?session_key=${sk}`),
        getOpenF1Data<Lap[]>(`/laps?session_key=${sk}`),
        getOpenF1Data<Stint[]>(`/stints?session_key=${sk}`),
        getOpenF1Data<PitStop[]>(`/pit?session_key=${sk}`),
      ]);

      if (!isCurrentRequest()) return;

      const driversData: Driver[] = fulfilledArray(drivers);
      const positionsData: Position[] = fulfilledArray(rawPositions);
      const lapsData: Lap[] = fulfilledArray(laps);
      const stintsData: Stint[] = fulfilledArray(stints);
      const pitsData: PitStop[] = fulfilledArray(pits);
      const isPartialResponse = hasRejected([drivers, rawPositions, laps, stints, pits]);

      if (driversData.length === 0) {
        if (selectedRaceKey !== null) {
          setStandings([]);
          setCurrentLap(0);
          setIsLive(false);
          setDataQuality(createDataQuality('unavailable', {
            availability: 'empty',
            freshness: 'fresh',
            message: 'No driver data is available for the selected session',
          }));
          setMapData({
            ...INITIAL_TRACK_MAP_DATA,
            quality: createDataQuality('unavailable', {
              availability: 'empty',
              message: 'No drivers are available for map positions',
            }),
            mode: 'unavailable',
          });
          return;
        }

        if (demoLapRef.current < 57) demoLapRef.current += 1;
        setCurrentLap(demoLapRef.current);
        setTotalLaps(57);
        setStandings(buildDemoStandings(demoLapRef.current));
        setDataQuality(createDataQuality('demo', { message: 'No driver data was returned by OpenF1' }));
        setMapData({
          geometry: [],
          positions: [],
          quality: createDataQuality('demo', { message: 'Demo map simulation' }),
          mode: 'demo',
          snapshotAt: null,
        });
        setIsLoading(false);
        return;
      }

      const nextMapData = await loadSessionLocationMap(targetSession, lapsData);
      if (!isCurrentRequest()) return;

      // Build data maps
      const latestPos = new Map<number, Position>();
      for (const p of positionsData) {
        const existing = latestPos.get(p.driver_number);
        if (!existing || p.date > existing.date) latestPos.set(p.driver_number, p);
      }

      const latestLap = new Map<number, Lap>();
      for (const l of lapsData) {
        const existing = latestLap.get(l.driver_number);
        if (!existing || l.lap_number > existing.lap_number) latestLap.set(l.driver_number, l);
      }

      const bestLap = new Map<number, number>();
      for (const l of lapsData) {
        if (l.lap_duration == null) continue;
        const cur = bestLap.get(l.driver_number);
        if (cur === undefined || l.lap_duration < cur) bestLap.set(l.driver_number, l.lap_duration);
      }

      const currentStints = new Map<number, Stint>();
      for (const s of stintsData) {
        const existing = currentStints.get(s.driver_number);
        if (!existing || s.stint_number > existing.stint_number) currentStints.set(s.driver_number, s);
      }

      const pitCount = new Map<number, number>();
      for (const p of pitsData) {
        pitCount.set(p.driver_number, (pitCount.get(p.driver_number) ?? 0) + 1);
      }

      const latestLocation = new Map<number, TrackMapData['positions'][number]>();
      for (const loc of nextMapData.positions) {
        const existing = latestLocation.get(loc.driver_number);
        if (!existing || loc.date > existing.date) latestLocation.set(loc.driver_number, loc);
      }

      // Determine current lap
      let maxLap = 0;
      for (const [, lap] of latestLap) {
        if (lap.lap_number > maxLap) maxLap = lap.lap_number;
      }
      if (maxLap > 0) setCurrentLap(maxLap);
      const lapsRemaining = Math.max(1, (raceLapCount ?? 0) - maxLap);

      // Find fastest lap driver
      let fastestOverall = Infinity;
      for (const [, dur] of bestLap) {
        if (dur < fastestOverall) fastestOverall = dur;
      }
      let fastestDriver = -1;
      for (const [driverNum, dur] of bestLap) {
        if (dur === fastestOverall) fastestDriver = driverNum;
      }

      // Sort by position
      const sortedByPos = [...driversData].sort((a, b) => {
        const pa = latestPos.get(a.driver_number)?.position ?? 99;
        const pb = latestPos.get(b.driver_number)?.position ?? 99;
        return pa - pb;
      });

      // Detect new pit stops
      const newPitNotifications: PitNotification[] = [];
      if (shouldEmitPitNotifications(isLiveSession, prevPitSessionKeyRef.current, sk)) {
        for (const pit of pitsData) {
          const prevCount = prevPitDataRef.current.get(pit.driver_number) ?? 0;
          const curCount = pitCount.get(pit.driver_number) ?? 0;
          if (curCount > prevCount) {
            const driver = driversData.find(d => d.driver_number === pit.driver_number);
            const pos = latestPos.get(pit.driver_number)?.position ?? 0;
            const stint = currentStints.get(pit.driver_number);
            if (driver) {
              newPitNotifications.push({
                id: `${pit.driver_number}-${pit.lap_number}-${Date.now()}`,
                driverNumber: pit.driver_number,
                driverName: driver.name_acronym,
                position: pos,
                lapNumber: pit.lap_number,
                timestamp: Date.now(),
                compound: stint?.compound,
                duration: plausiblePitDuration(pit.pit_duration),
              });
            }
          }
        }
      }

      const newPitRef = new Map<number, number>();
      for (const [k, v] of pitCount) newPitRef.set(k, v);
      prevPitDataRef.current = newPitRef;
      prevPitSessionKeyRef.current = sk;

      if (newPitNotifications.length > 0) {
        setPitNotifications(prev => [...prev.slice(-5), ...newPitNotifications]);
      }

      // Build standings
      const newStandings: DriverStanding[] = sortedByPos.map((driver, idx) => {
        const pos = latestPos.get(driver.driver_number)?.position ?? idx + 1;
        const lap = latestLap.get(driver.driver_number);
        const best = bestLap.get(driver.driver_number) ?? null;
        const stint = currentStints.get(driver.driver_number) ?? null;
        const age = stint
          ? Math.max(0, maxLap - stint.lap_start + (stint.tyre_age_at_start ?? 0))
          : 0;
        const count = pitCount.get(driver.driver_number) ?? 0;
        const loc = latestLocation.get(driver.driver_number) ?? null;
        const last = lap?.lap_duration ?? null;

        return {
          driver,
          position: pos,
          gapToLeader: pos === 1 ? 'LEADER' : '—',
          lastLap: last,
          bestLap: best,
          isFastestLap: driver.driver_number === fastestDriver,
          currentStint: stint,
          tireAge: age,
          pitCount: count,
          location: loc,
          winProbability: 0,
        };
      });

      const finalStandings = applyWinProbabilities(newStandings, lapsRemaining);

      // Update cache explicitly via current ref mapping
      if (!isLiveSession && driversData !== DEMO_DRIVERS) {
        raceDataCacheRef.current.set(sk, {
          standings: finalStandings,
          maxLap,
          totalLaps: isRace ? (raceLapCount ?? 0) : 0,
          mapData: nextMapData,
        });
      }

      setStandings(finalStandings);
      setMapData(nextMapData);
      setIsLive(isLiveSession);
      setError(null);
      setDataQuality(createDataQuality('openf1', {
        availability: finalStandings.length === 0 ? 'empty' : isPartialResponse ? 'partial' : 'ready',
        message: isPartialResponse
          ? 'Some OpenF1 endpoints are unavailable'
          : isLiveSession ? 'Live OpenF1 session data' : 'OpenF1 completed-session data',
      }));
    } catch (err) {
      if (!isCurrentRequest()) return;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      if (selectedRaceKey !== null) {
        setStandings([]);
        setCurrentLap(0);
        setTotalLaps(0);
        setIsLive(false);
        setDataQuality(createDataQuality('unavailable', {
          availability: 'error',
          freshness: 'unknown',
          message: msg,
        }));
        setMapData({
          ...INITIAL_TRACK_MAP_DATA,
          quality: createDataQuality('unavailable', {
            availability: 'error',
            message: msg,
          }),
          mode: 'unavailable',
        });
      } else if (standingsRef.current.length === 0) {
        if (demoLapRef.current < 57) demoLapRef.current += 1;
        setCurrentLap(demoLapRef.current);
        setTotalLaps(57);
        setStandings(buildDemoStandings(demoLapRef.current));
        setDataQuality(createDataQuality('demo', { message: 'OpenF1 failed; showing deterministic demo data' }));
        setMapData({
          geometry: [],
          positions: [],
          quality: createDataQuality('demo', { message: 'Demo map simulation' }),
          mode: 'demo',
          snapshotAt: null,
        });
      } else {
        setDataQuality(createDataQuality('cache', {
          availability: 'partial',
          freshness: 'stale',
          message: 'OpenF1 refresh failed; showing the last available data',
        }));
      }
    } finally {
      if (isCurrentRequest()) setIsLoading(false);
    }
  }, [selectedRaceKey]);

  // Fetch on mount and when selectedRaceKey changes
  useEffect(() => {
    fetchData();
  }, [selectedRaceKey, fetchData]);

  // Poll only when the selected session policy requires it.
  useEffect(() => {
    const pollingInterval = getSessionPollingInterval(session);
    if (pollingInterval === null) return undefined;

    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (document.hidden || interval !== null) return;
      interval = setInterval(fetchData, pollingInterval);
    };
    const stop = () => {
      if (interval !== null) clearInterval(interval);
      interval = null;
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        void fetchData();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, session]);

  return {
    standings,
    session,
    currentLap,
    totalLaps,
    pitNotifications,
    isLive,
    isLoading,
    error,
    dismissPitNotification,
    availableRaces,
    selectedRaceKey,
    setSelectedRaceKey,
    dataQuality,
    mapData,
    sessionMode,
    replay,
  };
}

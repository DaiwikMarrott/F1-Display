import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Driver,
  Position,
  Lap,
  Stint,
  PitStop,
  Location,
  Session,
  DriverStanding,
  PitNotification,
} from '../types/f1';

const BASE_URL = 'https://api.openf1.org/v1';
const POLL_INTERVAL = 2000;

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json() as Promise<T>;
}

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
  { driver_number: 1,  broadcast_name: 'M VERSTAPPEN', full_name: 'Max Verstappen',     name_acronym: 'VER', team_name: 'Red Bull Racing', team_colour: '3671C6', session_key: 0 },
  { driver_number: 16, broadcast_name: 'C LECLERC',    full_name: 'Charles Leclerc',    name_acronym: 'LEC', team_name: 'Ferrari',          team_colour: 'E8002D', session_key: 0 },
  { driver_number: 44, broadcast_name: 'L HAMILTON',   full_name: 'Lewis Hamilton',     name_acronym: 'HAM', team_name: 'Ferrari',          team_colour: 'E8002D', session_key: 0 },
  { driver_number: 63, broadcast_name: 'G RUSSELL',    full_name: 'George Russell',     name_acronym: 'RUS', team_name: 'Mercedes',         team_colour: '00D2BE', session_key: 0 },
  { driver_number: 4,  broadcast_name: 'L NORRIS',     full_name: 'Lando Norris',       name_acronym: 'NOR', team_name: 'McLaren',          team_colour: 'FF8000', session_key: 0 },
  { driver_number: 81, broadcast_name: 'O PIASTRI',    full_name: 'Oscar Piastri',      name_acronym: 'PIA', team_name: 'McLaren',          team_colour: 'FF8000', session_key: 0 },
  { driver_number: 14, broadcast_name: 'F ALONSO',     full_name: 'Fernando Alonso',    name_acronym: 'ALO', team_name: 'Aston Martin',     team_colour: '358C75', session_key: 0 },
  { driver_number: 18, broadcast_name: 'L STROLL',     full_name: 'Lance Stroll',       name_acronym: 'STR', team_name: 'Aston Martin',     team_colour: '358C75', session_key: 0 },
  { driver_number: 10, broadcast_name: 'P GASLY',      full_name: 'Pierre Gasly',       name_acronym: 'GAS', team_name: 'Alpine',           team_colour: '0093CC', session_key: 0 },
  { driver_number: 31, broadcast_name: 'E OCON',       full_name: 'Esteban Ocon',       name_acronym: 'OCO', team_name: 'Alpine',           team_colour: '0093CC', session_key: 0 },
  { driver_number: 23, broadcast_name: 'A ALBON',      full_name: 'Alexander Albon',    name_acronym: 'ALB', team_name: 'Williams',         team_colour: '64C4FF', session_key: 0 },
  { driver_number: 2,  broadcast_name: 'L SARGEANT',   full_name: 'Logan Sargeant',     name_acronym: 'SAR', team_name: 'Williams',         team_colour: '64C4FF', session_key: 0 },
  { driver_number: 22, broadcast_name: 'Y TSUNODA',    full_name: 'Yuki Tsunoda',       name_acronym: 'TSU', team_name: 'RB',               team_colour: '6692FF', session_key: 0 },
  { driver_number: 3,  broadcast_name: 'D RICCIARDO',  full_name: 'Daniel Ricciardo',   name_acronym: 'RIC', team_name: 'RB',               team_colour: '6692FF', session_key: 0 },
  { driver_number: 20, broadcast_name: 'K MAGNUSSEN',  full_name: 'Kevin Magnussen',    name_acronym: 'MAG', team_name: 'Haas F1 Team',     team_colour: 'B6BABD', session_key: 0 },
  { driver_number: 27, broadcast_name: 'N HULKENBERG', full_name: 'Nico Hülkenberg',    name_acronym: 'HUL', team_name: 'Haas F1 Team',     team_colour: 'B6BABD', session_key: 0 },
  { driver_number: 24, broadcast_name: 'G ZHOU',       full_name: 'Guanyu Zhou',        name_acronym: 'ZHO', team_name: 'Kick Sauber',      team_colour: 'C92D4B', session_key: 0 },
  { driver_number: 77, broadcast_name: 'V BOTTAS',     full_name: 'Valtteri Bottas',    name_acronym: 'BOT', team_name: 'Kick Sauber',      team_colour: 'C92D4B', session_key: 0 },
  { driver_number: 55, broadcast_name: 'C SAINZ',      full_name: 'Carlos Sainz',       name_acronym: 'SAI', team_name: 'Williams',         team_colour: '64C4FF', session_key: 0 },
  { driver_number: 87, broadcast_name: 'O BEARMAN',    full_name: 'Oliver Bearman',     name_acronym: 'BEA', team_name: 'Haas F1 Team',     team_colour: 'B6BABD', session_key: 0 },
];

function buildDemoStandings(): DriverStanding[] {
  const compounds: Stint['compound'][] = ['SOFT', 'MEDIUM', 'HARD', 'SOFT', 'MEDIUM'];
  const raw = DEMO_DRIVERS.map((driver, idx) => {
    const position = idx + 1;
    const gapSec = idx === 0 ? 0 : idx * 1.2 + Math.random() * 3;
    const lastLap = 90 + Math.random() * 5;
    const compound = compounds[idx % compounds.length];
    const tireAge = Math.floor(Math.random() * 25) + 1;
    return {
      driver,
      position,
      gapToLeader: formatGap(gapSec),
      lastLap,
      bestLap: lastLap - Math.random() * 0.5,
      isFastestLap: idx === 3,
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
      tireAge,
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
}

export function useF1Data(): F1DataState {
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [currentLap, setCurrentLap] = useState(0);
  const [totalLaps, setTotalLaps] = useState(57);
  const [pitNotifications, setPitNotifications] = useState<PitNotification[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableRaces, setAvailableRaces] = useState<Session[]>([]);
  const [selectedRaceKey, setSelectedRaceKey] = useState<number | null>(null);

  const prevPitDataRef = useRef<Map<number, number>>(new Map());
  const standingsRef = useRef<DriverStanding[]>([]);
  standingsRef.current = standings;
  const demoLapRef = useRef(14);
  const demoModeRef = useRef(false);

  const dismissPitNotification = useCallback((id: string) => {
    setPitNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch all races for the current year
      let sessionsResp: Session[] = [];
      try {
        sessionsResp = await fetchJSON<Session[]>(`${BASE_URL}/sessions?year=2024`);
      } catch (e) {
        console.warn('Failed to fetch sessions:', e);
      }

      if (sessionsResp.length > 0) {
        setAvailableRaces(sessionsResp);
      }

      // 2. Determine which race to load
      let targetSession: Session | null = null;

      if (selectedRaceKey !== null) {
        // User selected a specific race
        targetSession = sessionsResp.find(s => s.session_key === selectedRaceKey) || null;
      } else {
        // Load the latest session or next upcoming race
        try {
          const latestSessions = await fetchJSON<Session[]>(`${BASE_URL}/sessions?session_key=latest`);
          targetSession = latestSessions[0] || null;
        } catch (e) {
          console.warn('Failed to fetch latest session:', e);
          // Fallback: get the most recent session from all sessions
          if (sessionsResp.length > 0) {
            // Find the session with the latest date
            targetSession = sessionsResp.reduce((latest, current) => 
              new Date(current.date_start) > new Date(latest.date_start) ? current : latest
            );
          }
        }
      }

      if (!targetSession) {
        // No session available, use demo mode
        demoModeRef.current = true;
        if (demoLapRef.current < 57) demoLapRef.current += 1;
        setCurrentLap(demoLapRef.current);
        setTotalLaps(57);
        const demoStandings = buildDemoStandings();
        setStandings(demoStandings);
        setSession(null);
        setIsLoading(false);
        return;
      }

      setSession(targetSession);
      const sk = targetSession.session_key;
      const isRace = targetSession.session_type === 'Race';

      // 3. Fetch all race data in parallel
      const [drivers, rawPositions, laps, stints, pits, locations] = await Promise.allSettled([
        fetchJSON<Driver[]>(`${BASE_URL}/drivers?session_key=${sk}`),
        fetchJSON<Position[]>(`${BASE_URL}/position?session_key=${sk}`),
        fetchJSON<Lap[]>(`${BASE_URL}/laps?session_key=${sk}`),
        fetchJSON<Stint[]>(`${BASE_URL}/stints?session_key=${sk}`),
        fetchJSON<PitStop[]>(`${BASE_URL}/pit?session_key=${sk}`),
        fetchJSON<Location[]>(`${BASE_URL}/location?session_key=${sk}`),
      ]);

      const driversData: Driver[] = drivers.status === 'fulfilled' ? drivers.value : DEMO_DRIVERS;
      const positionsData: Position[] = rawPositions.status === 'fulfilled' ? rawPositions.value : [];
      const lapsData: Lap[] = laps.status === 'fulfilled' ? laps.value : [];
      const stintsData: Stint[] = stints.status === 'fulfilled' ? stints.value : [];
      const pitsData: PitStop[] = pits.status === 'fulfilled' ? pits.value : [];
      const locationsData: Location[] = locations.status === 'fulfilled' ? locations.value : [];

      if (driversData.length === 0) {
        demoModeRef.current = true;
        if (demoLapRef.current < 57) demoLapRef.current += 1;
        setCurrentLap(demoLapRef.current);
        setTotalLaps(57);
        setStandings(buildDemoStandings());
        setIsLoading(false);
        return;
      }

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

      const latestLocation = new Map<number, Location>();
      for (const loc of locationsData) {
        const existing = latestLocation.get(loc.driver_number);
        if (!existing || loc.date > existing.date) latestLocation.set(loc.driver_number, loc);
      }

      // Determine current lap
      let maxLap = 0;
      for (const [, lap] of latestLap) {
        if (lap.lap_number > maxLap) maxLap = lap.lap_number;
      }
      if (maxLap > 0) setCurrentLap(maxLap);
      if (isRace) setTotalLaps(57);

      const lapsRemaining = Math.max(1, totalLaps - maxLap);

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

      // Get leader lap time
      const leaderLapTimes: number[] = [];
      for (const l of lapsData) {
        if (l.driver_number === sortedByPos[0]?.driver_number && l.lap_duration != null) {
          leaderLapTimes.push(l.lap_duration);
        }
      }
      const avgLeaderLap = leaderLapTimes.length > 0
        ? leaderLapTimes.reduce((a, b) => a + b, 0) / leaderLapTimes.length
        : 90;

      // Detect new pit stops
      const newPitNotifications: PitNotification[] = [];
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
              duration: pit.pit_duration ?? undefined,
            });
          }
        }
      }

      const newPitRef = new Map<number, number>();
      for (const [k, v] of pitCount) newPitRef.set(k, v);
      prevPitDataRef.current = newPitRef;

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
          ? maxLap - stint.lap_start + (stint.tyre_age_at_start ?? 0)
          : 0;
        const count = pitCount.get(driver.driver_number) ?? 0;
        const loc = latestLocation.get(driver.driver_number) ?? null;
        const last = lap?.lap_duration ?? null;

        const gapSec = pos === 1 ? 0 : (pos - 1) * avgLeaderLap * 0.003 + Math.random() * 0.5;

        return {
          driver,
          position: pos,
          gapToLeader: formatGap(pos === 1 ? 0 : gapSec),
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
      setStandings(finalStandings);
      setIsLive(targetSession.status === 'started' || targetSession.status === 'active');
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      if (standingsRef.current.length === 0) {
        demoModeRef.current = true;
        if (demoLapRef.current < 57) demoLapRef.current += 1;
        setCurrentLap(demoLapRef.current);
        setTotalLaps(57);
        setStandings(buildDemoStandings());
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedRaceKey, totalLaps]);

  // Fetch on mount and when selectedRaceKey changes
  useEffect(() => {
    fetchData();
  }, [selectedRaceKey, fetchData]);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

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
  };
}

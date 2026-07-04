import type {
  Driver,
  DriverStanding,
  Lap,
  Location,
  PitStop,
  Position,
  Stint,
} from '../types/f1';
import { recordsKnownAtReplayTime } from '../services/openf1/replay';

export interface ReplayDataset {
  drivers: Driver[];
  positions: Position[];
  laps: Lap[];
  stints: Stint[];
  pits: PitStop[];
  partial: boolean;
}

export interface ReplaySnapshot {
  standings: DriverStanding[];
  currentLap: number;
  recordsThrough: string;
}

function completedLapsAtTime(laps: Lap[], replayTimestamp: string): Lap[] {
  const replayTime = Date.parse(replayTimestamp);
  if (!Number.isFinite(replayTime)) return [];
  return laps.filter(lap => {
    const startsAt = Date.parse(lap.date_start);
    if (!Number.isFinite(startsAt) || lap.lap_duration === null || lap.lap_duration <= 0) return false;
    return startsAt + lap.lap_duration * 1_000 <= replayTime;
  });
}

function replayWinProbabilities(
  standings: DriverStanding[],
  currentLap: number,
  totalLaps: number,
): DriverStanding[] {
  const lapsRemaining = Math.max(1, totalLaps - currentLap);
  const scores = standings.map(standing =>
    (1 / Math.pow(Math.max(1, standing.position), 1.5))
    * Math.max(0.1, lapsRemaining / Math.max(1, totalLaps)));
  const total = scores.reduce((sum, value) => sum + value, 0) || 1;
  return standings.map((standing, index) => ({
    ...standing,
    winProbability: (scores[index] / total) * 100,
  }));
}

export function buildReplaySnapshot(
  dataset: ReplayDataset,
  replayTimestamp: string,
  totalLaps: number,
  locations: Location[] = [],
): ReplaySnapshot {
  const positions = recordsKnownAtReplayTime(dataset.positions, replayTimestamp);
  const laps = completedLapsAtTime(dataset.laps, replayTimestamp);
  const pits = recordsKnownAtReplayTime(dataset.pits, replayTimestamp);

  const latestPosition = new Map<number, Position>();
  for (const position of positions) {
    const current = latestPosition.get(position.driver_number);
    if (!current || position.date > current.date) latestPosition.set(position.driver_number, position);
  }

  const latestLap = new Map<number, Lap>();
  const bestLap = new Map<number, number>();
  let currentLap = 0;
  for (const lap of laps) {
    const current = latestLap.get(lap.driver_number);
    if (!current || lap.lap_number > current.lap_number) latestLap.set(lap.driver_number, lap);
    if (lap.lap_duration !== null) {
      const best = bestLap.get(lap.driver_number);
      if (best === undefined || lap.lap_duration < best) bestLap.set(lap.driver_number, lap.lap_duration);
    }
    currentLap = Math.max(currentLap, lap.lap_number);
  }

  const currentStint = new Map<number, Stint>();
  for (const stint of dataset.stints) {
    if (stint.lap_start > Math.max(1, currentLap)) continue;
    const current = currentStint.get(stint.driver_number);
    if (!current || stint.stint_number > current.stint_number) {
      currentStint.set(stint.driver_number, stint);
    }
  }

  const pitCount = new Map<number, number>();
  for (const pit of pits) {
    if (pit.lap_number > currentLap) continue;
    pitCount.set(pit.driver_number, (pitCount.get(pit.driver_number) ?? 0) + 1);
  }

  const latestLocation = new Map<number, Location>();
  for (const location of recordsKnownAtReplayTime(locations, replayTimestamp)) {
    const current = latestLocation.get(location.driver_number);
    if (!current || location.date > current.date) latestLocation.set(location.driver_number, location);
  }

  const fastestTime = Math.min(...bestLap.values(), Number.POSITIVE_INFINITY);
  const standings = dataset.drivers
    .flatMap(driver => {
      const position = latestPosition.get(driver.driver_number);
      if (!position) return [];
      const lap = latestLap.get(driver.driver_number);
      const stint = currentStint.get(driver.driver_number) ?? null;
      const tireAge = stint
        ? Math.max(0, currentLap - stint.lap_start + (stint.tyre_age_at_start ?? 0))
        : 0;
      return [{
        driver,
        position: position.position,
        gapToLeader: position.position === 1 ? 'LEADER' : '—',
        lastLap: lap?.lap_duration ?? null,
        bestLap: bestLap.get(driver.driver_number) ?? null,
        isFastestLap: bestLap.get(driver.driver_number) === fastestTime,
        currentStint: stint,
        tireAge,
        pitCount: pitCount.get(driver.driver_number) ?? 0,
        location: latestLocation.get(driver.driver_number) ?? null,
        winProbability: 0,
      } satisfies DriverStanding];
    })
    .sort((a, b) => a.position - b.position);

  return {
    standings: replayWinProbabilities(standings, currentLap, totalLaps),
    currentLap,
    recordsThrough: replayTimestamp,
  };
}

import { getOpenF1Data } from './client';

export interface SeasonRace {
  session_key: number;
}

export interface SeasonSummary {
  racesAnalyzed: number;
  averageFinish: number;
  bestFinish: number;
  podiums: number;
  wins: number;
  points: number;
  lastResult: number | null;
}

type PositionRow = {
  driver_number: number;
  position: number;
  date: string;
};

type PositionFetcher = (path: string) => Promise<PositionRow[]>;

function pointsForFinish(position: number): number {
  const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return points[position - 1] ?? 0;
}

export async function loadSeasonSummary(
  driverNumber: number,
  races: SeasonRace[],
  fetcher: PositionFetcher = path => getOpenF1Data<PositionRow[]>(path),
): Promise<SeasonSummary | null> {
  if (races.length === 0) return null;

  const results = await Promise.allSettled(
    races.map(async (race): Promise<number | null> => {
      const positions = await fetcher(`/position?session_key=${race.session_key}`);
      const driverRows = positions
        .filter(row => row.driver_number === driverNumber)
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
      if (driverRows.length === 0) return null;
      return driverRows[driverRows.length - 1].position;
    }),
  );

  if (results.every(result => result.status === 'rejected')) {
    throw new Error('Unable to load recent race results');
  }

  const finishes = results
    .filter((result): result is PromiseFulfilledResult<number | null> => result.status === 'fulfilled')
    .map(result => result.value)
    .filter((value): value is number => typeof value === 'number' && value > 0);

  if (finishes.length === 0) return null;

  return {
    racesAnalyzed: finishes.length,
    averageFinish: finishes.reduce((sum, value) => sum + value, 0) / finishes.length,
    bestFinish: Math.min(...finishes),
    podiums: finishes.filter(value => value <= 3).length,
    wins: finishes.filter(value => value === 1).length,
    points: finishes.reduce((sum, value) => sum + pointsForFinish(value), 0),
    lastResult: finishes[0] ?? null,
  };
}

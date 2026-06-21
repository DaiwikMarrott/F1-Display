import { describe, expect, it, vi } from 'vitest';
import { loadSeasonSummary } from './seasonSummary';

describe('season summary', () => {
  it('summarizes successful recent finishes', async () => {
    const fetcher = vi.fn(async () => [
      { driver_number: 16, position: 3, date: '2026-01-01T12:00:00Z' },
      { driver_number: 16, position: 2, date: '2026-01-01T14:00:00Z' },
    ]);

    const result = await loadSeasonSummary(16, [{ session_key: 1 }, { session_key: 2 }], fetcher);

    expect(result).toMatchObject({
      racesAnalyzed: 2,
      bestFinish: 2,
      podiums: 2,
      wins: 0,
      points: 36,
    });
  });

  it('returns a terminal empty result when requests succeed without finishes', async () => {
    const result = await loadSeasonSummary(
      16,
      [{ session_key: 1 }],
      vi.fn(async () => []),
    );

    expect(result).toBeNull();
  });

  it('throws a terminal error when every race request fails', async () => {
    await expect(loadSeasonSummary(
      16,
      [{ session_key: 1 }, { session_key: 2 }],
      vi.fn(async () => {
        throw new Error('offline');
      }),
    )).rejects.toThrow('Unable to load recent race results');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Lap, Location, Session } from '../../types/f1';
import { createDataQuality } from '../../types/dataQuality';
import { clearLocationGeometryCache, loadSessionLocationMap } from './location';

function session(status = 'completed'): Session {
  return {
    session_key: 10,
    meeting_key: 20,
    session_name: 'Race',
    session_type: 'Race',
    status,
    date_start: '2026-06-01T12:00:00Z',
    date_end: '2026-06-01T14:00:00Z',
    circuit_short_name: 'Catalunya',
    country_name: 'Spain',
  };
}

function lap(driverNumber: number, lapNumber: number, date: string): Lap {
  return {
    driver_number: driverNumber,
    lap_number: lapNumber,
    lap_duration: 90,
    duration_sector_1: null,
    duration_sector_2: null,
    duration_sector_3: null,
    i1_speed: null,
    i2_speed: null,
    st_speed: null,
    date_start: date,
    is_pit_out_lap: false,
    session_key: 10,
    meeting_key: 20,
  };
}

function location(driver: number, x: number, y: number, second: number): Location {
  return {
    driver_number: driver,
    x,
    y,
    z: 0,
    date: `2026-06-01T13:59:${String(second).padStart(2, '0')}Z`,
    session_key: 10,
    meeting_key: 20,
  };
}

const geometry = Array.from({ length: 30 }, (_, index) =>
  location(1, index * 100, Math.sin(index / 3) * 700, index));
const snapshot = [
  location(1, 0, 0, 45),
  location(2, 800, 600, 45),
  location(3, 1600, -400, 45),
];

describe('bounded OpenF1 location loading', () => {
  beforeEach(() => {
    clearLocationGeometryCache();
  });

  it('uses a driver-bounded lap query and a narrow synchronized snapshot query', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: geometry, quality: createDataQuality('openf1') })
      .mockResolvedValueOnce({ data: snapshot, quality: createDataQuality('openf1') });

    const result = await loadSessionLocationMap(
      session(),
      [
        lap(1, 60, '2026-06-01T13:40:00Z'),
        lap(2, 61, '2026-06-01T13:58:00Z'),
      ],
      fetcher,
    );

    const geometryUrl = fetcher.mock.calls[0][0] as string;
    const snapshotUrl = fetcher.mock.calls[1][0] as string;
    expect(geometryUrl).toContain('session_key=10&driver_number=2');
    expect(geometryUrl).toContain('&date>=');
    expect(geometryUrl).toContain('&date<=');
    expect(snapshotUrl).toContain('session_key=10&date>=');
    expect(snapshotUrl).not.toContain('driver_number=');
    expect(result.mode).toBe('latest-known');
    expect(result.positions).toHaveLength(3);
  });

  it('caches geometry per session while refreshing bounded snapshots', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: geometry, quality: createDataQuality('openf1') })
      .mockResolvedValue({ data: snapshot, quality: createDataQuality('openf1') });
    const laps = [lap(1, 60, '2026-06-01T13:58:00Z')];

    await loadSessionLocationMap(session('active'), laps, fetcher);
    await loadSessionLocationMap(session('active'), laps, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls.filter(([url]) => String(url).includes('driver_number=')).length).toBe(1);
  });

  it('rejects collapsed snapshots instead of presenting them as real positions', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: geometry, quality: createDataQuality('openf1') })
      .mockResolvedValueOnce({
        data: [
          location(1, 10, 10, 45),
          location(2, 11, 11, 45),
          location(3, 12, 12, 45),
        ],
        quality: createDataQuality('openf1'),
      });

    const result = await loadSessionLocationMap(
      session(),
      [lap(1, 60, '2026-06-01T13:58:00Z')],
      fetcher,
    );

    expect(result.mode).toBe('estimated');
    expect(result.positions).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import type { Location } from '../types/f1';
import { createDataQuality } from '../types/dataQuality';
import {
  areLocationsCollapsed,
  createTrackProjection,
  geometryToSvgPath,
  getTrackMapLabel,
  latestLocationPerDriver,
} from './trackProjection';

function location(driver: number, x: number, y: number, date: string): Location {
  return {
    driver_number: driver,
    x,
    y,
    z: 0,
    date,
    session_key: 1,
    meeting_key: 1,
  };
}

describe('track projection', () => {
  const geometry = Array.from({ length: 30 }, (_, index) =>
    location(1, index * 100, Math.sin(index / 3) * 800, `2026-06-01T12:00:${String(index).padStart(2, '0')}Z`));

  it('uses one stable transform for geometry and marker coordinates', () => {
    const projection = createTrackProjection(geometry, 900, 700, 70);
    expect(projection).not.toBeNull();

    const marker = projection!.project(geometry[10]);
    const path = geometryToSvgPath(geometry, projection!);

    expect(path).toContain(`${marker.x.toFixed(1)} ${marker.y.toFixed(1)}`);
  });

  it('keeps only the latest valid point for each driver', () => {
    expect(latestLocationPerDriver([
      location(1, 10, 10, '2026-06-01T12:00:00Z'),
      location(1, 20, 20, '2026-06-01T12:00:01Z'),
      location(2, 30, 30, '2026-06-01T12:00:00Z'),
    ])).toEqual([
      location(1, 20, 20, '2026-06-01T12:00:01Z'),
      location(2, 30, 30, '2026-06-01T12:00:00Z'),
    ]);
  });

  it('rejects collapsed garage-like snapshots', () => {
    expect(areLocationsCollapsed([
      location(1, 10, 10, '2026-06-01T12:00:00Z'),
      location(2, 12, 11, '2026-06-01T12:00:00Z'),
      location(3, 13, 10, '2026-06-01T12:00:00Z'),
    ])).toBe(true);
  });

  it('labels live, cached, estimated, and unavailable states distinctly', () => {
    const base = { geometry: [], positions: [], snapshotAt: null };
    expect(getTrackMapLabel({
      ...base,
      quality: createDataQuality('openf1'),
      mode: 'live',
    })).toBe('LIVE POSITIONS');
    expect(getTrackMapLabel({
      ...base,
      quality: createDataQuality('cache'),
      mode: 'cached',
    })).toBe('CACHED POSITIONS');
    expect(getTrackMapLabel({
      ...base,
      quality: createDataQuality('estimated'),
      mode: 'estimated',
    })).toBe('ESTIMATED POSITIONS');
    expect(getTrackMapLabel({
      ...base,
      quality: createDataQuality('unavailable'),
      mode: 'unavailable',
    })).toBe('POSITION DATA UNAVAILABLE');
  });
});

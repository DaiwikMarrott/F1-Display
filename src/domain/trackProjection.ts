import type { Location } from '../types/f1';
import type { TrackMapData } from '../types/map';

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface TrackProjection {
  project: (point: Pick<Location, 'x' | 'y'>) => ProjectedPoint;
}

function validPoint(point: Pick<Location, 'x' | 'y'>): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function latestLocationPerDriver(locations: Location[]): Location[] {
  const latest = new Map<number, Location>();
  for (const location of locations) {
    if (!validPoint(location)) continue;
    const existing = latest.get(location.driver_number);
    if (!existing || location.date > existing.date) {
      latest.set(location.driver_number, location);
    }
  }
  return [...latest.values()];
}

export function areLocationsCollapsed(locations: Location[]): boolean {
  const points = latestLocationPerDriver(locations);
  if (points.length < 2) return true;

  const unique = new Set(points.map(point => `${Math.round(point.x / 25)},${Math.round(point.y / 25)}`));
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const spread = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));

  return unique.size < Math.max(2, Math.ceil(points.length * 0.3)) || spread < 250;
}

export function hasUsableGeometry(locations: Location[]): boolean {
  const points = locations.filter(validPoint);
  if (points.length < 20) return false;
  const unique = new Set(points.map(point => `${Math.round(point.x / 10)},${Math.round(point.y / 10)}`));
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  return unique.size >= 20
    && Math.max(...xs) - Math.min(...xs) >= 250
    && Math.max(...ys) - Math.min(...ys) >= 250;
}

export function createTrackProjection(
  geometry: Location[],
  width: number,
  height: number,
  padding: number,
): TrackProjection | null {
  const points = geometry.filter(validPoint);
  if (points.length < 3) return null;

  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  if (rangeX <= 0 || rangeY <= 0) return null;

  const scale = Math.min(
    (width - padding * 2) / rangeX,
    (height - padding * 2) / rangeY,
  );
  const drawnWidth = rangeX * scale;
  const drawnHeight = rangeY * scale;
  const offsetX = (width - drawnWidth) / 2;
  const offsetY = (height - drawnHeight) / 2;

  return {
    project: point => ({
      x: offsetX + (point.x - minX) * scale,
      y: offsetY + (maxY - point.y) * scale,
    }),
  };
}

export function geometryToSvgPath(
  geometry: Location[],
  projection: TrackProjection,
  maxPoints = 500,
): string | null {
  const ordered = geometry
    .filter(validPoint)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (ordered.length < 3) return null;

  const stride = Math.max(1, Math.ceil(ordered.length / maxPoints));
  const sampled = ordered.filter((_, index) => index % stride === 0);
  if (sampled[sampled.length - 1] !== ordered[ordered.length - 1]) {
    sampled.push(ordered[ordered.length - 1]);
  }

  return sampled
    .map((point, index) => {
      const projected = projection.project(point);
      return `${index === 0 ? 'M' : 'L'} ${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
    })
    .join(' ');
}

export function getTrackMapLabel(data: TrackMapData): string {
  const time = data.snapshotAt
    ? new Date(data.snapshotAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  switch (data.mode) {
    case 'live':
      return time ? `LIVE POSITIONS · ${time}` : 'LIVE POSITIONS';
    case 'replay':
      return time ? `REPLAY POSITIONS · ${time}` : 'REPLAY POSITIONS';
    case 'latest-known':
      return time ? `LATEST KNOWN · ${time}` : 'LATEST KNOWN POSITIONS';
    case 'cached':
      return time ? `CACHED POSITIONS · ${time}` : 'CACHED POSITIONS';
    case 'stale':
      return time ? `STALE POSITIONS · ${time}` : 'STALE POSITIONS';
    case 'estimated':
      return 'ESTIMATED POSITIONS';
    case 'demo':
      return 'DEMO SIMULATION';
    case 'loading':
      return 'LOADING MAP';
    default:
      return 'POSITION DATA UNAVAILABLE';
  }
}

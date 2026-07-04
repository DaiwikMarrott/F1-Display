import { getSessionPhase } from '../../domain/sessionSelection';
import {
  areLocationsCollapsed,
  hasUsableGeometry,
  latestLocationPerDriver,
} from '../../domain/trackProjection';
import type { DataQuality } from '../../types/dataQuality';
import { createDataQuality } from '../../types/dataQuality';
import type { Lap, Location, Session } from '../../types/f1';
import type { TrackMapData, TrackMapMode } from '../../types/map';
import { openF1Client } from './client';
import type { OpenF1Result } from './client';

type LocationFetcher = (path: string) => Promise<OpenF1Result<Location[]>>;

interface GeometryCacheEntry {
  geometry: Location[];
  quality: DataQuality;
}

const geometryCache = new Map<number, GeometryCacheEntry>();

function validLap(lap: Lap): boolean {
  return !lap.is_pit_out_lap
    && typeof lap.lap_duration === 'number'
    && Number.isFinite(lap.lap_duration)
    && lap.lap_duration >= 30
    && lap.lap_duration <= 300
    && Number.isFinite(Date.parse(lap.date_start));
}

function iso(milliseconds: number): string {
  return new Date(milliseconds).toISOString();
}

function boundedLocationPath(
  sessionKey: number,
  start: number,
  end: number,
  driverNumber?: number,
): string {
  const driver = driverNumber === undefined ? '' : `&driver_number=${driverNumber}`;
  return `/location?session_key=${sessionKey}${driver}`
    + `&date>=${encodeURIComponent(iso(start))}`
    + `&date<=${encodeURIComponent(iso(end))}`;
}

function chooseReferenceLap(laps: Lap[]): Lap | null {
  const candidates = laps.filter(validLap);
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => {
    const lapDifference = b.lap_number - a.lap_number;
    if (lapDifference !== 0) return lapDifference;
    return a.date_start.localeCompare(b.date_start);
  })[0];
}

function chooseSnapshotTime(laps: Lap[]): number | null {
  const latest = laps
    .filter(validLap)
    .sort((a, b) => b.date_start.localeCompare(a.date_start))[0];
  if (!latest || latest.lap_duration === null) return null;
  return Date.parse(latest.date_start) + (latest.lap_duration * 500);
}

function lapsCompletedBy(laps: Lap[], replayTime: number): Lap[] {
  return laps.filter(lap => {
    if (!validLap(lap) || lap.lap_duration === null) return false;
    return Date.parse(lap.date_start) + lap.lap_duration * 1_000 <= replayTime;
  });
}

function mergeQuality(geometry: DataQuality, positions: DataQuality): DataQuality {
  if (geometry.provenance === 'cache' || positions.provenance === 'cache') {
    return createDataQuality('cache', {
      freshness: geometry.freshness === 'stale' || positions.freshness === 'stale' ? 'stale' : 'fresh',
      updatedAt: Math.min(
        geometry.updatedAt ?? Number.MAX_SAFE_INTEGER,
        positions.updatedAt ?? Number.MAX_SAFE_INTEGER,
      ),
      message: positions.message ?? geometry.message,
    });
  }
  return createDataQuality('openf1', {
    updatedAt: positions.updatedAt ?? geometry.updatedAt,
    message: positions.message ?? geometry.message,
  });
}

function modeFor(session: Session, quality: DataQuality): TrackMapMode {
  if (quality.provenance === 'cache') {
    return quality.freshness === 'stale' ? 'stale' : 'cached';
  }
  return getSessionPhase(session) === 'live' ? 'live' : 'latest-known';
}

export function clearLocationGeometryCache(): void {
  geometryCache.clear();
}

async function loadGeometryEntry(
  session: Session,
  laps: Lap[],
  fetcher: LocationFetcher,
): Promise<GeometryCacheEntry | undefined> {
  const cached = geometryCache.get(session.session_key);
  if (cached) return cached;

  const referenceLap = chooseReferenceLap(laps);
  if (!referenceLap || referenceLap.lap_duration === null) return undefined;
  const geometryStart = Date.parse(referenceLap.date_start);
  const geometryResult = await fetcher(boundedLocationPath(
    session.session_key,
    geometryStart,
    geometryStart + referenceLap.lap_duration * 1_000,
    referenceLap.driver_number,
  ));
  const geometry = geometryResult.data ?? [];
  if (!hasUsableGeometry(geometry)) return undefined;

  const entry = { geometry, quality: geometryResult.quality };
  geometryCache.set(session.session_key, entry);
  return entry;
}

export async function loadSessionLocationMap(
  session: Session,
  laps: Lap[],
  fetcher: LocationFetcher = path => openF1Client.request<Location[]>(path),
): Promise<TrackMapData> {
  const phase = getSessionPhase(session);
  if (phase === 'upcoming') {
    return {
      geometry: [],
      positions: [],
      quality: createDataQuality('unavailable', {
        availability: 'empty',
        message: 'Upcoming session has no location data',
      }),
      mode: 'unavailable',
      snapshotAt: null,
    };
  }

  const snapshotTime = chooseSnapshotTime(laps);
  if (snapshotTime === null) {
    return {
      geometry: [],
      positions: [],
      quality: createDataQuality('estimated', {
        availability: 'partial',
        message: 'No complete lap is available for OpenF1 map geometry',
      }),
      mode: 'estimated',
      snapshotAt: null,
    };
  }

  const geometryEntry = await loadGeometryEntry(session, laps, fetcher);

  if (!geometryEntry) {
    return {
      geometry: [],
      positions: [],
      quality: createDataQuality('estimated', {
        availability: 'partial',
        message: 'OpenF1 did not return a usable bounded lap trace',
      }),
      mode: 'estimated',
      snapshotAt: null,
    };
  }

  const positionResult = await fetcher(boundedLocationPath(
    session.session_key,
    snapshotTime - 1_500,
    snapshotTime + 1_500,
  ));
  const positions = latestLocationPerDriver(positionResult.data ?? []);
  if (positions.length < 2 || areLocationsCollapsed(positions)) {
    return {
      geometry: geometryEntry.geometry,
      positions: [],
      quality: createDataQuality('estimated', {
        availability: 'partial',
        message: 'OpenF1 position snapshot was missing or collapsed',
      }),
      mode: 'estimated',
      snapshotAt: iso(snapshotTime),
    };
  }

  const quality = mergeQuality(geometryEntry.quality, positionResult.quality);
  return {
    geometry: geometryEntry.geometry,
    positions,
    quality,
    mode: modeFor(session, quality),
    snapshotAt: positions.reduce(
      (latest, location) => location.date > latest ? location.date : latest,
      positions[0].date,
    ),
  };
}

export async function loadReplayLocationMap(
  session: Session,
  laps: Lap[],
  replayTimestamp: string,
  fetcher: LocationFetcher = path => openF1Client.request<Location[]>(path),
): Promise<TrackMapData> {
  const replayTime = Date.parse(replayTimestamp);
  if (!Number.isFinite(replayTime)) {
    return {
      geometry: [],
      positions: [],
      quality: createDataQuality('unavailable', {
        availability: 'error',
        message: 'Replay timestamp is invalid',
      }),
      mode: 'unavailable',
      snapshotAt: null,
    };
  }

  const availableLaps = lapsCompletedBy(laps, replayTime);
  const geometryEntry = await loadGeometryEntry(session, availableLaps, fetcher);
  if (!geometryEntry) {
    return {
      geometry: [],
      positions: [],
      quality: createDataQuality('estimated', {
        availability: 'partial',
        message: 'Replay has not reached a complete lap for map geometry',
      }),
      mode: 'estimated',
      snapshotAt: replayTimestamp,
    };
  }

  const positionResult = await fetcher(boundedLocationPath(
    session.session_key,
    replayTime - 1_500,
    replayTime + 1_500,
  ));
  const positions = latestLocationPerDriver(positionResult.data ?? []);
  if (positions.length < 2 || areLocationsCollapsed(positions)) {
    return {
      geometry: geometryEntry.geometry,
      positions: [],
      quality: createDataQuality('estimated', {
        availability: 'partial',
        message: 'Replay location snapshot was missing or collapsed',
      }),
      mode: 'estimated',
      snapshotAt: replayTimestamp,
    };
  }

  return {
    geometry: geometryEntry.geometry,
    positions,
    quality: createDataQuality('replay', {
      freshness: positionResult.quality.freshness,
      updatedAt: positionResult.quality.updatedAt,
      message: 'Historical OpenF1 positions at the replay timestamp',
    }),
    mode: 'replay',
    snapshotAt: positions.reduce(
      (latest, location) => location.date > latest ? location.date : latest,
      positions[0].date,
    ),
  };
}

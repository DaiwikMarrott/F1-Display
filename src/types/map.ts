import type { DataQuality } from './dataQuality';
import type { Location } from './f1';

export type TrackMapMode =
  | 'live'
  | 'latest-known'
  | 'cached'
  | 'stale'
  | 'estimated'
  | 'demo'
  | 'unavailable'
  | 'loading';

export interface TrackMapData {
  geometry: Location[];
  positions: Location[];
  quality: DataQuality;
  mode: TrackMapMode;
  snapshotAt: string | null;
}

export const INITIAL_TRACK_MAP_DATA: TrackMapData = {
  geometry: [],
  positions: [],
  quality: {
    provenance: 'unavailable',
    availability: 'loading',
    freshness: 'unknown',
    updatedAt: null,
    message: 'Waiting for map data',
  },
  mode: 'loading',
  snapshotAt: null,
};

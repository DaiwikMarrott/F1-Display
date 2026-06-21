export type DataProvenance =
  | 'openf1'
  | 'cache'
  | 'derived'
  | 'estimated'
  | 'demo'
  | 'unavailable';

export type DataAvailability = 'loading' | 'ready' | 'partial' | 'empty' | 'error';

export type DataFreshness = 'fresh' | 'stale' | 'expired' | 'unknown';

export interface DataQuality {
  provenance: DataProvenance;
  availability: DataAvailability;
  freshness: DataFreshness;
  updatedAt: number | null;
  message?: string;
}

export interface DataValue<T> {
  value: T | null;
  quality: DataQuality;
}

export const INITIAL_DATA_QUALITY: DataQuality = {
  provenance: 'unavailable',
  availability: 'loading',
  freshness: 'unknown',
  updatedAt: null,
  message: 'Waiting for session data',
};

export function createDataQuality(
  provenance: DataProvenance,
  options: Partial<Omit<DataQuality, 'provenance'>> = {},
): DataQuality {
  return {
    provenance,
    availability: options.availability ?? 'ready',
    freshness: options.freshness ?? (provenance === 'cache' ? 'stale' : 'fresh'),
    updatedAt: options.updatedAt ?? Date.now(),
    message: options.message,
  };
}

export function getDataQualityLabel(quality: DataQuality): string {
  if (quality.availability === 'loading') return 'WAITING FOR DATA';
  if (quality.availability === 'error') return 'DATA ERROR';
  if (quality.availability === 'empty') return 'NO SESSION DATA';
  if (quality.availability === 'partial') return 'PARTIAL DATA';
  if (quality.freshness === 'stale') return 'STALE DATA';

  switch (quality.provenance) {
    case 'openf1':
      return 'OPENF1 DATA';
    case 'cache':
      return 'CACHED DATA';
    case 'derived':
      return 'DERIVED';
    case 'estimated':
      return 'ESTIMATED';
    case 'demo':
      return 'DEMO SIMULATION';
    default:
      return 'UNAVAILABLE';
  }
}

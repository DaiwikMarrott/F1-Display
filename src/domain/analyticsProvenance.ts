import type { DataProvenance, DataQuality } from '../types/dataQuality';

export type AnalyticsTabKey =
  | 'timing'
  | 'tires'
  | 'sectors'
  | 'gaps'
  | 'strategy'
  | 'form'
  | 'telemetry'
  | 'incidents'
  | 'h2h'
  | 'radio'
  | 'weather';

export function getAnalyticsProvenance(
  tab: AnalyticsTabKey,
  source: DataQuality,
): { provenance: DataProvenance; label: string } {
  if (source.availability === 'loading') {
    return { provenance: 'unavailable', label: 'WAITING FOR DATA' };
  }
  if (source.availability === 'error') {
    return { provenance: 'unavailable', label: 'DATA UNAVAILABLE' };
  }
  if (source.availability === 'empty' || source.provenance === 'unavailable') {
    return { provenance: 'unavailable', label: 'NO SESSION DATA' };
  }
  if (source.provenance === 'demo') {
    return { provenance: 'demo', label: 'DEMO SIMULATION' };
  }

  switch (tab) {
    case 'timing':
      return {
        provenance: source.provenance,
        label: source.availability === 'partial'
          ? 'PARTIAL OPENF1 DATA'
          : source.provenance === 'cache'
            ? 'CACHED OPENF1 DATA'
            : 'OPENF1 DATA',
      };
    case 'tires':
    case 'gaps':
    case 'h2h':
      return { provenance: 'derived', label: 'DERIVED FROM AVAILABLE DATA' };
    case 'sectors':
    case 'strategy':
    case 'form':
    case 'telemetry':
      return { provenance: 'estimated', label: 'ESTIMATED — NOT LIVE TELEMETRY' };
    case 'incidents':
    case 'radio':
    case 'weather':
      return { provenance: 'demo', label: 'DEMO SIMULATION — NOT A LIVE FEED' };
  }
}

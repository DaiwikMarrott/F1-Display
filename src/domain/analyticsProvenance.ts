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
  if (source.provenance === 'replay') {
    switch (tab) {
      case 'timing':
        return { provenance: 'replay', label: 'HISTORICAL REPLAY DATA' };
      case 'tires':
      case 'gaps':
      case 'h2h':
      case 'form':
        return { provenance: 'derived', label: 'DERIVED FROM REPLAY DATA' };
      case 'sectors':
        return { provenance: 'replay', label: 'HISTORICAL REPLAY LAP DATA' };
      case 'strategy':
        return { provenance: 'estimated', label: 'REPLAY ESTIMATE — NOT LIVE TELEMETRY' };
      case 'telemetry':
        return { provenance: 'unavailable', label: 'TELEMETRY UNAVAILABLE — CAR DATA NOT LOADED' };
      case 'incidents':
      case 'radio':
      case 'weather':
        return { provenance: 'demo', label: 'DEMO SIMULATION — NOT REPLAY DATA' };
    }
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
      return { provenance: source.provenance, label: 'OPENF1 LAP SECTOR DATA' };
    case 'form':
      return { provenance: 'derived', label: 'DERIVED FROM VALID LAP RECORDS' };
    case 'strategy':
      return { provenance: 'estimated', label: 'ESTIMATED — NOT LIVE TELEMETRY' };
    case 'telemetry':
      return { provenance: 'unavailable', label: 'TELEMETRY UNAVAILABLE — CAR DATA NOT LOADED' };
    case 'incidents':
    case 'radio':
    case 'weather':
      return { provenance: 'demo', label: 'DEMO SIMULATION — NOT A LIVE FEED' };
  }
}

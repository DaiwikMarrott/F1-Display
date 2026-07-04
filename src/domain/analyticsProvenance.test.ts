import { describe, expect, it } from 'vitest';
import { createDataQuality } from '../types/dataQuality';
import { getAnalyticsProvenance } from './analyticsProvenance';

describe('analytics provenance', () => {
  it('marks all analytics as demo simulation in demo mode', () => {
    expect(getAnalyticsProvenance('telemetry', createDataQuality('demo')).label)
      .toBe('DEMO SIMULATION');
  });

  it('does not label estimated telemetry or radio as live data', () => {
    const source = createDataQuality('openf1');

    expect(getAnalyticsProvenance('telemetry', source).label)
      .toBe('TELEMETRY UNAVAILABLE — CAR DATA NOT LOADED');
    expect(getAnalyticsProvenance('radio', source).label)
      .toBe('DEMO SIMULATION — NOT A LIVE FEED');
  });

  it('keeps timing provenance tied to the underlying source', () => {
    expect(getAnalyticsProvenance('timing', createDataQuality('openf1')).label)
      .toBe('OPENF1 DATA');
    expect(getAnalyticsProvenance('timing', createDataQuality('cache', { freshness: 'fresh' })).label)
      .toBe('CACHED OPENF1 DATA');
    expect(getAnalyticsProvenance('timing', createDataQuality('openf1', { availability: 'partial' })).label)
      .toBe('PARTIAL OPENF1 DATA');
  });

  it('does not claim OpenF1 provenance while session data is unavailable', () => {
    expect(getAnalyticsProvenance('timing', createDataQuality('unavailable', {
      availability: 'loading',
    }))).toEqual({ provenance: 'unavailable', label: 'WAITING FOR DATA' });
    expect(getAnalyticsProvenance('timing', createDataQuality('unavailable', {
      availability: 'empty',
    }))).toEqual({ provenance: 'unavailable', label: 'NO SESSION DATA' });
    expect(getAnalyticsProvenance('timing', createDataQuality('openf1', {
      availability: 'error',
    }))).toEqual({ provenance: 'unavailable', label: 'DATA UNAVAILABLE' });
  });

  it('distinguishes historical replay, replay-derived, and demo-only panels', () => {
    const replay = createDataQuality('replay');
    expect(getAnalyticsProvenance('timing', replay).label).toBe('HISTORICAL REPLAY DATA');
    expect(getAnalyticsProvenance('tires', replay).label).toBe('DERIVED FROM REPLAY DATA');
    expect(getAnalyticsProvenance('telemetry', replay).label)
      .toBe('TELEMETRY UNAVAILABLE — CAR DATA NOT LOADED');
    expect(getAnalyticsProvenance('radio', replay).label)
      .toBe('DEMO SIMULATION — NOT REPLAY DATA');
  });
});

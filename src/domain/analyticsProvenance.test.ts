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
      .toBe('ESTIMATED — NOT LIVE TELEMETRY');
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
});

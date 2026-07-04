import { describe, expect, it, vi } from 'vitest';
import {
  createDataQuality,
  getDataQualityLabel,
  INITIAL_DATA_QUALITY,
} from './dataQuality';

describe('data quality contracts', () => {
  it('starts in an explicit waiting state', () => {
    expect(getDataQualityLabel(INITIAL_DATA_QUALITY)).toBe('WAITING FOR DATA');
  });

  it('labels cached and demo data truthfully', () => {
    expect(getDataQualityLabel(createDataQuality('cache'))).toBe('STALE DATA');
    expect(getDataQualityLabel(createDataQuality('demo'))).toBe('DEMO SIMULATION');
    expect(getDataQualityLabel(createDataQuality('replay'))).toBe('HISTORICAL REPLAY');
  });

  it('supports explicit errors and timestamps', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    const quality = createDataQuality('unavailable', {
      availability: 'error',
      freshness: 'unknown',
      message: 'Rate limited',
    });

    expect(quality.updatedAt).toBe(1234);
    expect(getDataQualityLabel(quality)).toBe('DATA ERROR');
    vi.restoreAllMocks();
  });

  it('labels partial responses explicitly', () => {
    expect(getDataQualityLabel(createDataQuality('openf1', { availability: 'partial' })))
      .toBe('PARTIAL DATA');
  });
});

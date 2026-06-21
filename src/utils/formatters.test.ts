import { describe, expect, it } from 'vitest';
import {
  clampPercent,
  finiteOrNull,
  formatLapProgress,
  formatLapTime,
  formatNumber,
  formatSignedSeconds,
  safeTireAge,
} from './formatters';

describe('safe formatters', () => {
  it('rejects non-finite and impossible values', () => {
    expect(finiteOrNull(Number.NaN)).toBeNull();
    expect(finiteOrNull(Number.POSITIVE_INFINITY)).toBeNull();
    expect(safeTireAge(-4)).toBeNull();
    expect(formatNumber(undefined)).toBe('Unavailable');
  });

  it('clamps percentages', () => {
    expect(clampPercent(-12)).toBe(0);
    expect(clampPercent(140)).toBe(100);
  });

  it('does not render lap zero as an active race', () => {
    expect(formatLapProgress(0, 57)).toBe('Waiting for session data');
    expect(formatLapProgress(58, 57)).toBe('Unavailable');
    expect(formatLapProgress(12, 57)).toBe('LAP 12 / 57');
  });

  it('formats only positive lap times', () => {
    expect(formatLapTime(90.125)).toBe('1:30.125');
    expect(formatLapTime(0)).toBe('Unavailable');
    expect(formatLapTime(null)).toBe('Unavailable');
  });

  it('formats signed seconds without a double sign', () => {
    expect(formatSignedSeconds(4.2)).toBe('+4.2s');
    expect(formatSignedSeconds(-4.2)).toBe('−4.2s');
    expect(formatSignedSeconds(Number.NaN)).toBe('Unavailable');
  });
});

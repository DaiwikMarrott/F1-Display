import { describe, expect, it } from 'vitest';
import { getTooltipPosition } from './tooltipPosition';

describe('tooltip positioning', () => {
  it('keeps tooltips within every viewport edge', () => {
    expect(getTooltipPosition(1270, 710, 1280, 720)).toEqual({
      left: 1034,
      top: 528,
    });
    expect(getTooltipPosition(0, 0, 320, 240)).toEqual({
      left: 16,
      top: 12,
    });
  });
});

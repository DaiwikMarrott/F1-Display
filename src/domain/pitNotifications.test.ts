import { describe, expect, it } from 'vitest';
import {
  plausiblePitDuration,
  shouldEmitPitNotifications,
} from './pitNotifications';

describe('pit notification guards', () => {
  it('does not emit historical stops on initial or completed-session loads', () => {
    expect(shouldEmitPitNotifications(false, 10, 10)).toBe(false);
    expect(shouldEmitPitNotifications(true, null, 10)).toBe(false);
    expect(shouldEmitPitNotifications(true, 9, 10)).toBe(false);
    expect(shouldEmitPitNotifications(true, 10, 10)).toBe(true);
  });

  it('removes implausible pit durations', () => {
    expect(plausiblePitDuration(22.4)).toBe(22.4);
    expect(plausiblePitDuration(777.7)).toBeUndefined();
    expect(plausiblePitDuration(-1)).toBeUndefined();
    expect(plausiblePitDuration(Number.NaN)).toBeUndefined();
  });
});

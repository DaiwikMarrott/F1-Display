import { describe, expect, it } from 'vitest';
import { fulfilledArray, hasRejected } from './settled';

describe('partial OpenF1 responses', () => {
  it('never substitutes demo records for a rejected endpoint', () => {
    const rejected: PromiseRejectedResult = {
      status: 'rejected',
      reason: new Error('rate limited'),
    };

    expect(fulfilledArray(rejected)).toEqual([]);
  });

  it('marks a request group partial when any endpoint rejects', () => {
    expect(hasRejected([
      { status: 'fulfilled', value: [] },
      { status: 'rejected', reason: new Error('offline') },
    ])).toBe(true);
  });
});

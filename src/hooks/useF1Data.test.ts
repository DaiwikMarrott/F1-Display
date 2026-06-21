import { describe, expect, it } from 'vitest';
import { buildDemoStandings } from './useF1Data';

describe('demo race data', () => {
  it('is seeded and deterministic for the same lap', () => {
    expect(buildDemoStandings(20)).toEqual(buildDemoStandings(20));
  });

  it('changes predictably when the demo lap advances', () => {
    expect(buildDemoStandings(21)).not.toEqual(buildDemoStandings(20));
  });
});

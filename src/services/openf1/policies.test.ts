import { describe, expect, it } from 'vitest';
import { getCachePolicy } from './policies';

describe('OpenF1 endpoint cache policies', () => {
  it('defines policies for every supported analytics and replay endpoint', () => {
    const endpoints = [
      '/sessions?year=2025',
      '/meetings?year=2025',
      '/drivers?session_key=1',
      '/position?session_key=1',
      '/intervals?session_key=1',
      '/laps?session_key=1',
      '/stints?session_key=1',
      '/pit?session_key=1',
      '/location?session_key=1',
      '/car_data?session_key=1',
      '/race_control?session_key=1',
      '/weather?session_key=1',
      '/team_radio?session_key=1',
    ];

    for (const endpoint of endpoints) {
      const policy = getCachePolicy(endpoint);
      expect(policy.ttlMs).toBeGreaterThan(0);
      expect(policy.staleMs).toBeGreaterThan(policy.ttlMs);
    }
  });
});

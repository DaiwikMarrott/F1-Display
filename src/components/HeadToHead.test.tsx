import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDemoStandings } from '../hooks/useF1Data';
import { calculateAnalytics } from '../hooks/useAnalytics';
import { loadSeasonSummary } from '../services/openf1/seasonSummary';
import HeadToHead from './HeadToHead';

vi.mock('../services/openf1/seasonSummary', () => ({
  loadSeasonSummary: vi.fn(),
}));

const standings = buildDemoStandings(20).slice(0, 2);
const analytics = calculateAnalytics(standings, 20, 57);
const races = [{
  session_key: 1,
  date_start: '2026-01-01T12:00:00Z',
  date_end: '2026-01-01T14:00:00Z',
  country_name: 'Test',
  circuit_short_name: 'Test',
  session_name: 'Race',
  session_type: 'Race',
  status: 'completed',
}];

const summary = {
  racesAnalyzed: 1,
  averageFinish: 2,
  bestFinish: 2,
  podiums: 1,
  wins: 0,
  points: 18,
  lastResult: 2,
};

describe('HeadToHead season states', () => {
  beforeEach(() => {
    vi.mocked(loadSeasonSummary).mockReset();
  });

  it('resolves loading to success', async () => {
    vi.mocked(loadSeasonSummary).mockResolvedValue(summary);
    render(<HeadToHead standings={standings} analytics={analytics} availableRaces={races} />);

    expect(screen.getByText('Loading recent race results')).toBeInTheDocument();
    expect(await screen.findByText('Based on up to 1 recent races')).toBeInTheDocument();
  });

  it('resolves loading to empty', async () => {
    vi.mocked(loadSeasonSummary).mockResolvedValue(null);
    render(<HeadToHead standings={standings} analytics={analytics} availableRaces={races} />);

    expect(await screen.findByText('No completed race results found for these drivers')).toBeInTheDocument();
  });

  it('resolves loading to error with retry', async () => {
    vi.mocked(loadSeasonSummary).mockRejectedValue(new Error('offline'));
    render(<HeadToHead standings={standings} analytics={analytics} availableRaces={races} />);

    expect(await screen.findByText('Unable to load recent race results')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});

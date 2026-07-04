import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDemoStandings, useF1Data } from './hooks/useF1Data';
import useAnalytics, { calculateAnalytics } from './hooks/useAnalytics';
import App from './App';
import { INITIAL_TRACK_MAP_DATA } from './types/map';

vi.mock('./hooks/useF1Data', async importOriginal => {
  const actual = await importOriginal<typeof import('./hooks/useF1Data')>();
  return {
    ...actual,
    useF1Data: vi.fn(),
  };
});

vi.mock('./hooks/useAnalytics', async importOriginal => {
  const actual = await importOriginal<typeof import('./hooks/useAnalytics')>();
  return {
    ...actual,
    default: vi.fn(),
  };
});

vi.mock('./hooks/useIncidentDetection', () => ({
  useIncidentDetection: () => [],
}));

vi.mock('./components/TrackMap', () => ({
  default: () => <div aria-label="track map">Track map</div>,
}));

vi.mock('./services/openf1/seasonSummary', () => ({
  loadSeasonSummary: vi.fn().mockResolvedValue(null),
}));

const standings = buildDemoStandings(20);
const analytics = calculateAnalytics(standings, 20, 57);
const sessions = [
  {
    session_key: 1,
    session_name: 'Race',
    session_type: 'Race',
    status: 'completed',
    date_start: '2026-06-01T12:00:00Z',
    date_end: '2026-06-01T14:00:00Z',
    circuit_short_name: 'Catalunya',
    country_name: 'Spain',
    meeting_key: 1,
  },
  {
    session_key: 2,
    session_name: 'Practice 1',
    session_type: 'Practice',
    status: 'completed',
    date_start: '2026-05-30T12:00:00Z',
    date_end: '2026-05-30T13:00:00Z',
    circuit_short_name: 'Catalunya',
    country_name: 'Spain',
    meeting_key: 1,
  },
];

describe('App critical UI flows', () => {
  beforeEach(() => {
    vi.mocked(useF1Data).mockReturnValue({
      standings,
      session: sessions[0],
      currentLap: 20,
      totalLaps: 57,
      pitNotifications: [],
      isLive: false,
      isLoading: false,
      error: null,
      dismissPitNotification: vi.fn(),
      availableRaces: sessions,
      selectedRaceKey: null,
      setSelectedRaceKey: vi.fn(),
      dataQuality: {
        provenance: 'demo',
        availability: 'ready',
        freshness: 'fresh',
        updatedAt: 1,
        message: 'Demo fixture',
      },
      mapData: INITIAL_TRACK_MAP_DATA,
      sessionMode: 'completed-static',
      replay: {
        sessionKey: null,
        startMs: null,
        endMs: null,
        timestamp: null,
        elapsedMs: 0,
        durationMs: 0,
        progress: 0,
        isPlaying: false,
        speed: 60,
        play: vi.fn(),
        pause: vi.fn(),
        reset: vi.fn(),
        setSpeed: vi.fn(),
      },
      analyticsLaps: [],
    });
    vi.mocked(useAnalytics).mockReturnValue(analytics);
  });

  it('renders and switches through every major analytics panel', async () => {
    const user = userEvent.setup();
    render(<App />);

    const panels = [
      ['⏱ TIMING', 'TIMING TOWER'],
      ['🛞 TIRES', 'TIRE STRATEGY'],
      ['📊 SECTOR', 'SECTOR ANALYSIS'],
      ['🎯 GAPS', 'GAP ANALYSIS'],
      ['🧠 STRAT', 'STRATEGY ADVISOR'],
      ['📈 FORM', 'FORM AND MOMENTUM'],
      ['📡 TELEM', 'TELEMETRY'],
      ['🚨 ALERT', 'INCIDENTS'],
      ['⚔️ H2H', 'HEAD-TO-HEAD'],
      ['🎧 RADIO', 'TEAM RADIO'],
      ['☁️ WTHR', 'WEATHER IMPACT'],
    ] as const;

    for (const [buttonName, panelHeading] of panels) {
      await user.click(screen.getByRole('button', { name: buttonName }));
      expect(screen.getByText(panelHeading)).toBeInTheDocument();
      expect(screen.getAllByText(/DEMO SIMULATION/).length).toBeGreaterThan(0);
    }
  });

  it('shows truthful session labels in the selector', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Select session' }));

    expect(screen.getByRole('group', { name: '2026 Spain Grand Prix' })).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: '2026 · Spain · Catalunya · Spain Grand Prix · Race',
    })).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: '2026 · Spain · Catalunya · Spain Grand Prix · Practice 1',
    })).toBeInTheDocument();
  });

  it('closes the session selector with Escape or an outside click', async () => {
    const user = userEvent.setup();
    render(<App />);
    const selector = screen.getByRole('button', { name: 'Select session' });

    await user.click(selector);
    expect(selector).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(selector).toHaveAttribute('aria-expanded', 'false');

    await user.click(selector);
    await user.click(screen.getByText('WIN PROBABILITY (EST.)'));
    expect(selector).toHaveAttribute('aria-expanded', 'false');
  });

  it('uses session-aware headings and hides race-only projections for practice', () => {
    vi.mocked(useF1Data).mockReturnValue({
      ...vi.mocked(useF1Data)(),
      session: sessions[1],
      currentLap: 0,
      totalLaps: 0,
    });

    render(<App />);

    expect(screen.getByText('PRACTICE 1 ORDER')).toBeInTheDocument();
    expect(screen.queryByText('WIN PROBABILITY (EST.)')).not.toBeInTheDocument();
    expect(screen.queryByText('REMAINING')).not.toBeInTheDocument();
  });

  it('renders an honest empty state for an upcoming race', () => {
    vi.mocked(useF1Data).mockReturnValue({
      ...vi.mocked(useF1Data)(),
      standings: [],
      session: {
        ...sessions[0],
        session_key: 3,
        status: 'upcoming',
        date_start: '2099-06-01T12:00:00Z',
        date_end: '2099-06-01T14:00:00Z',
      },
      currentLap: 0,
      totalLaps: 0,
      dataQuality: {
        provenance: 'unavailable',
        availability: 'empty',
        freshness: 'unknown',
        updatedAt: null,
        message: 'Upcoming session',
      },
    });

    render(<App />);

    expect(screen.getByText('Race · UPCOMING')).toBeInTheDocument();
    expect(screen.getByText('RACE ORDER')).toBeInTheDocument();
    expect(screen.queryByText('WIN PROBABILITY (EST.)')).not.toBeInTheDocument();
    expect(screen.queryByText('REMAINING')).not.toBeInTheDocument();
    expect(screen.getAllByText('NO SESSION DATA').length).toBeGreaterThan(0);
    expect(screen.queryByText('OPENF1 DATA')).not.toBeInTheDocument();
  });

  it('does not carry position-change history across session identity changes', () => {
    const current = vi.mocked(useF1Data)();
    const { container, rerender } = render(<App />);

    expect(container.querySelector('.position-change')).not.toBeInTheDocument();

    vi.mocked(useF1Data).mockReturnValue({
      ...current,
      session: sessions[1],
      standings: [{
        ...standings[0],
        position: standings[0].position + 1,
      }],
      currentLap: 0,
      totalLaps: 0,
    });
    rerender(<App />);

    expect(screen.getByText('PRACTICE 1 ORDER')).toBeInTheDocument();
    expect(container.querySelector('.position-change')).not.toBeInTheDocument();
  });

  it('keeps impossible numeric and placeholder strings out of a normal render', () => {
    const { container } = render(<App />);

    expect(container.textContent).not.toMatch(/\b(?:NaN|Infinity|undefined|null)\b|\+-/);
  });

  it('labels completed-session replay and exposes deterministic controls', () => {
    vi.mocked(useF1Data).mockReturnValue({
      ...vi.mocked(useF1Data)(),
      sessionMode: 'replay',
      replay: {
        ...vi.mocked(useF1Data)().replay,
        sessionKey: 1,
        timestamp: sessions[0].date_start,
        durationMs: 7_200_000,
        isPlaying: true,
      },
    });

    render(<App />);

    expect(screen.getByText('HISTORICAL REPLAY')).toBeInTheDocument();
    expect(screen.getByText('Race · REPLAY')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause replay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset replay' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Replay speed' })).toHaveValue('60');
  });
});

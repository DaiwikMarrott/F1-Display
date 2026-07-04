import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { DriverStanding, Location, Session } from '../types/f1';
import { createDataQuality } from '../types/dataQuality';
import type { TrackMapData } from '../types/map';
import TrackMap from './TrackMap';

function session(overrides: Partial<Session>): Session {
  return {
    session_key: 1,
    meeting_key: 1,
    session_name: 'Race',
    session_type: 'Race',
    status: 'completed',
    date_start: '2026-06-01T12:00:00Z',
    date_end: '2026-06-01T14:00:00Z',
    circuit_short_name: 'Las Vegas',
    country_name: 'United States',
    ...overrides,
  };
}

function mapData(overrides: Partial<TrackMapData> = {}): TrackMapData {
  return {
    geometry: [],
    positions: [],
    quality: createDataQuality('unavailable', { availability: 'empty' }),
    mode: 'unavailable',
    snapshotAt: null,
    ...overrides,
  };
}

function location(index: number, driver = 1): Location {
  return {
    driver_number: driver,
    x: index * 100,
    y: Math.sin(index / 3) * 700,
    z: 0,
    date: `2026-06-01T12:00:${String(index).padStart(2, '0')}Z`,
    session_key: 1,
    meeting_key: 1,
  };
}

const standing: DriverStanding = {
  driver: {
    driver_number: 1,
    broadcast_name: 'TEST DRIVER',
    full_name: 'Test Driver',
    name_acronym: 'TST',
    team_name: 'Test Team',
    team_colour: 'FFFFFF',
    session_key: 1,
  },
  position: 1,
  gapToLeader: 'LEADER',
  lastLap: 90,
  bestLap: 89,
  isFastestLap: true,
  currentStint: null,
  tireAge: 5,
  pitCount: 0,
  location: null,
  winProbability: 100,
};

describe('TrackMap circuit states', () => {
  it('renders the selected circuit instead of a country fallback', () => {
    render(
      <TrackMap
        standings={[]}
        session={session({})}
        currentLap={0}
        isLoading={false}
        mapData={mapData()}
      />,
    );

    expect(screen.getByText('Las Vegas Grand Prix')).toBeInTheDocument();
    expect(screen.getByLabelText('Las Vegas Grand Prix track map')).toBeInTheDocument();
    expect(screen.queryByText('Miami International Autodrome')).not.toBeInTheDocument();
  });

  it('renders an explicit unavailable state for unknown circuits', () => {
    render(
      <TrackMap
        standings={[]}
        session={session({ circuit_short_name: 'Imaginary Ring' })}
        currentLap={0}
        isLoading={false}
        mapData={mapData()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Circuit layout unavailable');
    expect(screen.queryByLabelText(/track map/)).not.toBeInTheDocument();
  });

  it('labels upcoming sessions without presenting position data', () => {
    render(
      <TrackMap
        standings={[]}
        session={session({
          date_start: '2099-06-01T12:00:00Z',
          date_end: '2099-06-01T14:00:00Z',
        })}
        currentLap={0}
        isLoading={false}
        mapData={mapData()}
      />,
    );

    expect(screen.getByText('UPCOMING — NO POSITION DATA')).toBeInTheDocument();
  });

  it('replaces the map identity when the selected session changes', () => {
    const { rerender } = render(
      <TrackMap
        standings={[]}
        session={session({})}
        currentLap={0}
        isLoading={false}
        mapData={mapData()}
      />,
    );

    expect(screen.getByLabelText('Las Vegas Grand Prix track map')).toBeInTheDocument();

    rerender(
      <TrackMap
        standings={[]}
        session={session({
          session_key: 2,
          meeting_key: 2,
          circuit_short_name: 'Miami',
        })}
        currentLap={0}
        isLoading={false}
        mapData={mapData()}
      />,
    );

    expect(screen.getByLabelText('Miami International Autodrome track map')).toBeInTheDocument();
    expect(screen.queryByLabelText('Las Vegas Grand Prix track map')).not.toBeInTheDocument();
  });

  it('switches canonical geometry and identity from Japan to Monaco', () => {
    const { container, rerender } = render(
      <TrackMap
        standings={[]}
        session={session({
          year: 2025,
          meeting_name: 'Japanese Grand Prix',
          circuit_short_name: 'Suzuka',
          country_name: 'Japan',
        })}
        currentLap={0}
        isLoading={false}
        mapData={mapData()}
      />,
    );

    expect(screen.getByLabelText('Suzuka International Racing Course track map')).toBeInTheDocument();
    expect(container.querySelector('.track-map')).toHaveAttribute('data-circuit-id', 'japan');
    expect(container.querySelector('.track-map')).toHaveAttribute('data-season', '2025');

    rerender(
      <TrackMap
        standings={[]}
        session={session({
          session_key: 2,
          meeting_key: 2,
          year: 2024,
          meeting_name: 'Monaco Grand Prix',
          circuit_short_name: 'Monte Carlo',
          country_name: 'Monaco',
        })}
        currentLap={0}
        isLoading={false}
        mapData={mapData()}
      />,
    );

    expect(screen.getByLabelText('Circuit de Monaco track map')).toBeInTheDocument();
    expect(screen.queryByLabelText('Suzuka International Racing Course track map')).not.toBeInTheDocument();
    expect(container.querySelector('.track-map')).toHaveAttribute('data-circuit-id', 'monaco');
    expect(container.querySelector('.track-map')).toHaveAttribute('data-event-name', 'Monaco Grand Prix');
  });

  it('exposes marker details to keyboard focus and clears them on session change', async () => {
    const user = userEvent.setup();
    const geometry = Array.from({ length: 30 }, (_, index) => location(index));
    const positions = [location(10)];
    const { rerender } = render(
      <TrackMap
        standings={[standing]}
        session={session({})}
        currentLap={10}
        isLoading={false}
        mapData={mapData({
          geometry,
          positions,
          mode: 'latest-known',
          quality: createDataQuality('openf1'),
        })}
      />,
    );

    await user.tab();
    expect(screen.getByRole('button', {
      name: 'Position 1, Test Driver, Test Team',
    })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Test Driver');

    rerender(
      <TrackMap
        standings={[]}
        session={session({ session_key: 2, meeting_key: 2, circuit_short_name: 'Miami' })}
        currentLap={0}
        isLoading={false}
        mapData={mapData()}
      />,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

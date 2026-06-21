import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Session } from '../types/f1';
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
});

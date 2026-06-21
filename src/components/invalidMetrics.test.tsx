import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DriverStanding } from '../types/f1';
import type { StrategyRecommendation } from '../types/analytics';
import TimingTower from './TimingTower';
import StrategyAdvisor from './StrategyAdvisor';
import WeatherPanel from './WeatherPanel';

const standing: DriverStanding = {
  driver: {
    driver_number: 1,
    broadcast_name: 'TEST DRIVER',
    full_name: 'Test Driver',
    name_acronym: 'TST',
    team_name: 'Test',
    team_colour: 'FFFFFF',
    session_key: 1,
  },
  position: 1,
  gapToLeader: 'LEADER',
  lastLap: 0,
  bestLap: null,
  isFastestLap: false,
  currentStint: null,
  tireAge: -5,
  pitCount: 0,
  location: null,
  winProbability: 100,
};

describe('invalid metric fallbacks', () => {
  it('does not render lap zero, zero-second times, or negative tire age', () => {
    render(<TimingTower standings={[standing]} currentLap={0} totalLaps={57} />);

    expect(screen.getByText('Waiting for session data')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('-5')).not.toBeInTheDocument();
  });

  it('formats negative gains without a double sign', () => {
    const strategy: StrategyRecommendation = {
      driver_number: 1,
      currentStrategy: 'neutral',
      recommendedAction: 'monitor',
      fuelBurnPerLap: 1.5,
      estimatedFuelRemaining: 20,
      fuelSavingPotential: 1,
      optimalNextStop: { lapNumber: 20, compound: 'MEDIUM', gainSeconds: -4.1 },
      whatIfScenarios: [{
        label: 'Stay out',
        action: 'stay-out',
        compound: 'MEDIUM',
        pitLap: 20,
        projectedFinishPosition: 1,
        projectedTimeGain: -2.5,
        confidence: 70,
      }],
      predictedFinishPosition: 1,
      riskLevel: 'low',
      confidence: 80,
    };

    render(
      <StrategyAdvisor
        strategies={new Map([[1, strategy]])}
        standings={[{ ...standing, tireAge: 5 }]}
        currentLap={10}
        totalLaps={57}
      />,
    );

    expect(screen.getByText('−4.1s')).toBeInTheDocument();
    expect(screen.getByText('Gain −2.5s')).toBeInTheDocument();
    expect(screen.queryByText(/\+-/)).not.toBeInTheDocument();
  });

  it('does not calculate weather from an invalid race length', () => {
    render(<WeatherPanel currentLap={0} totalLaps={0} />);

    expect(screen.getByText('Waiting for session data')).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });
});

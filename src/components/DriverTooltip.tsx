import React from 'react';
import type { DriverStanding, Stint } from '../types/f1';
import './DriverTooltip.css';
import { safeTireAge } from '../utils/formatters';
import { getTooltipPosition } from '../utils/tooltipPosition';

interface Props {
  standing: DriverStanding;
  x: number;
  y: number;
}

function getCompoundColor(compound: Stint['compound'] | undefined): string {
  switch (compound) {
    case 'SOFT':         return '#e8002d';
    case 'MEDIUM':       return '#f5c842';
    case 'HARD':         return '#d4d4d4';
    case 'INTERMEDIATE': return '#39b54a';
    case 'WET':          return '#0073e6';
    default:             return '#555566';
  }
}

function getCompoundLabel(compound: Stint['compound'] | undefined): string {
  switch (compound) {
    case 'SOFT':         return 'SOFT';
    case 'MEDIUM':       return 'MEDIUM';
    case 'HARD':         return 'HARD';
    case 'INTERMEDIATE': return 'INTER';
    case 'WET':          return 'WET';
    default:             return 'UNKNOWN';
  }
}

function estimateTemp(compound: Stint['compound'] | undefined, age: number): number {
  const base: Record<string, number> = {
    SOFT: 105,
    MEDIUM: 95,
    HARD: 88,
    INTERMEDIATE: 72,
    WET: 60,
  };
  const b = base[compound ?? ''] ?? 90;
  // Temperature rises with age then drops off
  const ageFactor = Math.min(age * 0.8, 20) - Math.max(0, (age - 20) * 0.5);
  return Math.round(b + ageFactor);
}

const DriverTooltip: React.FC<Props> = ({ standing, x, y }) => {
  const { driver, currentStint, tireAge, pitCount } = standing;
  const compound = currentStint?.compound;
  const compoundColor = getCompoundColor(compound);
  const compoundLabel = getCompoundLabel(compound);
  const estimatedTemp = estimateTemp(compound, tireAge);
  const teamColor = `#${driver.team_colour || 'ffffff'}`;

  const position = getTooltipPosition(
    x,
    y,
    typeof window === 'undefined' ? 1280 : window.innerWidth,
    typeof window === 'undefined' ? 720 : window.innerHeight,
  );

  return (
    <div
      className="driver-tooltip"
      style={{ left: position.left, top: position.top }}
      role="tooltip"
    >
      <div className="driver-tooltip__header" style={{ borderLeftColor: teamColor }}>
        <span className="driver-tooltip__number" style={{ color: teamColor }}>
          {driver.driver_number}
        </span>
        <div>
          <div className="driver-tooltip__name">{driver.full_name}</div>
          <div className="driver-tooltip__team">{driver.team_name}</div>
        </div>
      </div>

      <div className="driver-tooltip__body">
        <div className="driver-tooltip__row">
          <span className="dt-label">COMPOUND</span>
          <span className="dt-value">
            <span
              className="compound-dot"
              style={{ backgroundColor: compoundColor }}
            />
            {compoundLabel}
          </span>
        </div>
        <div className="driver-tooltip__row">
          <span className="dt-label">TYRE AGE</span>
          <span className="dt-value">
            {safeTireAge(tireAge) === null ? 'Unavailable' : `${safeTireAge(tireAge)} laps`}
          </span>
        </div>
        <div className="driver-tooltip__row">
          <span className="dt-label">EST. TEMP</span>
          <span
            className="dt-value dt-temp"
            style={{ color: estimatedTemp > 100 ? '#e8002d' : estimatedTemp > 85 ? '#f5a623' : '#39b54a' }}
          >
            {estimatedTemp}°C
          </span>
        </div>
        <div className="driver-tooltip__row">
          <span className="dt-label">PIT STOPS</span>
          <span className="dt-value">{pitCount}</span>
        </div>
      </div>
    </div>
  );
};

export default DriverTooltip;

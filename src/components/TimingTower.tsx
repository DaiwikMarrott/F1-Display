import React, { useEffect, useState } from 'react';
import type { DriverStanding, Stint } from '../types/f1';
import DriverTooltip from './DriverTooltip';
import { formatLapProgress, formatLapTime } from '../utils/formatters';
import './TimingTower.css';

interface Props {
  standings: DriverStanding[];
  currentLap: number;
  totalLaps: number;
}

function getCompoundClass(compound: Stint['compound'] | undefined): string {
  switch (compound) {
    case 'SOFT':         return 'timing-compound--soft';
    case 'MEDIUM':       return 'timing-compound--medium';
    case 'HARD':         return 'timing-compound--hard';
    case 'INTERMEDIATE': return 'timing-compound--inter';
    case 'WET':          return 'timing-compound--wet';
    default:             return 'timing-compound--unknown';
  }
}

function getCompoundLetter(compound: Stint['compound'] | undefined): string {
  switch (compound) {
    case 'SOFT':         return 'S';
    case 'MEDIUM':       return 'M';
    case 'HARD':         return 'H';
    case 'INTERMEDIATE': return 'I';
    case 'WET':          return 'W';
    default:             return '?';
  }
}

const TimingTower: React.FC<Props> = ({ standings, currentLap, totalLaps }) => {
  const [hoveredDriver, setHoveredDriver] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (driverNumber: number, e: React.MouseEvent) => {
    setHoveredDriver(driverNumber);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredDriver(null);
  };

  const hoveredStanding = standings.find(s => s.driver.driver_number === hoveredDriver);

  useEffect(() => {
    if (hoveredDriver !== null && !hoveredStanding) {
      setHoveredDriver(null);
    }
  }, [hoveredDriver, hoveredStanding]);

  return (
    <div className="timing-tower">
      <div className="timing-tower__header">
        <span className="timing-tower__title">TIMING TOWER</span>
        <span className="timing-tower__lap">
          {formatLapProgress(currentLap, totalLaps)}
        </span>
      </div>

      <div className="timing-tower__col-headers">
        <span className="col-pos">POS</span>
        <span className="col-driver">DRIVER</span>
        <span className="col-gap">GAP</span>
        <span className="col-lap">LAST LAP</span>
        <span className="col-tyre">TYRE</span>
      </div>

      <div className="timing-tower__rows">
        {standings.map((s) => {
          const teamColor = `#${s.driver.team_colour || 'ffffff'}`;
          const isLeader = s.position === 1;
          const rowClass = [
            'timing-row',
            isLeader ? 'timing-row--leader' : '',
            s.isFastestLap ? 'timing-row--fastest' : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={s.driver.driver_number}
              className={rowClass}
              onMouseEnter={(e) => handleMouseEnter(s.driver.driver_number, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div className="timing-row__team-bar" style={{ backgroundColor: teamColor }} />

              <span className="col-pos timing-row__pos">
                {isLeader ? (
                  <span className="pos-leader">{s.position}</span>
                ) : (
                  <span className="pos-number">P{s.position}</span>
                )}
              </span>

              <span className="col-driver timing-row__driver">
                <span className="timing-row__driver-number" style={{ color: teamColor }}>
                  {s.driver.driver_number}
                </span>
                <span className="driver-acronym">{s.driver.name_acronym}</span>
              </span>

              <span className="col-gap timing-row__gap">
                {isLeader ? (
                  <span className="gap-leader">LEADER</span>
                ) : (
                  s.gapToLeader
                )}
              </span>

              <span className={`col-lap timing-row__lastlap ${s.isFastestLap ? 'fastest-lap' : ''}`}>
                {formatLapTime(s.lastLap)}
                {s.isFastestLap && <span className="timing-row__fl-badge">FL</span>}
              </span>

              <span className="col-tyre">
                <span className={`tyre-badge ${getCompoundClass(s.currentStint?.compound)}`}>
                  {getCompoundLetter(s.currentStint?.compound)}
                </span>
                <span className="timing-row__tyre-age">{s.tireAge >= 0 ? s.tireAge : '—'}</span>
              </span>
            </div>
          );
        })}
      </div>

      {hoveredStanding && (
        <DriverTooltip
          standing={hoveredStanding}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}
    </div>
  );
};

export default TimingTower;

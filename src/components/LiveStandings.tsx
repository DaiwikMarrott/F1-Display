import React, { useState, useEffect, useRef } from 'react';
import type { DriverStanding, Stint } from '../types/f1';
import './LiveStandings.css';

interface Props {
  standings: DriverStanding[];
  currentLap: number;
  totalLaps: number;
}

interface PositionTracker {
  driverNumber: number;
  prevPosition: number;
  currentPosition: number;
  changeIndicator: 'up' | 'down' | 'same';
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

function formatLapTime(seconds: number | null): string {
  if (seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${mins}:${secs}`;
}

const LiveStandings: React.FC<Props> = ({ standings, currentLap, totalLaps }) => {
  const [positionTrackers, setPositionTrackers] = useState<Map<number, PositionTracker>>(new Map());
  const prevStandingsRef = useRef<DriverStanding[]>([]);
  const [animatingDrivers, setAnimatingDrivers] = useState<Set<number>>(new Set());

  // Track position changes
  useEffect(() => {
    const trackers = new Map<number, PositionTracker>();
    const newAnimatingDrivers = new Set<number>();

    standings.forEach(standing => {
      const prevStanding = prevStandingsRef.current.find(
        s => s.driver.driver_number === standing.driver.driver_number
      );
      const prevPosition = prevStanding?.position ?? standing.position;

      let changeIndicator: 'up' | 'down' | 'same' = 'same';
      if (standing.position < prevPosition) {
        changeIndicator = 'up';
        newAnimatingDrivers.add(standing.driver.driver_number);
      } else if (standing.position > prevPosition) {
        changeIndicator = 'down';
        newAnimatingDrivers.add(standing.driver.driver_number);
      }

      trackers.set(standing.driver.driver_number, {
        driverNumber: standing.driver.driver_number,
        prevPosition,
        currentPosition: standing.position,
        changeIndicator,
      });
    });

    setPositionTrackers(trackers);
    setAnimatingDrivers(newAnimatingDrivers);

    // Remove animation after 2 seconds
    const timer = setTimeout(() => {
      setAnimatingDrivers(new Set());
    }, 2000);

    prevStandingsRef.current = standings;
    return () => clearTimeout(timer);
  }, [standings]);

  const lapsRemaining = Math.max(0, totalLaps - currentLap);
  const raceProgress = totalLaps > 0 ? (currentLap / totalLaps) * 100 : 0;

  return (
    <div className="live-standings">
      <div className="live-standings__header">
        <div className="live-standings__title">LIVE STANDINGS</div>
        <div className="live-standings__race-info">
          <div className="race-info__lap">
            <span className="lap-label">LAP</span>
            <span className="lap-current">{currentLap}</span>
            <span className="lap-separator">/</span>
            <span className="lap-total">{totalLaps}</span>
          </div>
          <div className="race-info__remaining">
            <span className="remaining-label">REMAINING</span>
            <span className="remaining-count">{lapsRemaining}</span>
          </div>
        </div>
      </div>

      <div className="live-standings__progress">
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${raceProgress}%` }} />
        </div>
      </div>

      <div className="live-standings__list">
        {standings.slice(0, 10).map((standing, index) => {
          const teamColor = `#${standing.driver.team_colour || 'ffffff'}`;
          const tracker = positionTrackers.get(standing.driver.driver_number);
          const isAnimating = animatingDrivers.has(standing.driver.driver_number);
          const isLeader = standing.position === 1;
          const compound = standing.currentStint?.compound;
          const gapText = standing.gapToLeader === 'LEADER' ? '—' : standing.gapToLeader;

          return (
            <div
              key={standing.driver.driver_number}
              className={`standings-row ${isLeader ? 'standings-row--leader' : ''} ${
                isAnimating ? `standings-row--animate-${tracker?.changeIndicator}` : ''
              }`}
              style={{
                animation: isAnimating ? `slideIn${tracker?.changeIndicator === 'up' ? 'Up' : 'Down'} 0.6s ease-out` : 'none',
              }}
            >
              {/* Position Badge */}
              <div className="standings-row__position-badge" style={{ borderColor: teamColor }}>
                <span className="position-number">{standing.position}</span>
                {tracker && tracker.changeIndicator !== 'same' && (
                  <span className={`position-change position-change--${tracker.changeIndicator}`}>
                    {tracker.changeIndicator === 'up' ? '↑' : '↓'}
                  </span>
                )}
              </div>

              {/* Team Bar */}
              <div className="standings-row__team-bar" style={{ backgroundColor: teamColor }} />

              {/* Driver Info */}
              <div className="standings-row__driver-info">
                <div className="driver-header">
                  <span className="driver-number" style={{ color: teamColor }}>
                    #{standing.driver.driver_number}
                  </span>
                  <span className="driver-name">{standing.driver.broadcast_name}</span>
                  <span className="driver-team">{standing.driver.team_name}</span>
                </div>
                <div className="driver-footer">
                  <span className="gap-to-leader">GAP: {gapText}</span>
                </div>
              </div>

              {/* Lap Time */}
              <div className="standings-row__laptime">
                <span className="laptime-label">LAST</span>
                <span className={`laptime-value ${standing.isFastestLap ? 'fastest' : ''}`}>
                  {formatLapTime(standing.lastLap)}
                  {standing.isFastestLap && <span className="fl-badge">FL</span>}
                </span>
              </div>

              {/* Tire Info */}
              <div className="standings-row__tire">
                <span className={`tire-compound compound-${compound?.toLowerCase()}`}>
                  {getCompoundLetter(compound)}
                </span>
                <span className="tire-age">{standing.tireAge} laps</span>
              </div>

              {/* Pit Stops */}
              <div className="standings-row__pitstops">
                <span className="pitstops-label">STOPS</span>
                <span className="pitstops-count">{standing.pitCount}</span>
              </div>

              {/* Win Probability */}
              {standing.winProbability > 0 && (
                <div className="standings-row__winprob">
                  <div className="winprob-bar">
                    <div
                      className="winprob-bar__fill"
                      style={{
                        width: `${standing.winProbability}%`,
                        backgroundColor: teamColor,
                      }}
                    />
                  </div>
                  <span className="winprob-value">{standing.winProbability.toFixed(1)}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {standings.length > 10 && (
        <div className="live-standings__more">
          +{standings.length - 10} more drivers
        </div>
      )}
    </div>
  );
};

export default LiveStandings;

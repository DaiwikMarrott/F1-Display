import React from 'react';
import { GapTrend } from '../types/analytics';
import './GapAnalysis.css';

interface Props {
  gapTrends: Map<number, GapTrend>;
  standings: any[];
  currentLap: number;
  totalLaps: number;
}

/**
 * GapAnalysis Component
 * Displays gap trends, DRS window, and overtake predictions
 * Helps users understand race dynamics and potential overtakes
 */
export default function GapAnalysis({ gapTrends, standings, currentLap, totalLaps }: Props) {
  if (!gapTrends || gapTrends.size === 0) {
    return (
      <div className="gap-analysis">
        <div className="gap-analysis__header">
          <h2 className="gap-analysis__title">GAP ANALYSIS</h2>
          <span className="gap-analysis__lap">LAP {currentLap} / {totalLaps}</span>
        </div>
        <div className="gap-analysis__empty">No data available</div>
      </div>
    );
  }

  const formatGap = (ms: number): string => {
    if (ms === 0) return '0.000s';
    const sign = ms > 0 ? '+' : '';
    const seconds = (ms / 1000).toFixed(3);
    return `${sign}${seconds}s`;
  };

  const formatGapTrend = (ms: number): string => {
    if (!ms) return '0.0s/lap';
    const sign = ms < 0 ? '↓ ' : '↑ ';
    const secondsPerLap = Math.abs(ms / 1000).toFixed(2);
    return `${sign}${secondsPerLap}s/lap`;
  };

  const getGapTrendColor = (gapTrend: number): string => {
    if (gapTrend < -0.5) return 'closing-fast';
    if (gapTrend < -0.1) return 'closing';
    if (gapTrend > 0.5) return 'widening-fast';
    if (gapTrend > 0.1) return 'widening';
    return 'stable';
  };

  const visibleDrivers = Array.from(gapTrends.entries())
    .filter(([driverNum]) => driverNum !== undefined)
    .sort((a, b) => {
      const posA = standings.find(st => st.driver.driver_number === a[0])?.position || 999;
      const posB = standings.find(st => st.driver.driver_number === b[0])?.position || 999;
      return posA - posB;
    });

  return (
    <div className="gap-analysis">
      <div className="gap-analysis__header">
        <h2 className="gap-analysis__title">GAP ANALYSIS</h2>
        <span className="gap-analysis__lap">LAP {currentLap} / {totalLaps}</span>
      </div>

      {/* Column Headers */}
      <div className="gap-analysis__legend">
        <div className="gap-analysis__legend-item">Gap to P1</div>
        <div className="gap-analysis__legend-item">Trend</div>
        <div className="gap-analysis__legend-item">DRS</div>
        <div className="gap-analysis__legend-item">Overtake %</div>
      </div>

      {/* Driver Gap Cards */}
      <div className="gap-analysis__container">
        {visibleDrivers.map(([driverNum, gapData]) => {
          const standing = standings.find(s => s.driver.driver_number === driverNum);
          if (!standing) return null;

          const position = standing.position;
          const driverCode = standing.driver.driver_number_display || `D${driverNum}`;
          const gapMs = gapData.gapToLeader;
          const trendColor = getGapTrendColor(gapData.gapTrend);
          const drsWindow = gapData.drsWindow;
          const overtakeProbability = Math.max(0, Math.min(100, gapData.overtakeProbability));

          // Determine overtake likelihood
          let overtakeLikelihood = 'Low';
          let overtakeClass = 'low';
          if (overtakeProbability > 70) {
            overtakeLikelihood = 'Very High';
            overtakeClass = 'very-high';
          } else if (overtakeProbability > 50) {
            overtakeLikelihood = 'High';
            overtakeClass = 'high';
          } else if (overtakeProbability > 25) {
            overtakeLikelihood = 'Moderate';
            overtakeClass = 'moderate';
          }

          return (
            <div key={driverNum} className="gap-analysis__card">
              {/* Driver Info */}
              <div className="gap-analysis__driver-info">
                <div className="gap-analysis__position">P{position}</div>
                <div className="gap-analysis__driver-code">{driverCode}</div>
              </div>

              {/* Gap to Leader */}
              <div className="gap-analysis__gap">
                <div className="gap-analysis__gap-label">Gap</div>
                <div className="gap-analysis__gap-value">{formatGap(gapMs)}</div>
                <div className={`gap-analysis__gap-bar`}>
                  <div
                    className="gap-analysis__gap-bar-fill"
                    style={{
                      width: `${Math.min(100, (gapMs / 5000) * 100)}%`,
                      opacity: Math.min(1, (gapMs / 5000) + 0.3),
                    }}
                  />
                </div>
              </div>

              {/* Gap Trend */}
              <div className={`gap-analysis__trend gap-analysis__trend--${trendColor}`}>
                <div className="gap-analysis__trend-label">Trend</div>
                <div className="gap-analysis__trend-value">{formatGapTrend(gapData.gapTrend)}</div>
                <div className="gap-analysis__trend-icon">
                  {gapData.gapTrend < -0.1 ? '📉' : gapData.gapTrend > 0.1 ? '📈' : '→'}
                </div>
              </div>

              {/* DRS Window */}
              <div className={`gap-analysis__drs ${drsWindow ? 'gap-analysis__drs--active' : ''}`}>
                <div className="gap-analysis__drs-label">DRS</div>
                <div className="gap-analysis__drs-status">
                  {drsWindow ? '✓ OPEN' : '✗ Closed'}
                </div>
                <div className="gap-analysis__drs-distance">
                  {gapMs > 0 ? `${(gapMs / 1000).toFixed(2)}s` : 'Leader'}
                </div>
              </div>

              {/* Overtake Probability */}
              <div className={`gap-analysis__overtake gap-analysis__overtake--${overtakeClass}`}>
                <div className="gap-analysis__overtake-label">Overtake</div>
                <div className="gap-analysis__overtake-percentage">{Math.round(overtakeProbability)}%</div>
                <div className="gap-analysis__overtake-likelihood">{overtakeLikelihood}</div>
              </div>

              {/* Overtake Timing Estimate */}
              {gapData.lapsUntilOvertake > 0 && gapData.lapsUntilOvertake !== Infinity && (
                <div className="gap-analysis__overtake-timing">
                  <div className="gap-analysis__timing-label">In {gapData.lapsUntilOvertake} laps</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Legend */}
      <div className="gap-analysis__status-legend">
        <span className="gap-analysis__status-item gap-analysis__status-item--closing">📉 Closing gap</span>
        <span className="gap-analysis__status-item gap-analysis__status-item--stable">→ Stable gap</span>
        <span className="gap-analysis__status-item gap-analysis__status-item--widening">📈 Widening gap</span>
        <span className="gap-analysis__status-item gap-analysis__status-item--drs">🔋 DRS Window</span>
      </div>
    </div>
  );
}

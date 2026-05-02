import React from 'react';
import type { TireAnalysis } from '../types/analytics';
import './TireStrategy.css';

interface Props {
  tireAnalysis: Map<number, TireAnalysis>;
  standings: any[];
  currentLap: number;
  totalLaps: number;
}

const COMPOUND_INFO: Record<string, { name: string; color: string; bgColor: string }> = {
  'SOFT': { name: 'SOFT', color: '#FFFFFF', bgColor: '#E8002D' },
  'MEDIUM': { name: 'MEDIUM', color: '#000000', bgColor: '#FFFF00' },
  'HARD': { name: 'HARD', color: '#000000', bgColor: '#FFFFFF' },
  'INTERMEDIATE': { name: 'INT', color: '#FFFFFF', bgColor: '#00B000' },
  'WET': { name: 'WET', color: '#FFFFFF', bgColor: '#0080FF' },
};

const TireStrategy: React.FC<Props> = ({ tireAnalysis, standings, currentLap, totalLaps }) => {
  const getTireStyle = (compound: string) => {
    const info = COMPOUND_INFO[compound] || COMPOUND_INFO['HARD'];
    return {
      backgroundColor: info.bgColor,
      color: info.color,
    };
  };

  const getDegradationStatus = (condition: number): string => {
    if (condition > 75) return 'excellent';
    if (condition > 50) return 'good';
    if (condition > 25) return 'worn';
    return 'critical';
  };

  return (
    <div className="tire-strategy">
      <div className="tire-strategy__header">
        <h2 className="tire-strategy__title">TIRE STRATEGY</h2>
        <span className="tire-strategy__lap">LAP {currentLap}/{totalLaps}</span>
      </div>

      <div className="tire-strategy__scroll">
        <div className="tire-strategy__grid">
          {standings.map(standing => {
            const tire = tireAnalysis.get(standing.driver.driver_number);
            if (!tire) return null;

            const lapsUntilPit = Math.max(0, tire.optimalPitLap - currentLap);
            const conditionStatus = getDegradationStatus(tire.conditionPercent);
            const isPitWindowOpen = lapsUntilPit === 0;

            return (
              <div key={standing.driver.driver_number} className="tire-strategy__card">
                {/* Driver Info */}
                <div className="tire-strategy__driver">
                  <div className="tire-strategy__position">P{standing.position}</div>
                  <div className="tire-strategy__name">
                    <span className="tire-strategy__number">{standing.driver.driver_number}</span>
                    <span className="tire-strategy__acronym">{standing.driver.name_acronym}</span>
                  </div>
                </div>

                {/* Tire Compound */}
                <div 
                  className="tire-strategy__compound"
                  style={getTireStyle(tire.compound)}
                  title={`${tire.compound} compound`}
                >
                  {COMPOUND_INFO[tire.compound]?.name}
                </div>

                {/* Tire Age & Condition */}
                <div className="tire-strategy__age">
                  <div className="tire-strategy__age-value">
                    <span className="tire-strategy__age-number">{tire.age}</span>
                    <span className="tire-strategy__age-max">/{tire.maxAge}</span>
                  </div>
                  <div className={`tire-strategy__condition tire-strategy__condition--${conditionStatus}`}>
                    <div 
                      className="tire-strategy__condition-bar"
                      style={{ width: `${tire.conditionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Degradation Info */}
                <div className="tire-strategy__degradation">
                  <div className="tire-strategy__degradation-label">LOSS:</div>
                  <div className="tire-strategy__degradation-value">
                    {tire.performanceLoss.toFixed(1)}%
                  </div>
                  <div className="tire-strategy__degradation-rate">
                    {tire.degradationRate.toFixed(2)}s/lap
                  </div>
                </div>

                {/* Pit Window */}
                <div className={`tire-strategy__pit-window ${isPitWindowOpen ? 'active' : ''}`}>
                  <div className="tire-strategy__pit-label">PIT:</div>
                  <div className="tire-strategy__pit-value">
                    {isPitWindowOpen ? (
                      <span className="tire-strategy__pit-now">NOW</span>
                    ) : (
                      `L${tire.optimalPitLap}`
                    )}
                  </div>
                  {lapsUntilPit > 0 && lapsUntilPit <= 3 && (
                    <div className="tire-strategy__pit-soon">
                      {lapsUntilPit}L
                    </div>
                  )}
                </div>

                {/* Pit Loss Prediction */}
                <div className="tire-strategy__pit-loss">
                  <div className="tire-strategy__pit-loss-label">LOSS:</div>
                  <div className="tire-strategy__pit-loss-value">
                    {tire.pitLossPredicted.toFixed(1)}s
                  </div>
                </div>

                {/* Strategy Indicator */}
                <div className="tire-strategy__strategy">
                  {tire.performanceLoss < 20 && (
                    <div className="tire-strategy__strategy-badge strategy-fresh">FRESH</div>
                  )}
                  {tire.performanceLoss >= 20 && tire.performanceLoss < 50 && (
                    <div className="tire-strategy__strategy-badge strategy-prime">PRIME</div>
                  )}
                  {tire.performanceLoss >= 50 && (
                    <div className="tire-strategy__strategy-badge strategy-worn">WORN</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="tire-strategy__footer">
        <div className="tire-strategy__legend">
          <div className="tire-strategy__legend-item">
            <div className="tire-strategy__legend-dot excellent" />
            <span>Excellent</span>
          </div>
          <div className="tire-strategy__legend-item">
            <div className="tire-strategy__legend-dot good" />
            <span>Good</span>
          </div>
          <div className="tire-strategy__legend-item">
            <div className="tire-strategy__legend-dot worn" />
            <span>Worn</span>
          </div>
          <div className="tire-strategy__legend-item">
            <div className="tire-strategy__legend-dot critical" />
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TireStrategy;

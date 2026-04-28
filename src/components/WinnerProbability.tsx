import React from 'react';
import type { DriverStanding } from '../types/f1';
import './WinnerProbability.css';

interface Props {
  standings: DriverStanding[];
}

const WinnerProbability: React.FC<Props> = ({ standings }) => {
  const top5 = [...standings]
    .sort((a, b) => b.winProbability - a.winProbability)
    .slice(0, 5);

  const maxProb = top5[0]?.winProbability ?? 1;

  return (
    <div className="win-prob">
      <div className="win-prob__header">
        <span className="win-prob__title">WIN PROBABILITY</span>
      </div>
      <div className="win-prob__list">
        {top5.map((s, rank) => {
          const teamColor = `#${s.driver.team_colour || 'ffffff'}`;
          const barWidth = maxProb > 0 ? (s.winProbability / maxProb) * 100 : 0;
          const pct = s.winProbability.toFixed(1);

          return (
            <div key={s.driver.driver_number} className="win-prob__row">
              <span className="win-prob__rank">{rank + 1}</span>
              <div className="win-prob__driver-info">
                <span className="win-prob__acronym" style={{ color: teamColor }}>
                  {s.driver.name_acronym}
                </span>
                <span className="win-prob__team">{s.driver.team_name}</span>
              </div>
              <div className="win-prob__bar-container">
                <div
                  className="win-prob__bar"
                  style={{ width: `${barWidth}%`, backgroundColor: teamColor }}
                />
              </div>
              <span className="win-prob__pct">{pct}%</span>
            </div>
          );
        })}
      </div>
      <div className="win-prob__footer">
        <span>Based on position, gap &amp; laps remaining</span>
      </div>
    </div>
  );
};

export default WinnerProbability;

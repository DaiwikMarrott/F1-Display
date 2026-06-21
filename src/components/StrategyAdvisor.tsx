import type { StrategyRecommendation } from '../types/analytics';
import type { DriverStanding } from '../types/f1';
import { formatLapProgress, formatSignedSeconds } from '../utils/formatters';
import './StrategyAdvisor.css';

interface Props {
  strategies: Map<number, StrategyRecommendation>;
  standings: DriverStanding[];
  currentLap: number;
  totalLaps: number;
}

const ACTION_LABELS: Record<StrategyRecommendation['recommendedAction'], string> = {
  'pit-now': 'PIT NOW',
  'stay-out': 'STAY OUT',
  monitor: 'MONITOR',
  push: 'PUSH',
};

const ACTION_CLASS: Record<StrategyRecommendation['recommendedAction'], string> = {
  'pit-now': 'critical',
  'stay-out': 'defensive',
  monitor: 'neutral',
  push: 'attack',
};

export default function StrategyAdvisor({ strategies, standings, currentLap, totalLaps }: Props) {
  if (!strategies || strategies.size === 0) {
    return (
      <div className="strategy-advisor">
        <div className="strategy-advisor__header">
          <h2 className="strategy-advisor__title">STRATEGY ADVISOR</h2>
          <span className="strategy-advisor__lap">{formatLapProgress(currentLap, totalLaps)}</span>
        </div>
        <div className="strategy-advisor__empty">No strategy data available</div>
      </div>
    );
  }

  const strategyRows = Array.from(strategies.values())
    .flatMap(strategy => {
      const standing = standings.find(s => s.driver.driver_number === strategy.driver_number);
      return standing ? [{ strategy, standing }] : [];
    })
    .sort((a, b) => a.standing.position - b.standing.position);

  return (
    <div className="strategy-advisor">
      <div className="strategy-advisor__header">
        <h2 className="strategy-advisor__title">STRATEGY ADVISOR</h2>
        <span className="strategy-advisor__lap">{formatLapProgress(currentLap, totalLaps)}</span>
      </div>

      <div className="strategy-advisor__container">
        {strategyRows.map(({ strategy, standing }) => {
          const driverCode = standing.driver.name_acronym || `D${strategy.driver_number}`;
          const actionClass = ACTION_CLASS[strategy.recommendedAction];
          const confidence = Math.max(0, Math.min(100, Math.round(strategy.confidence)));
          const fuelRemain = Math.max(0, strategy.estimatedFuelRemaining);

          return (
            <div className="strategy-advisor__card" key={strategy.driver_number}>
              <div className="strategy-advisor__driver">
                <div className="strategy-advisor__position">P{standing.position}</div>
                <div className="strategy-advisor__code">{driverCode}</div>
              </div>

              <div className={`strategy-advisor__action strategy-advisor__action--${actionClass}`}>
                {ACTION_LABELS[strategy.recommendedAction]}
              </div>

              <div className="strategy-advisor__metrics">
                <div className="strategy-advisor__metric">
                  <span className="strategy-advisor__metric-label">Next Stop</span>
                  <span className="strategy-advisor__metric-value">
                    Lap {strategy.optimalNextStop.lapNumber} · {strategy.optimalNextStop.compound}
                  </span>
                </div>
                <div className="strategy-advisor__metric">
                  <span className="strategy-advisor__metric-label">Est. Gain</span>
                  <span className="strategy-advisor__metric-value">{formatSignedSeconds(strategy.optimalNextStop.gainSeconds)}</span>
                </div>
                <div className="strategy-advisor__metric">
                  <span className="strategy-advisor__metric-label">Predicted Finish</span>
                  <span className="strategy-advisor__metric-value">P{strategy.predictedFinishPosition}</span>
                </div>
                <div className="strategy-advisor__metric">
                  <span className="strategy-advisor__metric-label">Fuel Burn</span>
                  <span className="strategy-advisor__metric-value">{strategy.fuelBurnPerLap.toFixed(2)} kg/lap</span>
                </div>
                <div className="strategy-advisor__metric">
                  <span className="strategy-advisor__metric-label">Fuel Left</span>
                  <span className="strategy-advisor__metric-value">{fuelRemain.toFixed(1)} kg</span>
                </div>
                <div className="strategy-advisor__metric">
                  <span className="strategy-advisor__metric-label">Lift/Coast Gain</span>
                  <span className="strategy-advisor__metric-value">{formatSignedSeconds(strategy.fuelSavingPotential)}</span>
                </div>
              </div>

              <div className="strategy-advisor__status">
                <div className={`strategy-advisor__risk strategy-advisor__risk--${strategy.riskLevel}`}>
                  Risk: {strategy.riskLevel.toUpperCase()}
                </div>
                <div className="strategy-advisor__confidence">
                  <span className="strategy-advisor__confidence-label">Confidence</span>
                  <span className="strategy-advisor__confidence-value">{confidence}%</span>
                  <div className="strategy-advisor__confidence-bar">
                    <div
                      className="strategy-advisor__confidence-fill"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="strategy-advisor__scenarios">
                <div className="strategy-advisor__scenarios-title">What-if Scenarios</div>
                <div className="strategy-advisor__scenario-grid">
                  {strategy.whatIfScenarios.map(scenario => (
                    <div className="strategy-advisor__scenario-card" key={`${strategy.driver_number}-${scenario.label}`}>
                      <div className="strategy-advisor__scenario-label">{scenario.label}</div>
                      <div className="strategy-advisor__scenario-line">Lap {scenario.pitLap} · {scenario.compound}</div>
                      <div className="strategy-advisor__scenario-line">Finish P{scenario.projectedFinishPosition}</div>
                      <div className="strategy-advisor__scenario-line">Gain {formatSignedSeconds(scenario.projectedTimeGain)}</div>
                      <div className="strategy-advisor__scenario-line">Confidence {Math.round(scenario.confidence)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

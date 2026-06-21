import type { DriverForm } from '../types/analytics';
import type { DriverStanding } from '../types/f1';
import './FormMomentum.css';

interface Props {
  formData: Map<number, DriverForm>;
  standings: DriverStanding[];
  currentLap: number;
  totalLaps: number;
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export default function FormMomentum({ formData, standings, currentLap, totalLaps }: Props) {
  if (!formData || formData.size === 0) {
    return (
      <div className="form-momentum">
        <div className="form-momentum__header">
          <h2 className="form-momentum__title">FORM AND MOMENTUM</h2>
          <span className="form-momentum__lap">LAP {currentLap} / {totalLaps}</span>
        </div>
        <div className="form-momentum__empty">No form data available</div>
      </div>
    );
  }

  const rows = Array.from(formData.values())
    .flatMap(form => {
      const standing = standings.find(s => s.driver.driver_number === form.driver_number);
      return standing ? [{ form, standing }] : [];
    })
    .sort((a, b) => a.standing.position - b.standing.position);

  return (
    <div className="form-momentum">
      <div className="form-momentum__header">
        <h2 className="form-momentum__title">FORM AND MOMENTUM</h2>
        <span className="form-momentum__lap">LAP {currentLap} / {totalLaps}</span>
      </div>

      <div className="form-momentum__container">
        {rows.map(({ form, standing }) => {
          const driverCode = standing.driver.name_acronym || `D${form.driver_number}`;
          const momentum = Math.max(-100, Math.min(100, form.momentumScore));
          const trendClass = form.trend;
          const consistency = Math.max(0, Math.min(100, form.consistency));

          return (
            <div className="form-momentum__card" key={form.driver_number}>
              <div className="form-momentum__driver">
                <div className="form-momentum__position">P{standing.position}</div>
                <div className="form-momentum__code">{driverCode}</div>
              </div>

              <div className="form-momentum__summary">
                <div className={`form-momentum__trend form-momentum__trend--${trendClass}`}>
                  {form.trend.toUpperCase()}
                </div>

                <div className="form-momentum__momentum">
                  <div className="form-momentum__metric-label">Momentum</div>
                  <div className="form-momentum__bar">
                    <div className="form-momentum__bar-center" />
                    <div
                      className={`form-momentum__bar-fill ${momentum >= 0 ? 'positive' : 'negative'}`}
                      style={{
                        width: `${Math.abs(momentum) / 2}%`,
                        left: momentum >= 0 ? '50%' : `${50 - Math.abs(momentum) / 2}%`,
                      }}
                    />
                  </div>
                  <div className="form-momentum__metric-value">{momentum > 0 ? '+' : ''}{momentum}</div>
                </div>
              </div>

              <div className="form-momentum__details">
                <div className="form-momentum__detail-card">
                  <span className="form-momentum__detail-label">Consistency</span>
                  <span className="form-momentum__detail-value">{consistency}%</span>
                </div>
                <div className="form-momentum__detail-card">
                  <span className="form-momentum__detail-label">Avg Last 5</span>
                  <span className="form-momentum__detail-value">{formatLapTime(form.averageLast5)}</span>
                </div>
                <div className="form-momentum__detail-card">
                  <span className="form-momentum__detail-label">Peak Window</span>
                  <span className="form-momentum__detail-value">{form.peakPerformanceWindow.toUpperCase()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

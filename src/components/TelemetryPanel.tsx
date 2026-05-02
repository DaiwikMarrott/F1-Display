import React from 'react';
import type { TelemetryData } from '../types/analytics';
import './TelemetryPanel.css';

interface Props {
  telemetry: Map<number, TelemetryData>;
  standings: any[];
  currentLap: number;
  totalLaps: number;
}

export default function TelemetryPanel({ telemetry, standings, currentLap, totalLaps }: Props) {
  if (!telemetry || telemetry.size === 0) {
    return (
      <div className="telemetry-panel">
        <div className="telemetry-panel__header">
          <h2 className="telemetry-panel__title">TELEMETRY</h2>
          <span className="telemetry-panel__lap">LAP {currentLap} / {totalLaps}</span>
        </div>
        <div className="telemetry-panel__empty">No telemetry data available</div>
      </div>
    );
  }

  const rows = Array.from(telemetry.values())
    .map(t => ({
      telemetry: t,
      standing: standings.find(s => s.driver.driver_number === t.driver_number),
    }))
    .filter(row => !!row.standing)
    .sort((a, b) => a.standing.position - b.standing.position);

  const maxSpeed = Math.max(...rows.map(r => r.telemetry.topSpeed), 1);

  return (
    <div className="telemetry-panel">
      <div className="telemetry-panel__header">
        <h2 className="telemetry-panel__title">TELEMETRY</h2>
        <span className="telemetry-panel__lap">LAP {currentLap} / {totalLaps}</span>
      </div>

      <div className="telemetry-panel__container">
        {rows.map(({ telemetry: t, standing }) => {
          const code = standing.driver.driver_number_display || `D${t.driver_number}`;
          const speedPercent = Math.min(100, Math.round((t.topSpeed / maxSpeed) * 100));
          const accelPercent = Math.min(100, Math.max(0, Math.round(t.acceleration)));
          const gPercent = Math.min(100, Math.round((t.gForce / 6) * 100));

          return (
            <div className="telemetry-panel__card" key={t.driver_number}>
              <div className="telemetry-panel__driver">
                <div className="telemetry-panel__position">P{standing.position}</div>
                <div className="telemetry-panel__code">{code}</div>
              </div>

              <div className="telemetry-panel__grid">
                <div className="telemetry-panel__metric">
                  <div className="telemetry-panel__metric-header">
                    <span>Top Speed</span>
                    <span>{t.topSpeed} km/h</span>
                  </div>
                  <div className="telemetry-panel__bar">
                    <div className="telemetry-panel__bar-fill telemetry-panel__bar-fill--speed" style={{ width: `${speedPercent}%` }} />
                  </div>
                </div>

                <div className="telemetry-panel__metric">
                  <div className="telemetry-panel__metric-header">
                    <span>Avg Speed</span>
                    <span>{t.avgSpeed} km/h</span>
                  </div>
                  <div className="telemetry-panel__bar">
                    <div className="telemetry-panel__bar-fill telemetry-panel__bar-fill--avg" style={{ width: `${Math.min(100, Math.round((t.avgSpeed / maxSpeed) * 100))}%` }} />
                  </div>
                </div>

                <div className="telemetry-panel__metric">
                  <div className="telemetry-panel__metric-header">
                    <span>Acceleration</span>
                    <span>{Math.round(t.acceleration)}%</span>
                  </div>
                  <div className="telemetry-panel__bar">
                    <div className="telemetry-panel__bar-fill telemetry-panel__bar-fill--accel" style={{ width: `${accelPercent}%` }} />
                  </div>
                </div>

                <div className="telemetry-panel__metric telemetry-panel__metric--compact">
                  <div className="telemetry-panel__chip">Corner {Math.round(t.cornerSpeed)} km/h</div>
                  <div className="telemetry-panel__chip">Avg G {t.gForce.toFixed(1)}g</div>
                  <div className="telemetry-panel__chip">Max G {t.maxGForce.toFixed(1)}g</div>
                </div>

                <div className="telemetry-panel__metric">
                  <div className="telemetry-panel__metric-header">
                    <span>G-Load</span>
                    <span>{t.gForce.toFixed(1)}g</span>
                  </div>
                  <div className="telemetry-panel__bar">
                    <div className="telemetry-panel__bar-fill telemetry-panel__bar-fill--g" style={{ width: `${gPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

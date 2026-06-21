import { SectorData } from '../types/analytics';
import type { DriverStanding } from '../types/f1';
import { formatLapProgress } from '../utils/formatters';
import './SectorAnalysis.css';

interface Props {
  sectors: Map<number, SectorData>;
  standings: DriverStanding[];
  currentLap: number;
  totalLaps: number;
}

/**
 * SectorAnalysis Component
 * Displays sector time analysis for all drivers with delta comparison to leader
 * Shows S1, S2, S3 times and best sector indicators
 */
export default function SectorAnalysis({ sectors, standings, currentLap, totalLaps }: Props) {
  if (!sectors || sectors.size === 0) {
    return (
      <div className="sector-analysis">
        <div className="sector-analysis__header">
          <h2 className="sector-analysis__title">SECTOR ANALYSIS</h2>
          <span className="sector-analysis__lap">{formatLapProgress(currentLap, totalLaps)}</span>
        </div>
        <div className="sector-analysis__empty">No data available</div>
      </div>
    );
  }

  // Get leader data for delta calculations
  const leader = standings[0];
  const leaderData = leader ? sectors.get(leader.driver.driver_number) : null;

  const getStatusColor = (delta: number): string => {
    if (delta < -0.001) return 'purple'; // Best
    if (delta < 0.2) return 'green';    // Close to best
    if (delta < 0.5) return 'yellow';   // Medium gap
    return 'red';                        // Large gap
  };

  const formatTime = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return 'Unavailable';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  const formatDelta = (ms: number): string => {
    if (!Number.isFinite(ms)) return 'Unavailable';
    if (ms === 0) return '0';
    const sign = ms > 0 ? '+' : '';
    const centiseconds = (ms / 10).toFixed(0);
    return `${sign}${centiseconds}`;
  };

  const visibleDrivers = Array.from(sectors.values())
    .filter(s => s.driver_number !== undefined)
    .sort((a, b) => {
      const posA = standings.find(st => st.driver.driver_number === a.driver_number)?.position || 999;
      const posB = standings.find(st => st.driver.driver_number === b.driver_number)?.position || 999;
      return posA - posB;
    });

  return (
    <div className="sector-analysis">
      <div className="sector-analysis__header">
        <h2 className="sector-analysis__title">SECTOR ANALYSIS</h2>
        <span className="sector-analysis__lap">{formatLapProgress(currentLap, totalLaps)}</span>
      </div>

      {/* Column Headers */}
      <div className="sector-analysis__legend">
        <div className="sector-analysis__legend-item">S1 (Purple = PB)</div>
        <div className="sector-analysis__legend-item">S2 (Green = Leader)</div>
        <div className="sector-analysis__legend-item">S3 (Yellow = Close)</div>
        <div className="sector-analysis__legend-item">Best (Red = Gap)</div>
      </div>

      {/* Driver Sector Cards */}
      <div className="sector-analysis__container">
        {visibleDrivers.map((sectorData) => {
          const standing = standings.find(s => s.driver.driver_number === sectorData.driver_number);
          if (!standing) return null;

          const position = standing.position;
          const driverNum = standing.driver.driver_number;
          const driverCode = standing.driver.name_acronym || `D${driverNum}`;

          const s1Delta = leaderData ? (sectorData.sector1 - leaderData.sector1) : 0;
          const s2Delta = leaderData ? (sectorData.sector2 - leaderData.sector2) : 0;
          const s3Delta = leaderData ? (sectorData.sector3 - leaderData.sector3) : 0;

          const s1Status = getStatusColor(s1Delta);
          const s2Status = getStatusColor(s2Delta);
          const s3Status = getStatusColor(s3Delta);

          // Determine best sector
          let bestSector = 0;
          if (sectorData.bestSector1 && sectorData.bestSector1 <= sectorData.bestSector2 && sectorData.bestSector1 <= sectorData.bestSector3) {
            bestSector = 1;
          } else if (sectorData.bestSector2 && sectorData.bestSector2 <= sectorData.bestSector3) {
            bestSector = 2;
          } else {
            bestSector = 3;
          }

          return (
            <div key={driverNum} className="sector-analysis__card">
              {/* Driver Info */}
              <div className="sector-analysis__driver-info">
                <div className="sector-analysis__position">P{position}</div>
                <div className="sector-analysis__driver-code">{driverCode}</div>
              </div>

              {/* Sector 1 */}
              <div className={`sector-analysis__sector sector-analysis__sector--${s1Status}`}>
                <div className="sector-analysis__sector-label">S1</div>
                <div className="sector-analysis__sector-time">{formatTime(sectorData.sector1)}</div>
                <div className="sector-analysis__sector-delta">{formatDelta(s1Delta)}</div>
              </div>

              {/* Sector 2 */}
              <div className={`sector-analysis__sector sector-analysis__sector--${s2Status}`}>
                <div className="sector-analysis__sector-label">S2</div>
                <div className="sector-analysis__sector-time">{formatTime(sectorData.sector2)}</div>
                <div className="sector-analysis__sector-delta">{formatDelta(s2Delta)}</div>
              </div>

              {/* Sector 3 */}
              <div className={`sector-analysis__sector sector-analysis__sector--${s3Status}`}>
                <div className="sector-analysis__sector-label">S3</div>
                <div className="sector-analysis__sector-time">{formatTime(sectorData.sector3)}</div>
                <div className="sector-analysis__sector-delta">{formatDelta(s3Delta)}</div>
              </div>

              {/* Best Sector Indicator */}
              <div className="sector-analysis__best-sector">
                <div className="sector-analysis__best-label">Best</div>
                <div className="sector-analysis__best-badge">S{bestSector}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Legend */}
      <div className="sector-analysis__status-legend">
        <span className="sector-analysis__status-item sector-analysis__status-item--purple">🟣 Purple = Personal Best</span>
        <span className="sector-analysis__status-item sector-analysis__status-item--green">🟢 Green = Leader</span>
        <span className="sector-analysis__status-item sector-analysis__status-item--yellow">🟡 Yellow = +0.2-0.5s</span>
        <span className="sector-analysis__status-item sector-analysis__status-item--red">🔴 Red = +0.5s+</span>
      </div>
    </div>
  );
}

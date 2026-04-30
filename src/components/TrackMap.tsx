import React, { useMemo } from 'react';
import type { DriverStanding } from '../types/f1';
import { getCircuitByCountry } from '../data/circuits';
import './TrackMap.css';

interface Props {
  standings: DriverStanding[];
  raceCountry?: string | null;
}

const SVG_WIDTH = 900;
const SVG_HEIGHT = 700;

/**
 * Calculate driver positions along the track based on their standing.
 * Leader is positioned ahead, with other drivers distributed around the track
 * following the circuit shape for realistic lap progression visualization.
 */
function getTrackPositions(
  standings: DriverStanding[],
  circuit: any | null
): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  const centerX = circuit?.centerX ?? SVG_WIDTH / 2;
  const centerY = circuit?.centerY ?? SVG_HEIGHT / 2;
  const innerRadius = circuit?.innerRadius ?? 120;
  const outerRadius = circuit?.outerRadius ?? 250;

  // Sort standings by position to calculate track progression
  const sorted = [...standings].sort((a, b) => a.position - b.position);
  const totalDrivers = sorted.length;

  sorted.forEach((standing, idx) => {
    // Distribute drivers evenly around the track
    // Each driver gets an angle based on their position relative to total drivers
    // This creates even spacing around the circle
    const angleStep = (2 * Math.PI) / Math.max(totalDrivers, 1);
    const angle = idx * angleStep - Math.PI / 2; // Start from top
    
    // Position mostly stays on the racing line (outer radius primarily)
    // with slight variation for visual interest
    const radiusFactor = 0.75 + 0.25 * Math.sin(idx * 0.5); // Varies between 0.5 and 1.0
    const radius = innerRadius + (outerRadius - innerRadius) * radiusFactor;
    
    positions.set(standing.driver.driver_number, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  return positions;
}

const TrackMap: React.FC<Props> = ({ standings, raceCountry }) => {
  const circuit = raceCountry ? getCircuitByCountry(raceCountry) : null;
  const hasLocations = standings.some(s => s.location !== null);

  const trackSvgPath = circuit?.svgPath || null;

  const driverPositionsMap = useMemo(() => {
    if (hasLocations) {
      // If we have real location data, use it
      const posMap = new Map<number, { x: number; y: number }>();
      const locs = standings.map(s => s.location).filter((l): l is any => l !== null);
      
      if (locs.length === 0) {
        return getTrackPositions(standings, circuit);
      }

      const xs = locs.map(l => l.x);
      const ys = locs.map(l => l.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const padding = 60;

      standings.forEach(s => {
        const loc = s.location;
        if (loc) {
          posMap.set(s.driver.driver_number, {
            x: padding + ((loc.x - minX) / rangeX) * (SVG_WIDTH - padding * 2),
            y: padding + ((loc.y - minY) / rangeY) * (SVG_HEIGHT - padding * 2),
          });
        } else {
          posMap.set(s.driver.driver_number, { x: SVG_WIDTH / 2, y: SVG_HEIGHT / 2 });
        }
      });
      return posMap;
    }
    
    // Use simulated positions based on standings and track layout
    return getTrackPositions(standings, circuit);
  }, [standings, hasLocations, circuit]);

  return (
    <div className="track-map">
      <div className="track-map__header">
        <span className="track-map__title">
          {circuit ? `${circuit.name}` : 'TRACK MAP'}
        </span>
        {!hasLocations && (
          <span className="track-map__demo-badge">SIMULATED POSITIONS</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="track-map__svg"
        aria-label="F1 Circuit Track Map"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Circuit background */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#15151e" />

        {/* Track path */}
        {trackSvgPath ? (
          <>
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#2f2f4f"
              strokeWidth="40"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#3a3a5a"
              strokeWidth="32"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#252540"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}

        {/* Driver dots */}
        {standings.map((s) => {
          const pos = driverPositionsMap.get(s.driver.driver_number);
          if (!pos) return null;
          const teamColor = `#${s.driver.team_colour || 'ffffff'}`;
          const isLeader = s.position === 1;

          return (
            <g key={s.driver.driver_number}>
              {/* Halo for leader */}
              {isLeader && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="18"
                  fill="rgba(245,166,35,0.2)"
                  stroke="#f5a623"
                  strokeWidth="1"
                />
              )}

              {/* Main dot */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isLeader ? 12 : 10}
                fill={teamColor}
                stroke={isLeader ? '#f5a623' : '#000'}
                strokeWidth={isLeader ? 2.5 : 1.5}
                filter="drop-shadow(0 0 4px rgba(0,0,0,0.8))"
              />

              {/* Driver number */}
              <text
                x={pos.x + 14}
                y={pos.y + 5}
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
                fontFamily="Arial, sans-serif"
                style={{ textShadow: '0 0 4px #000', pointerEvents: 'none' }}
              >
                {s.driver.driver_number}
              </text>

              {/* Position badge */}
              <text
                x={pos.x - 2}
                y={pos.y - 12}
                fill="#ffffff"
                fontSize="9"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
                style={{ textShadow: '0 0 3px #000', pointerEvents: 'none' }}
              >
                P{s.position}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TrackMap;

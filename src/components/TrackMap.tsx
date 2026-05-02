import React, { useMemo } from 'react';
import type { DriverStanding } from '../types/f1';
import { getCircuitByCountry } from '../data/circuits';
import './TrackMap.css';

interface Props {
  standings: DriverStanding[];
  raceCountry?: string | null;
  currentLap?: number;
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
  circuit: any | null,
  currentLap: number = 1
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
    // Distribute drivers around the track based on their position
    // Leader gets further ahead, others follow in sequence
    const angleStep = (2 * Math.PI) / Math.max(totalDrivers, 1);
    const positionOffset = standing.position - 1; // 0 for leader, 1 for 2nd, etc.
    const lapOffset = (currentLap % 1) * 0.2; // Small animation within lap
    const angle = (positionOffset + lapOffset) * angleStep - Math.PI / 2; // Start from top
    
    // Position mostly stays on the racing line (outer radius primarily)
    // with slight variation based on driver position
    const radiusFactor = 0.7 + 0.3 * Math.sin(positionOffset * 0.5);
    const radius = innerRadius + (outerRadius - innerRadius) * radiusFactor;
    
    positions.set(standing.driver.driver_number, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  return positions;
}

const TrackMap: React.FC<Props> = ({ standings, raceCountry, currentLap = 1 }) => {
  const circuit = raceCountry ? getCircuitByCountry(raceCountry) : null;
  // Fallback to Miami circuit for better demo visualization
  const displayCircuit = circuit || getCircuitByCountry('United States');
  const hasLocations = standings.some(s => s.location !== null);

  const trackSvgPath = displayCircuit?.svgPath || null;

  const driverPositionsMap = useMemo(() => {
    if (hasLocations) {
      // If we have real location data, use it
      const posMap = new Map<number, { x: number; y: number }>();
      const locs = standings.map(s => s.location).filter((l): l is any => l !== null);
      
      if (locs.length === 0) {
        return getTrackPositions(standings, displayCircuit, currentLap);
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
    return getTrackPositions(standings, displayCircuit, currentLap);
  }, [standings, hasLocations, displayCircuit, currentLap]);

  return (
    <div className="track-map">
      <div className="track-map__header">
        <span className="track-map__title">
          {displayCircuit ? `${displayCircuit.name}` : 'TRACK MAP'}
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

        {/* Track path - much more visible now */}
        {trackSvgPath ? (
          <>
            {/* Outer curbing - bright red */}
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#ff3333"
              strokeWidth="40"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            {/* Mid asphalt - dark gray */}
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#555566"
              strokeWidth="32"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Racing line - bright yellow */}
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#ffff00"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="10,5"
              opacity="0.6"
            />
          </>
        ) : null}

        {/* Driver dots - now clearly visible */}
        {standings.map((s) => {
          const pos = driverPositionsMap.get(s.driver.driver_number);
          if (!pos) return null;
          const teamColor = `#${s.driver.team_colour || 'ffffff'}`;
          const isLeader = s.position === 1;
          const dotRadius = isLeader ? 14 : 12;

          return (
            <g key={s.driver.driver_number}>
              {/* Glow/shadow effect for visibility */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={dotRadius + 6}
                fill="rgba(0,0,0,0.5)"
                filter="drop-shadow(0 0 8px rgba(0,0,0,0.9))"
              />

              {/* Halo for leader */}
              {isLeader && (
                <>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={dotRadius + 10}
                    fill="none"
                    stroke="#f5a623"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="20"
                    fill="rgba(245,166,35,0.1)"
                    stroke="#f5a623"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </>
              )}

              {/* Main dot - larger and more visible */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={dotRadius}
                fill={teamColor}
                stroke={isLeader ? '#f5a623' : '#ffffff'}
                strokeWidth={isLeader ? 3 : 2}
                filter="drop-shadow(0 0 6px rgba(0,0,0,0.8))"
              />

              {/* Driver number - larger and more readable */}
              <text
                x={pos.x + 16}
                y={pos.y + 4}
                fill="#ffffff"
                fontSize="12"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                style={{ textShadow: '0 2px 4px #000', pointerEvents: 'none' }}
              >
                {s.driver.driver_number}
              </text>

              {/* Position badge - more prominent */}
              <rect
                x={pos.x - 9}
                y={pos.y - 20}
                width="18"
                height="16"
                fill={teamColor}
                rx="2"
                filter="drop-shadow(0 0 4px rgba(0,0,0,0.8))"
              />
              <text
                x={pos.x}
                y={pos.y - 7}
                fill="#ffffff"
                fontSize="10"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
                style={{ textShadow: '0 1px 2px #000', pointerEvents: 'none' }}
              >
                {s.position}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TrackMap;

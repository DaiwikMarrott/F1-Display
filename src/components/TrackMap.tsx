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

function getTrackPositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const cx = SVG_WIDTH / 2;
  const cy = SVG_HEIGHT / 2;
  const rx = 300;
  const ry = 250;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const rx2 = rx + Math.sin(angle * 3) * 50;
    const ry2 = ry + Math.cos(angle * 2) * 40;
    positions.push({
      x: cx + rx2 * Math.cos(angle),
      y: cy + ry2 * Math.sin(angle),
    });
  }
  return positions;
}

function normalizeLocations(
  locs: (any | null)[],
  width: number,
  height: number
): { x: number; y: number }[] {
  const validLocs = locs.filter((l): l is any => l !== null);
  if (validLocs.length === 0) return locs.map(() => ({ x: 0, y: 0 }));

  const xs = validLocs.map(l => l.x);
  const ys = validLocs.map(l => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const padding = 60;

  return locs.map(l => {
    if (!l) return { x: width / 2, y: height / 2 };
    return {
      x: padding + ((l.x - minX) / rangeX) * (width - padding * 2),
      y: padding + ((l.y - minY) / rangeY) * (height - padding * 2),
    };
  });
}

const TrackMap: React.FC<Props> = ({ standings, raceCountry }) => {
  const circuit = raceCountry ? getCircuitByCountry(raceCountry) : null;
  const hasLocations = standings.some(s => s.location !== null);

  const trackSvgPath = circuit?.svgPath || null;

  const driverPositions = useMemo(() => {
    if (hasLocations) {
      const locs = standings.map(s => s.location);
      return normalizeLocations(locs, SVG_WIDTH, SVG_HEIGHT);
    }
    const sorted = [...standings].sort((a, b) => a.position - b.position);
    const trackPos = getTrackPositions(sorted.length);
    return standings.map(s => {
      const idx = sorted.findIndex(d => d.driver.driver_number === s.driver.driver_number);
      return trackPos[idx] ?? { x: SVG_WIDTH / 2, y: SVG_HEIGHT / 2 };
    });
  }, [standings, hasLocations]);

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
        {standings.map((s, idx) => {
          const pos = driverPositions[idx];
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

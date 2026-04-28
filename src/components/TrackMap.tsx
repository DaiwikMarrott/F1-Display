import React, { useMemo } from 'react';
import type { DriverStanding, Location } from '../types/f1';
import './TrackMap.css';

interface Props {
  standings: DriverStanding[];
}

// Generic F1 track path – an approximate Monaco-like circuit
const TRACK_PATH =
  'M 250 50 ' +
  'C 350 30, 480 40, 520 80 ' +
  'C 560 120, 560 160, 530 190 ' +
  'C 510 210, 490 215, 470 240 ' +
  'C 450 265, 450 290, 470 310 ' +
  'C 490 330, 530 335, 550 360 ' +
  'C 570 385, 565 420, 540 440 ' +
  'C 510 465, 460 465, 430 450 ' +
  'C 400 435, 380 410, 350 400 ' +
  'C 310 388, 260 390, 230 410 ' +
  'C 200 430, 185 460, 160 470 ' +
  'C 130 482, 90 475, 70 450 ' +
  'C 50 425, 50 390, 65 365 ' +
  'C 80 340, 110 325, 120 300 ' +
  'C 130 275, 120 250, 100 230 ' +
  'C 80 210, 50 200, 40 175 ' +
  'C 28 148, 40 110, 65 90 ' +
  'C 100 65, 160 52, 250 50 Z';

const SVG_WIDTH = 600;
const SVG_HEIGHT = 520;

// Evenly spaced positions along a simplified circuit for fallback
function getTrackPositions(count: number): { x: number; y: number }[] {
  // Approximate positions using parametric circle-like layout
  const positions: { x: number; y: number }[] = [];
  const cx = SVG_WIDTH / 2;
  const cy = SVG_HEIGHT / 2;
  const rx = 200;
  const ry = 170;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    // Add slight variation to avoid exact oval
    const rx2 = rx + Math.sin(angle * 3) * 30;
    const ry2 = ry + Math.cos(angle * 2) * 20;
    positions.push({
      x: cx + rx2 * Math.cos(angle),
      y: cy + ry2 * Math.sin(angle),
    });
  }
  return positions;
}

function normalizeLocations(
  locs: (Location | null)[],
  width: number,
  height: number
): { x: number; y: number }[] {
  const validLocs = locs.filter((l): l is Location => l !== null);
  if (validLocs.length === 0) return locs.map(() => ({ x: 0, y: 0 }));

  const xs = validLocs.map(l => l.x);
  const ys = validLocs.map(l => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const padding = 40;

  return locs.map(l => {
    if (!l) return { x: width / 2, y: height / 2 };
    return {
      x: padding + ((l.x - minX) / rangeX) * (width - padding * 2),
      y: padding + ((l.y - minY) / rangeY) * (height - padding * 2),
    };
  });
}

const TrackMap: React.FC<Props> = ({ standings }) => {
  const hasLocations = standings.some(s => s.location !== null);

  const driverPositions = useMemo(() => {
    if (hasLocations) {
      const locs = standings.map(s => s.location);
      return normalizeLocations(locs, SVG_WIDTH, SVG_HEIGHT);
    }
    // Use evenly spaced fallback by race position
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
        <span className="track-map__title">TRACK MAP</span>
        {!hasLocations && (
          <span className="track-map__demo-badge">SIMULATED POSITIONS</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="track-map__svg"
        aria-label="F1 Circuit Track Map"
      >
        {/* Track outline */}
        <path
          d={TRACK_PATH}
          fill="none"
          stroke="#2f2f4f"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={TRACK_PATH}
          fill="none"
          stroke="#3a3a5a"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={TRACK_PATH}
          fill="none"
          stroke="#252540"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start/Finish line */}
        <line x1="245" y1="40" x2="255" y2="60" stroke="#e8002d" strokeWidth="3" />

        {/* Driver dots */}
        {standings.map((s, idx) => {
          const pos = driverPositions[idx];
          if (!pos) return null;
          const teamColor = `#${s.driver.team_colour || 'ffffff'}`;
          const isLeader = s.position === 1;

          return (
            <g key={s.driver.driver_number} transform={`translate(${pos.x}, ${pos.y})`}>
              {isLeader && (
                <circle r="14" fill="rgba(245,166,35,0.2)" />
              )}
              <circle
                r={isLeader ? 10 : 8}
                fill={teamColor}
                stroke={isLeader ? '#f5a623' : '#000'}
                strokeWidth={isLeader ? 2 : 1}
              />
              <text
                x="12"
                y="4"
                fill="#ffffff"
                fontSize="9"
                fontWeight="700"
                fontFamily="Arial, sans-serif"
                style={{ textShadow: '0 0 3px #000' }}
              >
                {s.driver.driver_number}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TrackMap;

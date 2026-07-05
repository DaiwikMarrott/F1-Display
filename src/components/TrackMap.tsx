import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { DriverStanding, Session } from '../types/f1';
import type { TrackMapData } from '../types/map';
import { getCircuitForSession } from '../data/circuits';
import { getSessionPhase } from '../domain/sessionSelection';
import {
  createTrackProjection,
  geometryToSvgPath,
  getTrackMapLabel,
  latestLocationPerDriver,
} from '../domain/trackProjection';
import DriverTooltip from './DriverTooltip';
import './TrackMap.css';

interface Props {
  standings: DriverStanding[];
  session: Session | null;
  currentLap?: number;
  isLoading: boolean;
  mapData: TrackMapData;
}

const SVG_WIDTH = 900;
const SVG_HEIGHT = 700;

/**
 * Sample evenly-spaced points along an SVG path.
 * Uses a temporary SVG element to access getPointAtLength().
 */
function samplePathPoints(svgPathD: string, numPoints: number): { x: number; y: number }[] {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', svgPathD);
  svg.appendChild(path);
  document.body.appendChild(svg);

  const totalLen = path.getTotalLength();
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const dist = (i / numPoints) * totalLen;
    const pt = path.getPointAtLength(dist);
    points.push({ x: pt.x, y: pt.y });
  }

  document.body.removeChild(svg);
  return points;
}

function getPathStart(svgPathD: string): { x: number; y: number } | null {
  const match = svgPathD.match(/^\s*M\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i);
  if (!match) return null;
  return { x: Number(match[1]), y: Number(match[2]) };
}

/**
 * Calculate driver positions along the track path based on their standing.
 * Leader is at the "front" of the path, others are spaced behind.
 */
function getTrackPositions(
  standings: DriverStanding[],
  svgPathD: string,
  currentLap: number = 1
): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  const sorted = [...standings].sort((a, b) => a.position - b.position);
  const totalDrivers = sorted.length;
  if (totalDrivers === 0) return positions;

  // Sample many points along the path for smooth positioning
  const NUM_SAMPLES = 1000;
  const pathPoints = samplePathPoints(svgPathD, NUM_SAMPLES);

  // Leader position moves around the track based on currentLap
  // This creates an animation effect as the race progresses
  const leaderProgress = (currentLap * 0.15) % 1.0; // Each lap moves leader ~15% around track
  const leaderIdx = Math.floor(leaderProgress * NUM_SAMPLES);

  // Spread drivers around a portion of the track (not full circumference)
  // Use ~70% of the track to space all drivers, so they cluster realistically
  const spreadFraction = 0.7;

  sorted.forEach((standing) => {
    const positionOffset = standing.position - 1; // 0 for leader
    // Each driver is a fraction behind the leader
    const driverFraction = positionOffset / Math.max(totalDrivers - 1, 1) * spreadFraction;
    // Go backwards from leader position
    let idx = Math.floor(leaderIdx - driverFraction * NUM_SAMPLES);
    // Wrap around
    if (idx < 0) idx += NUM_SAMPLES;
    idx = idx % NUM_SAMPLES;

    const pt = pathPoints[idx];
    if (pt) {
      positions.set(standing.driver.driver_number, { x: pt.x, y: pt.y });
    }
  });

  return positions;
}

const TrackMap: React.FC<Props> = ({
  standings,
  session,
  currentLap = 1,
  isLoading,
  mapData,
}) => {
  const displayCircuit = getCircuitForSession(session);
  const sessionPhase = session ? getSessionPhase(session) : 'unknown';
  const showMarkers = !isLoading && sessionPhase !== 'upcoming';

  const projection = useMemo(
    () => createTrackProjection(mapData.geometry, SVG_WIDTH, SVG_HEIGHT, 70),
    [mapData.geometry],
  );
  const openF1TrackPath = useMemo(
    () => projection ? geometryToSvgPath(mapData.geometry, projection) : null,
    [mapData.geometry, projection],
  );
  const trackSvgPath = openF1TrackPath || displayCircuit?.svgPath || null;
  const startPoint = trackSvgPath ? getPathStart(trackSvgPath) : null;
  const mapStatus = isLoading
    ? 'LOADING MAP'
    : sessionPhase === 'upcoming'
      ? 'UPCOMING — NO POSITION DATA'
      : !displayCircuit
        ? 'CIRCUIT LAYOUT UNAVAILABLE'
        : getTrackMapLabel(mapData);

  // Tooltip state
  const [hoveredDriver, setHoveredDriver] = useState<DriverStanding | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDriverHover = useCallback((standing: DriverStanding, e: React.MouseEvent) => {
    setHoveredDriver(standing);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDriverLeave = useCallback(() => {
    setHoveredDriver(null);
  }, []);

  useEffect(() => {
    setHoveredDriver(null);
  }, [session?.session_key, session?.meeting_key, standings, mapData.positions]);

  const driverPositionsMap = useMemo(() => {
    if (!showMarkers) return new Map();

    if (projection && mapData.positions.length > 0) {
      const posMap = new Map<number, { x: number; y: number }>();
      for (const location of latestLocationPerDriver(mapData.positions)) {
        posMap.set(location.driver_number, projection.project(location));
      }
      return posMap;
    }

    if (trackSvgPath) {
      return getTrackPositions(standings, trackSvgPath, currentLap);
    }

    return new Map();
  }, [standings, mapData.positions, projection, trackSvgPath, currentLap, showMarkers]);

  return (
    <div
      className="track-map"
      data-session-key={session?.session_key ?? ''}
      data-meeting-key={session?.meeting_key ?? ''}
      data-season={session?.year ?? ''}
      data-event-name={session?.meeting_name ?? ''}
      data-circuit-id={displayCircuit?.id ?? ''}
    >
      <div className="track-map__header">
        <span className="track-map__title">
          {displayCircuit ? `${displayCircuit.name}` : 'TRACK MAP'}
        </span>
        <span className="track-map__status-badge">{mapStatus}</span>
      </div>

      {!displayCircuit ? (
        <div className="track-map__state" role="status">
          <strong>Circuit layout unavailable</strong>
          <span>
            {session
              ? `${session.circuit_short_name || 'Unknown circuit'} does not have a verified layout.`
              : 'Select a session to view its circuit.'}
          </span>
        </div>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="track-map__svg"
          aria-label={`${displayCircuit.name} track map`}
          preserveAspectRatio="xMidYMid meet"
        >
        {/* Circuit background */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#15151e" />

        {/* Track path rendering */}
        {trackSvgPath ? (
          <>
            {/* Outer curbing */}
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#ff3333"
              strokeWidth="38"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
            {/* Asphalt surface */}
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#444455"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner curbing */}
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#ff3333"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />
            {/* Dark racing surface */}
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#333344"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Racing line (dashed yellow center) */}
            <path
              d={trackSvgPath}
              fill="none"
              stroke="#ffff00"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="12,6"
              opacity="0.5"
            />
          </>
        ) : null}

        {/* Start/Finish line marker */}
        {startPoint && (
            <g>
              <line
                x1={startPoint.x - 15} y1={startPoint.y - 15}
                x2={startPoint.x + 15} y2={startPoint.y + 15}
                stroke="#ffffff"
                strokeWidth="3"
                opacity="0.7"
              />
              <text
                x={startPoint.x + 20}
                y={startPoint.y - 5}
                fill="#888899"
                fontSize="10"
                fontWeight="700"
                fontFamily="Arial, sans-serif"
              >
                S/F
              </text>
            </g>
        )}

        {/* Driver dots */}
        {standings.map((s) => {
          const pos = driverPositionsMap.get(s.driver.driver_number);
          if (!pos) return null;
          const teamColor = `#${s.driver.team_colour || 'ffffff'}`;
          const isLeader = s.position === 1;
          const dotRadius = isLeader ? 12 : 10;
          const handleFocus = () => {
            const rect = svgRef.current?.getBoundingClientRect();
            setHoveredDriver(s);
            setTooltipPos(rect
              ? {
                x: rect.left + (pos.x / SVG_WIDTH) * rect.width,
                y: rect.top + (pos.y / SVG_HEIGHT) * rect.height,
              }
              : { x: pos.x, y: pos.y });
          };

          return (
            <g
              key={s.driver.driver_number}
              className="track-map__driver-dot"
              onMouseEnter={(e) => handleDriverHover(s, e)}
              onMouseMove={(e) => handleDriverHover(s, e)}
              onMouseLeave={handleDriverLeave}
              onFocus={handleFocus}
              onBlur={handleDriverLeave}
              tabIndex={0}
              role="button"
              aria-label={`Position ${s.position}, ${s.driver.full_name}, ${s.driver.team_name}`}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow/shadow effect */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={dotRadius + 5}
                fill="rgba(0,0,0,0.6)"
              />

              {/* Leader halo */}
              {isLeader && (
                <>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={dotRadius + 8}
                    fill="none"
                    stroke="#f5a623"
                    strokeWidth="2"
                    opacity="0.7"
                  >
                    <animate
                      attributeName="r"
                      values={`${dotRadius + 8};${dotRadius + 12};${dotRadius + 8}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.7;0.3;0.7"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}

              {/* Main driver dot */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={dotRadius}
                fill={teamColor}
                stroke={isLeader ? '#f5a623' : '#ffffff'}
                strokeWidth={isLeader ? 3 : 1.5}
              />

              {/* Driver acronym label */}
              <text
                x={pos.x}
                y={pos.y + 3.5}
                fill="#ffffff"
                fontSize="8"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
                style={{ pointerEvents: 'none', textShadow: '0 1px 2px #000' }}
              >
                {s.driver.name_acronym}
              </text>

              {/* Position badge above */}
              <rect
                x={pos.x - 8}
                y={pos.y - dotRadius - 14}
                width="16"
                height="12"
                fill={teamColor}
                rx="3"
                opacity="0.9"
              />
              <text
                x={pos.x}
                y={pos.y - dotRadius - 5}
                fill="#ffffff"
                fontSize="9"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {s.position}
              </text>
            </g>
          );
        })}
        </svg>
      )}

      {/* Driver tooltip on hover */}
      {hoveredDriver && (
        <DriverTooltip
          standing={hoveredDriver}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}
    </div>
  );
};

export default TrackMap;

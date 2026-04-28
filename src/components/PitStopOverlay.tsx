import React, { useEffect } from 'react';
import type { PitNotification } from '../types/f1';
import './PitStopOverlay.css';

interface Props {
  notifications: PitNotification[];
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 6000;

function getCompoundColor(compound: string | undefined): string {
  switch (compound) {
    case 'SOFT':         return '#FF3333';
    case 'MEDIUM':       return '#FFD700';
    case 'HARD':         return '#FFFFFF';
    case 'INTERMEDIATE': return '#39B54A';
    case 'WET':          return '#0099FF';
    default:             return '#999999';
  }
}

function getCompoundLabel(compound: string | undefined): string {
  return compound ? compound.charAt(0).toUpperCase() + compound.slice(1).toLowerCase() : 'UNKNOWN';
}

const PitStopOverlay: React.FC<Props> = ({ notifications, onDismiss }) => {
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map(n =>
      window.setTimeout(() => onDismiss(n.id), AUTO_DISMISS_MS)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="pit-overlay" aria-live="polite" aria-label="Pit stop notifications">
      <div className="pit-overlay__container">
        {notifications.map((n, idx) => {
          const angle = (idx / Math.max(notifications.length, 1)) * Math.PI * 2;
          const radius = 120;
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;
          const bgColor = getCompoundColor(n.compound);

          return (
            <div
              key={n.id}
              className="pit-notification"
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px)`,
              }}
            >
              {/* Pit stop icon and driver info */}
              <div className="pit-notification__header">
                <div className="pit-notification__icon">🔧</div>
                <div className="pit-notification__info">
                  <div className="pit-notification__pos">P{n.position}</div>
                  <div className="pit-notification__name">{n.driverName}</div>
                </div>
              </div>

              {/* Tire compound display */}
              {n.compound && (
                <div className="pit-notification__compound">
                  <div
                    className="pit-notification__compound-dot"
                    style={{ backgroundColor: bgColor }}
                  />
                  <span className="pit-notification__compound-label">
                    {getCompoundLabel(n.compound)}
                  </span>
                </div>
              )}

              {/* Lap and duration info */}
              <div className="pit-notification__footer">
                <span className="pit-notification__label">PIT STOP</span>
                <span className="pit-notification__lap">Lap {n.lapNumber}</span>
                {n.duration !== undefined && (
                  <span className="pit-notification__duration">
                    {n.duration.toFixed(2)}s
                  </span>
                )}
              </div>

              {/* Close button */}
              <button
                className="pit-notification__close"
                onClick={() => onDismiss(n.id)}
                aria-label="Dismiss notification"
                title="Close"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PitStopOverlay;

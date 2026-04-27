import React, { useEffect } from 'react';
import type { PitNotification } from '../types/f1';
import './PitStopOverlay.css';

interface Props {
  notifications: PitNotification[];
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 5000;

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
    <div className="pit-overlay" aria-live="polite">
      {notifications.map(n => (
        <div key={n.id} className="pit-notification">
          <div className="pit-notification__icon">🔧</div>
          <div className="pit-notification__content">
            <span className="pit-notification__pos">P{n.position}</span>
            <span className="pit-notification__name">{n.driverName}</span>
            <span className="pit-notification__label">PIT STOP</span>
            <span className="pit-notification__lap">Lap {n.lapNumber}</span>
          </div>
          <button
            className="pit-notification__close"
            onClick={() => onDismiss(n.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default PitStopOverlay;

import React from 'react';
import { useF1Data } from './hooks/useF1Data';
import TimingTower from './components/TimingTower';
import TrackMap from './components/TrackMap';
import WinnerProbability from './components/WinnerProbability';
import PitStopOverlay from './components/PitStopOverlay';
import './App.css';

const App: React.FC = () => {
  const {
    standings,
    session,
    currentLap,
    totalLaps,
    pitNotifications,
    isLive,
    isLoading,
    error,
    dismissPitNotification,
  } = useF1Data();

  const raceName = session
    ? `${session.country_name} — ${session.circuit_short_name}`
    : 'F1 HUD';

  const sessionType = session?.session_name ?? 'LOADING...';

  return (
    <div className="app">
      {/* ── Top Bar ── */}
      <header className="app-topbar">
        <div className="app-topbar__left">
          <div className="app-topbar__logo">
            <span className="app-topbar__logo-text">F1</span>
          </div>
          <div className="app-topbar__divider" />
          <div className="app-topbar__session">
            <span className="app-topbar__race-name">{raceName}</span>
            <span className="app-topbar__session-type">{sessionType}</span>
          </div>
        </div>

        <div className="app-topbar__center">
          {isLive ? (
            <div className="app-topbar__live-badge">
              <span className="live-dot" />
              LIVE
            </div>
          ) : (
            <div className="app-topbar__demo-badge">DEMO / REPLAY</div>
          )}
          {currentLap > 0 && (
            <span className="app-topbar__lap-counter">
              LAP {currentLap} / {totalLaps}
            </span>
          )}
        </div>

        <div className="app-topbar__right">
          {error && (
            <span className="app-topbar__error" title={error}>
              ⚠ {error}
            </span>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      {isLoading && standings.length === 0 ? (
        <div className="app-loading">
          <div className="app-loading__spinner" />
          <span className="app-loading__text">Loading F1 Data...</span>
        </div>
      ) : (
        <main className="app-main">
          <div className="app-main__left">
            <WinnerProbability standings={standings} />
          </div>

          <div className="app-main__center">
            <TrackMap standings={standings} />
          </div>

          <div className="app-main__right">
            <TimingTower
              standings={standings}
              currentLap={currentLap}
              totalLaps={totalLaps}
            />
          </div>
        </main>
      )}

      {/* ── Pit Stop Overlay ── */}
      <PitStopOverlay
        notifications={pitNotifications}
        onDismiss={dismissPitNotification}
      />
    </div>
  );
};

export default App;

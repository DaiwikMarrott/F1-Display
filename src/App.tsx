import React, { useState, useMemo } from 'react';
import { useF1Data } from './hooks/useF1Data';
import useAnalytics from './hooks/useAnalytics';
import TimingTower from './components/TimingTower';
import TrackMap from './components/TrackMap';
import WinnerProbability from './components/WinnerProbability';
import LiveStandings from './components/LiveStandings';
import TireStrategy from './components/TireStrategy';
import SectorAnalysis from './components/SectorAnalysis';
import './App.css';

const App: React.FC = () => {
  const {
    standings,
    session,
    currentLap,
    totalLaps,
    isLive,
    isLoading,
    error,
    availableRaces,
    selectedRaceKey,
    setSelectedRaceKey,
  } = useF1Data();

  // Analytics engine
  const analytics = useAnalytics(standings, currentLap, totalLaps);

  const [showRaceSelector, setShowRaceSelector] = useState(false);
  const [analyticsPanelTab, setAnalyticsPanelTab] = useState<'timing' | 'tires'>('timing');

  const raceName = session
    ? `${session.country_name} — ${session.circuit_short_name}`
    : 'F1 HUD';

  const sessionType = session?.session_name ?? (isLoading ? 'LOADING...' : 'DEMO DATA');

  // Get unique races (one per meeting), sorted by date
  const uniqueRaces = useMemo(() => {
    const seen = new Set<string>();
    const filtered = availableRaces.filter(race => {
      // Use country + circuit as unique identifier for each race meeting
      const raceId = `${race.country_name}_${race.circuit_short_name}`;
      if (seen.has(raceId)) return false;
      seen.add(raceId);
      return true;
    });
    return filtered.sort((a, b) => 
      new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
    );
  }, [availableRaces]);

  const handleRaceSelect = (sessionKey: number | null) => {
    setSelectedRaceKey(sessionKey);
    setShowRaceSelector(false);
  };

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
          {/* Race Selector */}
          <div className="app-topbar__race-selector">
            <button
              className="app-topbar__race-btn"
              onClick={() => setShowRaceSelector(!showRaceSelector)}
              title={`${uniqueRaces.length} races available`}
              aria-label="Select race"
            >
              🏁 RACES ({uniqueRaces.length})
            </button>
            {showRaceSelector && (
              <div className="app-topbar__race-dropdown">
                <button
                  className={`app-topbar__race-option ${selectedRaceKey === null ? 'active' : ''}`}
                  onClick={() => handleRaceSelect(null)}
                >
                  📍 Latest Race
                </button>
                <div className="app-topbar__race-divider" />
                {uniqueRaces.length > 0 ? (
                  uniqueRaces.map(race => (
                    <button
                      key={race.session_key}
                      className={`app-topbar__race-option ${
                        selectedRaceKey === race.session_key ? 'active' : ''
                      }`}
                      onClick={() => handleRaceSelect(race.session_key)}
                      title={new Date(race.date_start).toLocaleDateString()}
                    >
                      <span className="race-flag">🏁</span>
                      <span className="race-name">{race.country_name}</span>
                      <span className="race-circuit">{race.circuit_short_name}</span>
                      <span className="race-session">{race.session_name}</span>
                    </button>
                  ))
                ) : (
                  <div className="app-topbar__no-races">
                    Loading races...
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <span
              className="app-topbar__error"
              title={error}
            >
              ⚠ {error.includes('fetch') ? 'API UNAVAILABLE' : error}
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
          {/* Traditional 3-Column Layout */}
          <div className="app-main__content">
            {/* Left Sidebar */}
            <aside className="app-sidebar app-sidebar--left">
              <WinnerProbability standings={standings} />
              <LiveStandings
                standings={standings}
                currentLap={currentLap}
                totalLaps={totalLaps}
              />
            </aside>

            {/* Central Track Map */}
            <section className="app-main__center">
              <TrackMap standings={standings} raceCountry={session?.country_name} currentLap={currentLap} />
            </section>

            {/* Right Sidebar */}
            <aside className="app-sidebar app-sidebar--right">
              {/* Analytics Tab Controls */}
              <div className="app-analytics-tabs">
                <button 
                  className={`app-analytics-tab ${analyticsPanelTab === 'timing' ? 'active' : ''}`}
                  onClick={() => setAnalyticsPanelTab('timing')}
                  title="Live timing and gaps"
                >
                  ⏱ TIMING
                </button>
                <button 
                  className={`app-analytics-tab ${analyticsPanelTab === 'tires' ? 'active' : ''}`}
                  onClick={() => setAnalyticsPanelTab('tires')}
                  title="Tire strategy and degradation"
                >
                  🛞 TIRES
                </button>
              </div>

              {/* Content based on selected tab */}
              {analyticsPanelTab === 'timing' ? (
                <TimingTower
                  standings={standings}
                  currentLap={currentLap}
                  totalLaps={totalLaps}
                />
              ) : (
                <TireStrategy
                  tireAnalysis={analytics.tireAnalysis}
                  standings={standings}
                  currentLap={currentLap}
                  totalLaps={totalLaps}
                />
              )}
            </aside>
          </div>
        </main>
      )}


    </div>
  );
};

export default App;

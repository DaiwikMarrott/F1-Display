import React, { useState, useMemo } from 'react';
import { useF1Data } from './hooks/useF1Data';
import useAnalytics from './hooks/useAnalytics';
import { useIncidentDetection } from './hooks/useIncidentDetection';
import TimingTower from './components/TimingTower';
import TrackMap from './components/TrackMap';
import WinnerProbability from './components/WinnerProbability';
import LiveStandings from './components/LiveStandings';
import TireStrategy from './components/TireStrategy';
import SectorAnalysis from './components/SectorAnalysis';
import GapAnalysis from './components/GapAnalysis';
import StrategyAdvisor from './components/StrategyAdvisor';
import FormMomentum from './components/FormMomentum';
import TelemetryPanel from './components/TelemetryPanel';
import IncidentTracker from './components/IncidentTracker';
import PitStopOverlay from './components/PitStopOverlay';
import HeadToHead from './components/HeadToHead';
import TeamRadio from './components/TeamRadio';
import WeatherPanel from './components/WeatherPanel';
import { getDataQualityLabel } from './types/dataQuality';
import './App.css';

type AnalyticsTab = 'timing' | 'tires' | 'sectors' | 'gaps' | 'strategy' | 'form' | 'telemetry' | 'incidents' | 'h2h' | 'radio' | 'weather';

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
    pitNotifications,
    dismissPitNotification,
    dataQuality,
  } = useF1Data();

  // Analytics engine
  const analytics = useAnalytics(standings, currentLap, totalLaps);
  const incidents = useIncidentDetection(standings, currentLap, totalLaps);

  const [showRaceSelector, setShowRaceSelector] = useState(false);
  const [analyticsPanelTab, setAnalyticsPanelTab] = useState<AnalyticsTab>('timing');

  const raceName = session
    ? `${session.country_name} — ${session.circuit_short_name}`
    : 'F1 HUD';

  const sessionType = session?.session_name ?? (isLoading ? 'LOADING...' : 'DEMO DATA');

  // Get unique races (one per meeting), sorted by date
  const uniqueRaces = useMemo(() => {
    const seen = new Set<string>();
    const filtered = availableRaces.filter(race => {
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

  const renderAnalyticsPanel = () => {
    switch (analyticsPanelTab) {
      case 'timing':
        return <TimingTower standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
      case 'tires':
        return <TireStrategy tireAnalysis={analytics.tireAnalysis} standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
      case 'sectors':
        return <SectorAnalysis sectors={analytics.sectors} standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
      case 'gaps':
        return <GapAnalysis gapTrends={analytics.gapTrends} standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
      case 'strategy':
        return <StrategyAdvisor strategies={analytics.strategies} standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
      case 'form':
        return <FormMomentum formData={analytics.formData} standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
      case 'telemetry':
        return <TelemetryPanel telemetry={analytics.telemetry} standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
      case 'incidents':
        return <IncidentTracker incidents={incidents} standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
      case 'h2h':
        return <HeadToHead standings={standings} analytics={analytics} availableRaces={availableRaces} />;
      case 'radio':
        return <TeamRadio standings={standings} currentLap={currentLap} incidents={incidents} />;
      case 'weather':
        return <WeatherPanel currentLap={currentLap} totalLaps={totalLaps} />;
      default:
        return <TimingTower standings={standings} currentLap={currentLap} totalLaps={totalLaps} />;
    }
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
          {isLive && dataQuality.provenance === 'openf1' ? (
            <div className="app-topbar__live-badge">
              <span className="live-dot" />
              LIVE
            </div>
          ) : (
            <div
              className="app-topbar__demo-badge"
              title={dataQuality.message}
            >
              {getDataQualityLabel(dataQuality)}
            </div>
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
                      className={`app-topbar__race-option ${selectedRaceKey === race.session_key ? 'active' : ''
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

      {/* ── Pit Stop Overlay ── */}
      <PitStopOverlay
        notifications={pitNotifications}
        onDismiss={dismissPitNotification}
      />

      {/* ── Main Content ── */}
      {isLoading && standings.length === 0 ? (
        <div className="app-loading">
          <div className="app-loading__spinner" />
          <span className="app-loading__text">Loading F1 Data...</span>
        </div>
      ) : (
        <main className="app-main">
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
              <div className="app-analytics-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingBottom: '6px' }}>
                {([
                  { key: 'timing', icon: '⏱', label: 'TIMING' },
                  { key: 'tires', icon: '🛞', label: 'TIRES' },
                  { key: 'sectors', icon: '📊', label: 'SECTOR' },
                  { key: 'gaps', icon: '🎯', label: 'GAPS' },
                  { key: 'strategy', icon: '🧠', label: 'STRAT' },
                  { key: 'form', icon: '📈', label: 'FORM' },
                  { key: 'telemetry', icon: '📡', label: 'TELEM' },
                  { key: 'incidents', icon: '🚨', label: 'ALERT' },
                  { key: 'h2h', icon: '⚔️', label: 'H2H' },
                  { key: 'radio', icon: '🎧', label: 'RADIO' },
                  { key: 'weather', icon: '☁️', label: 'WTHR' },
                ] as { key: AnalyticsTab; icon: string; label: string }[]).map(tab => (
                  <button
                    key={tab.key}
                    className={`app-analytics-tab ${analyticsPanelTab === tab.key ? 'active' : ''}`}
                    onClick={() => setAnalyticsPanelTab(tab.key)}
                    title={tab.label}
                    style={{ flex: '1 1 20%', minWidth: '60px', padding: '6px 2px', fontSize: '9px' }}
                  >
                    <span style={{ fontSize: '11px', marginBottom: '2px', display: 'block' }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content based on selected tab */}
              {renderAnalyticsPanel()}
            </aside>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;

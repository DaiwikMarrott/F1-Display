import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  getSessionDisplayLabel,
  isRaceSession,
  normalizeSessionType,
} from './domain/sessionSelection';
import {
  buildSessionCatalogue,
  getCatalogueSessionLabel,
} from './domain/sessionCatalogue';
import { getAnalyticsProvenance } from './domain/analyticsProvenance';
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
    mapData,
  } = useF1Data();

  // Analytics engine
  const analytics = useAnalytics(standings, currentLap, totalLaps);
  const incidents = useIncidentDetection(standings, currentLap, totalLaps);

  const [showRaceSelector, setShowRaceSelector] = useState(false);
  const [analyticsPanelTab, setAnalyticsPanelTab] = useState<AnalyticsTab>('timing');
  const raceSelectorRef = useRef<HTMLDivElement>(null);

  const raceName = session
    ? `${session.year ?? new Date(session.date_start).getUTCFullYear()} ${session.meeting_name || session.country_name} — ${session.circuit_short_name}`
    : 'F1 HUD';

  const sessionType = session
    ? getSessionDisplayLabel(session)
    : (isLoading ? 'LOADING...' : 'DEMO DATA');
  const raceSession = session ? isRaceSession(session) : false;
  const standingsTitle = session
    ? `${normalizeSessionType(session).toUpperCase()} ${raceSession && standings.length > 0 ? 'STANDINGS' : 'ORDER'}`
    : 'SESSION ORDER';

  const sessionCatalogue = useMemo(
    () => buildSessionCatalogue(availableRaces),
    [availableRaces],
  );
  const sessionOptionCount = sessionCatalogue.reduce(
    (count, event) => count + event.sessions.length,
    0,
  );
  const analyticsProvenance = getAnalyticsProvenance(analyticsPanelTab, dataQuality);

  const handleRaceSelect = (sessionKey: number | null) => {
    setSelectedRaceKey(sessionKey);
    setShowRaceSelector(false);
  };

  useEffect(() => {
    if (!showRaceSelector) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!raceSelectorRef.current?.contains(event.target as Node)) {
        setShowRaceSelector(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowRaceSelector(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showRaceSelector]);

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
          {currentLap > 0 && totalLaps > 0 && (
            <span className="app-topbar__lap-counter">
              LAP {currentLap} / {totalLaps}
            </span>
          )}
        </div>

        <div className="app-topbar__right">
          {/* Race Selector */}
          <div className="app-topbar__race-selector" ref={raceSelectorRef}>
            <button
              className="app-topbar__race-btn"
              onClick={() => setShowRaceSelector(!showRaceSelector)}
              title={`${sessionOptionCount} sessions across ${sessionCatalogue.length} events`}
              aria-label="Select session"
              aria-expanded={showRaceSelector}
              aria-haspopup="true"
              aria-controls="session-selector-dropdown"
            >
              🏁 EVENTS ({sessionCatalogue.length})
            </button>
            {showRaceSelector && (
              <div
                className="app-topbar__race-dropdown"
                id="session-selector-dropdown"
              >
                <button
                  className={`app-topbar__race-option ${selectedRaceKey === null ? 'active' : ''}`}
                  onClick={() => handleRaceSelect(null)}
                >
                  📍 Latest Race
                </button>
                <div className="app-topbar__race-divider" />
                {sessionCatalogue.length > 0 ? (
                  sessionCatalogue.map(event => (
                    <div
                      className="app-topbar__event-group"
                      key={event.id}
                      role="group"
                      aria-label={`${event.year} ${event.eventName}`}
                    >
                      <div className="app-topbar__event-header">
                        <span className="event-year">{event.year}</span>
                        <span className="event-name">{event.eventName}</span>
                        <span className="event-circuit">
                          {event.countryName} · {event.circuitShortName}
                        </span>
                      </div>
                      {event.sessions.map(race => (
                        <button
                          key={race.session_key}
                          className={`app-topbar__race-option ${selectedRaceKey === race.session_key ? 'active' : ''
                            }`}
                          onClick={() => handleRaceSelect(race.session_key)}
                          title={new Date(race.date_start).toLocaleString()}
                          aria-label={getCatalogueSessionLabel(race)}
                        >
                          <span className="race-flag">🏁</span>
                          <span className="race-session">{getSessionDisplayLabel(race)}</span>
                          <span className="race-date">
                            {new Date(race.date_start).toLocaleDateString()}
                          </span>
                        </button>
                      ))}
                    </div>
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
        <main
          className="app-main"
          key={`${session?.meeting_key ?? 'none'}-${session?.session_key ?? selectedRaceKey ?? 'latest'}`}
        >
          <div className="app-main__content">
            {/* Left Sidebar */}
            <aside className="app-sidebar app-sidebar--left">
              {raceSession && standings.length > 0 && <WinnerProbability standings={standings} />}
              <LiveStandings
                standings={standings}
                currentLap={currentLap}
                totalLaps={totalLaps}
                title={standingsTitle}
                showRaceProgress={raceSession && standings.length > 0}
              />
            </aside>

            {/* Central Track Map */}
            <section className="app-main__center">
              <TrackMap
                standings={standings}
                session={session}
                currentLap={currentLap}
                isLoading={isLoading}
                mapData={mapData}
              />
            </section>

            {/* Right Sidebar */}
            <aside className="app-sidebar app-sidebar--right">
              {/* Analytics Tab Controls */}
              <div className="app-analytics-tabs">
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
                  >
                    <span className="app-analytics-tab__icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div
                className={`app-analytics-source app-analytics-source--${analyticsProvenance.provenance}`}
              >
                {analyticsProvenance.label}
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

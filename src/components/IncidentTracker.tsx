import type { Incident } from '../types/analytics';
import type { DriverStanding } from '../types/f1';
import './IncidentTracker.css';

interface Props {
    incidents: Incident[];
    standings: DriverStanding[];
    currentLap: number;
    totalLaps: number;
}

function getSeverityColor(severity: Incident['severity']): string {
    switch (severity) {
        case 'high': return '#e8002d';
        case 'medium': return '#f5a623';
        case 'low': return '#39b54a';
        default: return '#888899';
    }
}

function getTypeIcon(type: Incident['type']): string {
    switch (type) {
        case 'crash': return '💥';
        case 'spin': return '🔄';
        case 'off-track': return '⚠️';
        case 'pit-issue': return '🔧';
        case 'dnf': return '🏁';
        case 'safety-car': return '🚗';
        case 'vsc': return '🟡';
        default: return '❓';
    }
}

function getTypeLabel(type: Incident['type']): string {
    switch (type) {
        case 'crash': return 'CRASH';
        case 'spin': return 'SPIN';
        case 'off-track': return 'OFF TRACK';
        case 'pit-issue': return 'PIT ISSUE';
        case 'dnf': return 'DNF';
        case 'safety-car': return 'SAFETY CAR';
        case 'vsc': return 'VSC';
        default: return 'INCIDENT';
    }
}

function formatTimeAgo(timestamp: Date): string {
    const now = Date.now();
    const diff = now - timestamp.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function IncidentTracker({ incidents, standings, currentLap, totalLaps }: Props) {
    const activeIncidents = incidents.filter(i => !i.resolved);
    const resolvedIncidents = incidents.filter(i => i.resolved);

    const getDriverName = (driverNumber: number): string => {
        if (driverNumber === 0) return 'ALL DRIVERS';
        const standing = standings.find(s => s.driver.driver_number === driverNumber);
        return standing?.driver.name_acronym || `D${driverNumber}`;
    };

    const getDriverColor = (driverNumber: number): string => {
        if (driverNumber === 0) return '#e8002d';
        const standing = standings.find(s => s.driver.driver_number === driverNumber);
        return `#${standing?.driver.team_colour || 'ffffff'}`;
    };

    return (
        <div className="incident-tracker">
            <div className="incident-tracker__header">
                <h2 className="incident-tracker__title">INCIDENTS</h2>
                <span className="incident-tracker__lap">LAP {currentLap} / {totalLaps}</span>
            </div>

            {/* Active incidents alert banner */}
            {activeIncidents.length > 0 && (
                <div className="incident-tracker__active-banner">
                    <span className="incident-tracker__active-dot" />
                    <span>{activeIncidents.length} ACTIVE {activeIncidents.length === 1 ? 'INCIDENT' : 'INCIDENTS'}</span>
                </div>
            )}

            <div className="incident-tracker__list">
                {incidents.length === 0 ? (
                    <div className="incident-tracker__empty">
                        <span className="incident-tracker__empty-icon">✅</span>
                        <span>No incidents reported</span>
                    </div>
                ) : (
                    <>
                        {/* Active incidents first */}
                        {activeIncidents.map(incident => (
                            <div
                                key={incident.id}
                                className="incident-tracker__card incident-tracker__card--active"
                                style={{ borderLeftColor: getSeverityColor(incident.severity) }}
                            >
                                <div className="incident-tracker__card-header">
                                    <div className="incident-tracker__type">
                                        <span className="incident-tracker__type-icon">{getTypeIcon(incident.type)}</span>
                                        <span className="incident-tracker__type-label">{getTypeLabel(incident.type)}</span>
                                    </div>
                                    <div className="incident-tracker__severity" style={{ color: getSeverityColor(incident.severity) }}>
                                        {incident.severity.toUpperCase()}
                                    </div>
                                </div>
                                <div className="incident-tracker__description">{incident.description}</div>
                                <div className="incident-tracker__card-footer">
                                    <span
                                        className="incident-tracker__driver"
                                        style={{ color: getDriverColor(incident.affectedDriver) }}
                                    >
                                        {getDriverName(incident.affectedDriver)}
                                    </span>
                                    <span className="incident-tracker__lap-badge">LAP {incident.lap}</span>
                                    <span className="incident-tracker__time">{formatTimeAgo(incident.timestamp)}</span>
                                </div>
                            </div>
                        ))}

                        {/* Resolved incidents */}
                        {resolvedIncidents.length > 0 && activeIncidents.length > 0 && (
                            <div className="incident-tracker__section-divider">RESOLVED</div>
                        )}
                        {resolvedIncidents.map(incident => (
                            <div
                                key={incident.id}
                                className="incident-tracker__card incident-tracker__card--resolved"
                                style={{ borderLeftColor: getSeverityColor(incident.severity) }}
                            >
                                <div className="incident-tracker__card-header">
                                    <div className="incident-tracker__type">
                                        <span className="incident-tracker__type-icon">{getTypeIcon(incident.type)}</span>
                                        <span className="incident-tracker__type-label">{getTypeLabel(incident.type)}</span>
                                    </div>
                                    <span className="incident-tracker__resolved-badge">RESOLVED</span>
                                </div>
                                <div className="incident-tracker__description">{incident.description}</div>
                                <div className="incident-tracker__card-footer">
                                    <span
                                        className="incident-tracker__driver"
                                        style={{ color: getDriverColor(incident.affectedDriver) }}
                                    >
                                        {getDriverName(incident.affectedDriver)}
                                    </span>
                                    <span className="incident-tracker__lap-badge">LAP {incident.lap}</span>
                                    <span className="incident-tracker__time">{formatTimeAgo(incident.timestamp)}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

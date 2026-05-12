import { useMemo } from 'react';
import type { Incident } from '../types/analytics';
import type { DriverStanding } from '../types/f1';
import './TeamRadio.css';

interface RadioMessage {
    id: string;
    driverNum: number;
    message: string;
    source: 'ENGINEER' | 'DRIVER' | 'RACE CONTROL';
    type: 'strategy' | 'complain' | 'info' | 'critical';
    lap: number;
}

interface Props {
    standings: DriverStanding[];
    currentLap: number;
    incidents: Incident[];
}

export default function TeamRadio({ standings, currentLap, incidents }: Props) {
    // Generate simulated radio messages based on standings and incidents
    const messages = useMemo(() => {
        const msgs: RadioMessage[] = [];
        let sequence = 0;

        const pushMessage = (message: Omit<RadioMessage, 'id'>) => {
            msgs.push({
                ...message,
                id: `radio-${message.driverNum}-${message.lap}-${sequence++}`,
            });
        };

        // Check for pit windows
        standings.forEach(d => {
            if (d.tireAge > 20) {
                pushMessage({
                    driverNum: d.driver.driver_number,
                    source: 'ENGINEER',
                    message: d.position <= 5
                        ? 'Box, box. The undercut window is open. Stay in front of the pack.'
                        : 'Box, box. We are changing to Hard compound this lap.',
                    type: 'strategy',
                    lap: currentLap - Math.floor(Math.random() * 2),
                });
            }
        });

        // Top drivers
        if (standings.length > 2) {
            pushMessage({
                driverNum: standings[1].driver.driver_number,
                source: 'ENGINEER',
                message: `Gap to leader is ${standings[1].gapToLeader}. Push now, he is struggling on those tires.`,
                type: 'info',
                lap: currentLap,
            });
        }

        // Convert incidents to radio
        incidents.slice(0, 3).forEach(inc => {
            if (inc.type === 'safety-car' || inc.type === 'vsc') {
                pushMessage({
                    driverNum: standings[0]?.driver.driver_number || 1,
                    source: 'RACE CONTROL',
                    message: `${inc.type === 'safety-car' ? 'Safety Car' : 'VSC'} deployed. Reduce speed. Delta positive.`,
                    type: 'critical',
                    lap: inc.lap,
                });
            } else if (inc.affectedDriver !== 0) {
                pushMessage({
                    driverNum: inc.affectedDriver,
                    source: 'DRIVER',
                    message: inc.type === 'crash' ? "I'm in the wall. I'm okay." : "Tires are gone, rear is sliding everywhere.",
                    type: inc.type === 'crash' ? 'critical' : 'complain',
                    lap: inc.lap,
                });
            }
        });

        return msgs.sort((a, b) => a.lap - b.lap || a.id.localeCompare(b.id));
    }, [standings, currentLap, incidents]);

    const strategyLog = useMemo(
        () => messages.filter(msg => msg.type === 'strategy').slice(-5),
        [messages]
    );

    const activeThreads = useMemo(() => {
        const drivers = new Set(messages.map(msg => msg.driverNum));
        return drivers.size;
    }, [messages]);

    return (
        <div className="radio-panel">
            <div className="radio-panel__header">TEAM RADIO</div>
            <div className="radio-panel__summary">
                <span>{messages.length} messages</span>
                <span>{strategyLog.length} strategy calls</span>
                <span>{activeThreads} driver threads</span>
            </div>
            <div className="radio-panel__content">
                {messages.map(msg => {
                    const driver = standings.find(s => s.driver.driver_number === msg.driverNum);
                    return (
                        <div key={msg.id} className={`radio-msg radio-msg--${msg.type}`}>
                            <div className="radio-msg__header">
                                <span className="radio-msg__driver" style={{ color: driver ? `#${driver.driver.team_colour}` : '#fff' }}>
                                    {driver ? driver.driver.name_acronym : `D${msg.driverNum}`}
                                </span>
                                <span className="radio-msg__lap">LAP {msg.lap}</span>
                            </div>
                            <div className="radio-msg__meta">{msg.source} · {msg.type.toUpperCase()}</div>
                            <div className="radio-msg__text">"{msg.message}"</div>
                            <div className="radio-msg__audiowave">|||ı|ı||ı|ı|ıı|||</div>
                        </div>
                    );
                })}
            </div>
            <div className="radio-panel__timeline">
                <div className="radio-panel__timeline-title">Strategy Changes Log</div>
                {strategyLog.length > 0 ? (
                    strategyLog.map(msg => (
                        <div key={`strategy-${msg.id}`} className="radio-panel__timeline-item">
                            <span className="radio-panel__timeline-lap">L{msg.lap}</span>
                            <span className="radio-panel__timeline-driver">{standings.find(s => s.driver.driver_number === msg.driverNum)?.driver.name_acronym || `D${msg.driverNum}`}</span>
                            <span className="radio-panel__timeline-text">{msg.message}</span>
                        </div>
                    ))
                ) : (
                    <div className="radio-panel__timeline-empty">No strategy calls captured</div>
                )}
            </div>
        </div>
    );
}

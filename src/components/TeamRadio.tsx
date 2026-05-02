import { useMemo } from 'react';
import type { Incident } from '../types/analytics';
import type { DriverStanding } from '../types/f1';
import './TeamRadio.css';

interface RadioMessage {
    id: string;
    driverNum: number;
    message: string;
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

        // Check for pit windows
        standings.forEach(d => {
            if (d.tireAge > 20) {
                msgs.push({
                    id: `radio-pit-${d.driver.driver_number}-${currentLap}`,
                    driverNum: d.driver.driver_number,
                    message: "Box, box. We are changing to Hard compound this lap.",
                    type: 'strategy',
                    lap: currentLap - Math.floor(Math.random() * 2)
                });
            }
        });

        // Top drivers
        if (standings.length > 2) {
            msgs.push({
                id: `radio-gap-${currentLap}`,
                driverNum: standings[1].driver.driver_number,
                message: `Gap to leader is ${standings[1].gapToLeader}. Push now, he is struggling on those tires.`,
                type: 'info',
                lap: currentLap
            });
        }

        // Convert incidents to radio
        incidents.slice(0, 3).forEach(inc => {
            if (inc.type === 'safety-car' || inc.type === 'vsc') {
                msgs.push({
                    id: `radio-sc-${inc.id}`,
                    driverNum: standings[0]?.driver.driver_number || 1,
                    message: `${inc.type === 'safety-car' ? 'Safety Car' : 'VSC'} deployed. Reduce speed. Delta positive.`,
                    type: 'critical',
                    lap: inc.lap
                });
            } else if (inc.affectedDriver !== 0) {
                msgs.push({
                    id: `radio-inc-${inc.id}`,
                    driverNum: inc.affectedDriver,
                    message: inc.type === 'crash' ? "I'm in the wall. I'm okay." : "Tires are gone, rear is sliding everywhere.",
                    type: inc.type === 'crash' ? 'critical' : 'complain',
                    lap: inc.lap
                });
            }
        });

        return msgs.sort((a, b) => b.lap - a.lap);
    }, [standings, currentLap, incidents]);

    return (
        <div className="radio-panel">
            <div className="radio-panel__header">TEAM RADIO</div>
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
                            <div className="radio-msg__text">"{msg.message}"</div>
                            <div className="radio-msg__audiowave">|||ı|ı||ı|ı|ıı|||</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import { useMemo } from 'react';
import { formatLapProgress } from '../utils/formatters';
import './WeatherPanel.css';

interface Props {
    currentLap: number;
    totalLaps: number;
}

export default function WeatherPanel({ currentLap, totalLaps }: Props) {
    const hasRaceProgress = currentLap > 0 && totalLaps > 0 && currentLap <= totalLaps;

    // Simulate weather state based on race progress
    const { trackTemp, airTemp, rainProb, condition } = useMemo(() => {
        const baseAir = 22;
        const baseTrack = 35;

        // Temps slowly change as race goes on
        const timeFactor = hasRaceProgress ? currentLap / totalLaps : 0;

        const airTemp = baseAir + (timeFactor * 3) - (Math.random() * 0.5);
        const trackTemp = baseTrack + (timeFactor * 6) - (Math.random() * 1.5);

        // Rain probability increases slightly if we're mid-race
        let rainProb = 0;
        let condition = 'Dry';
        if (currentLap > 20 && currentLap < 40) {
            rainProb = Math.floor(Math.random() * 25); // 0-25%
            if (rainProb > 15) condition = 'Cloudy';
        } else {
            rainProb = Math.floor(Math.random() * 5);
        }

        return { trackTemp, airTemp, rainProb, condition };
    }, [currentLap, totalLaps, hasRaceProgress]);

    if (!hasRaceProgress) {
        return (
            <div className="weather-panel">
                <div className="weather-panel__header">WEATHER IMPACT</div>
                <div className="weather-panel__content">
                    <div className="weather-status">{formatLapProgress(currentLap, totalLaps)}</div>
                    <div className="weather-trend">Weather estimate unavailable</div>
                </div>
            </div>
        );
    }

    return (
        <div className="weather-panel">
            <div className="weather-panel__header">WEATHER IMPACT</div>
            <div className="weather-panel__content">

                <div className="weather-main-condition">
                    <div className="weather-icon">{condition === 'Dry' ? '☀️' : '☁️'}</div>
                    <div className="weather-status">TRACK {condition.toUpperCase()}</div>
                </div>

                <div className="weather-grid">
                    <div className="weather-card">
                        <div className="weather-label">TRACK TEMP</div>
                        <div className="weather-value">{trackTemp.toFixed(1)}°C</div>
                        <div className="weather-trend">↑ Rising from 35.0°C</div>
                    </div>

                    <div className="weather-card">
                        <div className="weather-label">AIR TEMP</div>
                        <div className="weather-value">{airTemp.toFixed(1)}°C</div>
                        <div className="weather-trend">↑ Rising</div>
                    </div>

                    <div className="weather-card">
                        <div className="weather-label">RAIN PROB.</div>
                        <div className="weather-value">{rainProb}%</div>
                        <div className="weather-trend line-blue">Low Risk</div>
                    </div>

                    <div className="weather-card">
                        <div className="weather-label">HUMIDITY</div>
                        <div className="weather-value">45%</div>
                        <div className="weather-trend">Stable</div>
                    </div>
                </div>

                <div className="weather-radar">
                    <div className="radar-label">RADAR PREDICTION (NEXT 30 MINS)</div>
                    <div className="radar-display">
                        {/* Simple static radar gradient */}
                        <div className="radar-bar" style={{ background: 'linear-gradient(90deg, #15151e 0%, #15151e 60%, rgba(0, 119, 255, 0.2) 100%)' }}></div>
                        <div className="radar-markers">
                            <span>NOW</span>
                            <span>+15m</span>
                            <span>+30m</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

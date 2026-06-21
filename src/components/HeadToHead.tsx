import { useEffect, useMemo, useState } from 'react';
import type { DriverStanding } from '../types/f1';
import type { AnalyticsState } from '../types/analytics';
import {
    loadSeasonSummary,
    type SeasonSummary,
} from '../services/openf1/seasonSummary';
import './HeadToHead.css';

interface SessionLite {
    session_key: number;
    date_start: string;
    date_end: string;
    country_name: string;
    circuit_short_name: string;
    session_name: string;
    session_type: string;
    status?: string;
}

interface Props {
    standings: DriverStanding[];
    analytics: AnalyticsState;
    availableRaces: SessionLite[];
}

type SeasonStatus = 'loading' | 'success' | 'partial' | 'empty' | 'error';

export default function HeadToHead({ standings, analytics, availableRaces }: Props) {
    const [seasonStats, setSeasonStats] = useState<Record<number, SeasonSummary | null>>({});
    const [seasonStatus, setSeasonStatus] = useState<SeasonStatus>('loading');
    const [seasonMessage, setSeasonMessage] = useState('Loading recent race results');
    const [retryToken, setRetryToken] = useState(0);
    const [driver1Num, setDriver1Num] = useState<number>(standings[0]?.driver.driver_number || 1);
    const [driver2Num, setDriver2Num] = useState<number>(standings[1]?.driver.driver_number || 16);

    const recentRaces = useMemo(() => {
        const seen = new Set<string>();
        return availableRaces
            .filter(race => race.session_type.toLowerCase() === 'race')
            .filter(race => Date.parse(race.date_end) <= Date.now())
            .filter(race => {
                const raceId = `${race.country_name}_${race.circuit_short_name}`;
                if (seen.has(raceId)) return false;
                seen.add(raceId);
                return true;
            })
            .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())
            .slice(0, 6);
    }, [availableRaces]);

    useEffect(() => {
        let cancelled = false;

        if (recentRaces.length === 0) {
            setSeasonStats({});
            setSeasonStatus('empty');
            setSeasonMessage('No completed race data available');
            return () => {
                cancelled = true;
            };
        }

        setSeasonStatus('loading');
        setSeasonMessage('Loading recent race results');

        Promise.allSettled([
            loadSeasonSummary(driver1Num, recentRaces),
            loadSeasonSummary(driver2Num, recentRaces),
        ])
            .then(([driver1Result, driver2Result]) => {
                if (cancelled) return;
                if (driver1Result.status === 'rejected' && driver2Result.status === 'rejected') {
                    setSeasonStats({});
                    setSeasonStatus('error');
                    setSeasonMessage('Unable to load recent race results');
                    return;
                }

                const driver1Stats = driver1Result.status === 'fulfilled' ? driver1Result.value : null;
                const driver2Stats = driver2Result.status === 'fulfilled' ? driver2Result.value : null;
                setSeasonStats({
                    [driver1Num]: driver1Stats,
                    [driver2Num]: driver2Stats,
                });
                if (!driver1Stats && !driver2Stats) {
                    setSeasonStatus('empty');
                    setSeasonMessage('No completed race results found for these drivers');
                } else if (!driver1Stats || !driver2Stats) {
                    setSeasonStatus('partial');
                    setSeasonMessage('Partial season data');
                } else {
                    setSeasonStatus('success');
                    setSeasonMessage(`Based on up to ${recentRaces.length} recent races`);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [driver1Num, driver2Num, recentRaces, retryToken]);

    const seasonValue = (
        driverNumber: number,
        format: (summary: SeasonSummary) => string,
    ): string => {
        if (seasonStatus === 'loading') return 'LOADING';
        if (seasonStatus === 'error') return 'ERROR';
        const summary = seasonStats[driverNumber];
        return summary ? format(summary) : 'N/A';
    };

    const getDriverData = (num: number) => {
        const standing = standings.find(s => s.driver.driver_number === num);
        if (!standing) return null;
        return {
            standing,
            tire: analytics.tireAnalysis.get(num),
            sector: analytics.sectors.get(num),
            form: analytics.formData.get(num),
            telemetry: analytics.telemetry.get(num),
            strategy: analytics.strategies.get(num)
        };
    };

    const d1 = getDriverData(driver1Num);
    const d2 = getDriverData(driver2Num);

    if (!d1 || !d2) return <div className="h2h-panel empty">Select drivers to compare</div>;

    const compareStat = (val1: number, val2: number, lowerIsBetter = false) => {
        if (val1 === val2) return 'equal';
        if (lowerIsBetter) {
            return val1 < val2 ? 'better-1' : 'better-2';
        }
        return val1 > val2 ? 'better-1' : 'better-2';
    };

    const formatLapTime = (val: number | null | undefined) => {
        if (!val || val === 0) return 'NO TIME';
        const m = Math.floor(val / 60);
        const s = Math.floor(val % 60);
        const ms = Math.floor((val % 1) * 1000);
        return m > 0 ? `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}` : `${s}.${ms.toString().padStart(3, '0')}`;
    };

    return (
        <div className="h2h-panel">
            <div className="h2h-panel__header">HEAD-TO-HEAD</div>

            {/* Driver Selectors */}
            <div className="h2h-panel__selectors">
                <select value={driver1Num} onChange={(e) => setDriver1Num(Number(e.target.value))} className="h2h-select h2h-select--1">
                    {standings.map(s => <option key={`d1-${s.driver.driver_number}`} value={s.driver.driver_number}>{s.driver.name_acronym}</option>)}
                </select>
                <div className="h2h-vs">VS</div>
                <select value={driver2Num} onChange={(e) => setDriver2Num(Number(e.target.value))} className="h2h-select h2h-select--2">
                    {standings.map(s => <option key={`d2-${s.driver.driver_number}`} value={s.driver.driver_number}>{s.driver.name_acronym}</option>)}
                </select>
            </div>

            <div className="h2h-panel__content">
                {/* Basic Info */}
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1" style={{ color: `#${d1.standing.driver.team_colour}` }}>P{d1.standing.position}</div>
                    <div className="h2h-label">POSITION</div>
                    <div className="h2h-cell h2h-cell--2" style={{ color: `#${d2.standing.driver.team_colour}` }}>P{d2.standing.position}</div>
                </div>

                {/* Lap Times */}
                <div className="h2h-row">
                    <div className={`h2h-cell h2h-cell--1 ${compareStat(d1.standing.bestLap || 999, d2.standing.bestLap || 999, true) === 'better-1' ? 'h2h-winner' : ''}`}>{formatLapTime(d1.standing.bestLap)}</div>
                    <div className="h2h-label">BEST LAP</div>
                    <div className={`h2h-cell h2h-cell--2 ${compareStat(d1.standing.bestLap || 999, d2.standing.bestLap || 999, true) === 'better-2' ? 'h2h-winner' : ''}`}>{formatLapTime(d2.standing.bestLap)}</div>
                </div>
                <div className="h2h-row">
                    <div className={`h2h-cell h2h-cell--1 ${compareStat(d1.standing.lastLap || 999, d2.standing.lastLap || 999, true) === 'better-1' ? 'h2h-winner' : ''}`}>{formatLapTime(d1.standing.lastLap)}</div>
                    <div className="h2h-label">LAST LAP</div>
                    <div className={`h2h-cell h2h-cell--2 ${compareStat(d1.standing.lastLap || 999, d2.standing.lastLap || 999, true) === 'better-2' ? 'h2h-winner' : ''}`}>{formatLapTime(d2.standing.lastLap)}</div>
                </div>

                {/* Tires */}
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">
                        {d1.tire ? (
                            <><span className={`h2h-compound h2h-compound--${d1.tire.compound.toLowerCase()}`}>{d1.tire.compound[0]}</span> ({d1.tire.age} L)</>
                        ) : 'Unavailable'}
                    </div>
                    <div className="h2h-label">TIRES</div>
                    <div className="h2h-cell h2h-cell--2">
                        {d2.tire ? (
                            <><span className={`h2h-compound h2h-compound--${d2.tire.compound.toLowerCase()}`}>{d2.tire.compound[0]}</span> ({d2.tire.age} L)</>
                        ) : 'Unavailable'}
                    </div>
                </div>

                {/* Telemetry */}
                <div className="h2h-divider">TELEMETRY</div>
                <div className="h2h-row">
                    <div className={`h2h-cell h2h-cell--1 ${compareStat(d1.telemetry?.topSpeed || 0, d2.telemetry?.topSpeed || 0) === 'better-1' ? 'h2h-winner' : ''}`}>{d1.telemetry?.topSpeed} km/h</div>
                    <div className="h2h-label">TOP SPEED</div>
                    <div className={`h2h-cell h2h-cell--2 ${compareStat(d1.telemetry?.topSpeed || 0, d2.telemetry?.topSpeed || 0) === 'better-2' ? 'h2h-winner' : ''}`}>{d2.telemetry?.topSpeed} km/h</div>
                </div>
                <div className="h2h-row">
                    <div className={`h2h-cell h2h-cell--1 ${compareStat(d1.telemetry?.acceleration || 0, d2.telemetry?.acceleration || 0) === 'better-1' ? 'h2h-winner' : ''}`}>{Math.round(d1.telemetry?.acceleration || 0)}%</div>
                    <div className="h2h-label">ACCEL.</div>
                    <div className={`h2h-cell h2h-cell--2 ${compareStat(d1.telemetry?.acceleration || 0, d2.telemetry?.acceleration || 0) === 'better-2' ? 'h2h-winner' : ''}`}>{Math.round(d2.telemetry?.acceleration || 0)}%</div>
                </div>

                {/* Form/Sectors */}
                <div className="h2h-divider">FORM & SECTORS</div>
                <div className="h2h-row">
                    <div className={`h2h-cell h2h-cell--1 ${compareStat(d1.form?.momentumScore || 0, d2.form?.momentumScore || 0) === 'better-1' ? 'h2h-winner' : ''}`}>{d1.form?.momentumScore}</div>
                    <div className="h2h-label">MOMENTUM</div>
                    <div className={`h2h-cell h2h-cell--2 ${compareStat(d1.form?.momentumScore || 0, d2.form?.momentumScore || 0) === 'better-2' ? 'h2h-winner' : ''}`}>{d2.form?.momentumScore}</div>
                </div>
                <div className="h2h-row">
                    <div className={`h2h-cell h2h-cell--1 ${compareStat(d1.form?.consistency || 0, d2.form?.consistency || 0) === 'better-1' ? 'h2h-winner' : ''}`}>{d1.form?.consistency}%</div>
                    <div className="h2h-label">CONSISTENCY</div>
                    <div className={`h2h-cell h2h-cell--2 ${compareStat(d1.form?.consistency || 0, d2.form?.consistency || 0) === 'better-2' ? 'h2h-winner' : ''}`}>{d2.form?.consistency}%</div>
                </div>

                <div className="h2h-divider">SEASON SNAPSHOT</div>
                <div className={`h2h-season-state h2h-season-state--${seasonStatus}`}>
                    <span>{seasonMessage}</span>
                    {seasonStatus === 'error' && (
                        <button type="button" onClick={() => setRetryToken(token => token + 1)}>
                            Retry
                        </button>
                    )}
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonValue(driver1Num, summary => `${summary.racesAnalyzed}`)}</div>
                    <div className="h2h-label">RACES</div>
                    <div className="h2h-cell h2h-cell--2">{seasonValue(driver2Num, summary => `${summary.racesAnalyzed}`)}</div>
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonValue(driver1Num, summary => `P${summary.bestFinish}`)}</div>
                    <div className="h2h-label">BEST</div>
                    <div className="h2h-cell h2h-cell--2">{seasonValue(driver2Num, summary => `P${summary.bestFinish}`)}</div>
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonValue(driver1Num, summary => `${summary.podiums} / ${summary.wins}`)}</div>
                    <div className="h2h-label">POD/WIN</div>
                    <div className="h2h-cell h2h-cell--2">{seasonValue(driver2Num, summary => `${summary.podiums} / ${summary.wins}`)}</div>
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonValue(driver1Num, summary => `${summary.points} pts`)}</div>
                    <div className="h2h-label">POINTS</div>
                    <div className="h2h-cell h2h-cell--2">{seasonValue(driver2Num, summary => `${summary.points} pts`)}</div>
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonValue(driver1Num, summary => summary.lastResult ? `P${summary.lastResult}` : 'N/A')}</div>
                    <div className="h2h-label">LAST RESULT</div>
                    <div className="h2h-cell h2h-cell--2">{seasonValue(driver2Num, summary => summary.lastResult ? `P${summary.lastResult}` : 'N/A')}</div>
                </div>
            </div>
        </div>
    );
}

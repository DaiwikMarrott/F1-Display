import { useEffect, useMemo, useState } from 'react';
import type { DriverStanding } from '../types/f1';
import type { AnalyticsState } from '../types/analytics';
import './HeadToHead.css';

interface SessionLite {
    session_key: number;
    date_start: string;
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

interface SeasonSummary {
    racesAnalyzed: number;
    averageFinish: number;
    bestFinish: number;
    podiums: number;
    wins: number;
    points: number;
    lastResult: number | null;
}

async function fetchJSON<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return response.json() as Promise<T>;
}

function pointsForFinish(position: number): number {
    if (position === 1) return 25;
    if (position === 2) return 18;
    if (position === 3) return 15;
    if (position === 4) return 12;
    if (position === 5) return 10;
    if (position === 6) return 8;
    if (position === 7) return 6;
    if (position === 8) return 4;
    if (position === 9) return 2;
    if (position === 10) return 1;
    return 0;
}

export default function HeadToHead({ standings, analytics, availableRaces }: Props) {
    const [seasonStats, setSeasonStats] = useState<Record<number, SeasonSummary | null>>({});
    const [driver1Num, setDriver1Num] = useState<number>(standings[0]?.driver.driver_number || 1);
    const [driver2Num, setDriver2Num] = useState<number>(standings[1]?.driver.driver_number || 16);

    const recentRaces = useMemo(() => {
        const seen = new Set<string>();
        return availableRaces
            .filter(race => race.session_type.toLowerCase() === 'race')
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

        async function loadSeasonSummary(driverNumber: number): Promise<SeasonSummary | null> {
            if (recentRaces.length === 0) return null;

            const results = await Promise.allSettled(
                recentRaces.map(async race => {
                    const positions = await fetchJSON<Array<{ driver_number: number; position: number; date: string }>>(
                        `https://api.openf1.org/v1/position?session_key=${race.session_key}`
                    );
                    const driverRows = positions
                        .filter(row => row.driver_number === driverNumber)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const finalRow = driverRows[driverRows.length - 1];
                    return finalRow ? finalRow.position : null;
                })
            );

            const finishes = results
                .filter((result): result is PromiseFulfilledResult<number | null> => result.status === 'fulfilled')
                .map(result => result.value)
                .filter((value): value is number => typeof value === 'number' && value > 0);

            if (finishes.length === 0) return null;

            const averageFinish = finishes.reduce((sum, value) => sum + value, 0) / finishes.length;
            const bestFinish = Math.min(...finishes);
            const podiums = finishes.filter(value => value <= 3).length;
            const wins = finishes.filter(value => value === 1).length;
            const points = finishes.reduce((sum, value) => sum + pointsForFinish(value), 0);

            return {
                racesAnalyzed: finishes.length,
                averageFinish,
                bestFinish,
                podiums,
                wins,
                points,
                lastResult: finishes[0] ?? null,
            };
        }

        Promise.all([loadSeasonSummary(driver1Num), loadSeasonSummary(driver2Num)])
            .then(([driver1Stats, driver2Stats]) => {
                if (cancelled) return;
                setSeasonStats({
                    [driver1Num]: driver1Stats,
                    [driver2Num]: driver2Stats,
                });
            })
            .catch(() => {
                if (cancelled) return;
                setSeasonStats({
                    [driver1Num]: null,
                    [driver2Num]: null,
                });
            });

        return () => {
            cancelled = true;
        };
    }, [driver1Num, driver2Num, recentRaces]);

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
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonStats[driver1Num] ? `${seasonStats[driver1Num]!.racesAnalyzed}` : 'LOADING'}</div>
                    <div className="h2h-label">RACES</div>
                    <div className="h2h-cell h2h-cell--2">{seasonStats[driver2Num] ? `${seasonStats[driver2Num]!.racesAnalyzed}` : 'LOADING'}</div>
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonStats[driver1Num] ? `P${seasonStats[driver1Num]!.bestFinish}` : 'LOADING'}</div>
                    <div className="h2h-label">BEST</div>
                    <div className="h2h-cell h2h-cell--2">{seasonStats[driver2Num] ? `P${seasonStats[driver2Num]!.bestFinish}` : 'LOADING'}</div>
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonStats[driver1Num] ? `${seasonStats[driver1Num]!.podiums} / ${seasonStats[driver1Num]!.wins}` : 'LOADING'}</div>
                    <div className="h2h-label">POD/WIN</div>
                    <div className="h2h-cell h2h-cell--2">{seasonStats[driver2Num] ? `${seasonStats[driver2Num]!.podiums} / ${seasonStats[driver2Num]!.wins}` : 'LOADING'}</div>
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonStats[driver1Num] ? `${seasonStats[driver1Num]!.points} pts` : 'LOADING'}</div>
                    <div className="h2h-label">POINTS</div>
                    <div className="h2h-cell h2h-cell--2">{seasonStats[driver2Num] ? `${seasonStats[driver2Num]!.points} pts` : 'LOADING'}</div>
                </div>
                <div className="h2h-row">
                    <div className="h2h-cell h2h-cell--1">{seasonStats[driver1Num] ? `P${seasonStats[driver1Num]!.lastResult ?? 0}` : 'LOADING'}</div>
                    <div className="h2h-label">LAST RESULT</div>
                    <div className="h2h-cell h2h-cell--2">{seasonStats[driver2Num] ? `P${seasonStats[driver2Num]!.lastResult ?? 0}` : 'LOADING'}</div>
                </div>
            </div>
        </div>
    );
}

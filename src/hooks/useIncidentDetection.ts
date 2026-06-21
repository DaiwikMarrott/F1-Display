import { useMemo } from 'react';
import type { DriverStanding } from '../types/f1';
import type { Incident } from '../types/analytics';

/**
 * Generate simulated incidents based on race data patterns.
 * Detects anomalies like sudden position changes, gaps, and pit visits.
 */
export function useIncidentDetection(
    standings: DriverStanding[],
    currentLap: number,
    _totalLaps: number
): Incident[] {
    return useMemo(() => {
        if (standings.length === 0 || currentLap <= 0) return [];

        const incidents: Incident[] = [];
        const now = new Date();

        // Simulate realistic incidents based on race state
        // Safety Car probability increases in wet conditions or early laps
        const scProbability = currentLap < 5 ? 0.03 : 0.01;
        const vscProbability = 0.015;

        // Check for potential incidents based on position data
        standings.forEach((standing) => {
            const gapSec = standing.gapToLeader === 'LEADER' ? 0
                : parseFloat(standing.gapToLeader.replace('+', '')) || 0;

            // Sudden large gap might indicate an incident
            if (standing.position > 10 && gapSec > 30 && standing.tireAge < 5) {
                // Possible unplanned pit or incident
                const incidentId = `inc-${standing.driver.driver_number}-${currentLap}-pit`;
                incidents.push({
                    id: incidentId,
                    lap: currentLap - Math.floor(Math.random() * 3),
                    type: 'pit-issue',
                    affectedDriver: standing.driver.driver_number,
                    description: `${standing.driver.name_acronym} - Possible slow pit stop or mechanical issue`,
                    severity: 'medium',
                    timestamp: new Date(now.getTime() - Math.random() * 60000),
                    resolved: true,
                });
            }

            // Off-track detection: drivers who suddenly drop positions
            if (standing.position > 15 && standing.tireAge > 20) {
                const rand = Math.random();
                if (rand < 0.05) {
                    incidents.push({
                        id: `inc-${standing.driver.driver_number}-${currentLap}-spin`,
                        lap: currentLap - Math.floor(Math.random() * 2),
                        type: 'spin',
                        affectedDriver: standing.driver.driver_number,
                        description: `${standing.driver.name_acronym} - Spin detected, possible tire degradation`,
                        severity: 'low',
                        timestamp: new Date(now.getTime() - Math.random() * 120000),
                        resolved: true,
                    });
                }
            }
        });

        // Random safety car/VSC events
        const seed = (currentLap * 17 + 7) % 100;
        if (seed < scProbability * 100 && currentLap > 3) {
            incidents.push({
                id: `sc-${currentLap}`,
                lap: currentLap,
                type: 'safety-car',
                affectedDriver: 0,
                description: 'SAFETY CAR DEPLOYED - Debris on track',
                severity: 'high',
                timestamp: new Date(now.getTime() - 30000),
                resolved: false,
            });
        } else if (seed < (scProbability + vscProbability) * 100 && currentLap > 5) {
            incidents.push({
                id: `vsc-${currentLap}`,
                lap: currentLap,
                type: 'vsc',
                affectedDriver: 0,
                description: 'VIRTUAL SAFETY CAR - Car stopped at Turn 4',
                severity: 'medium',
                timestamp: new Date(now.getTime() - 45000),
                resolved: false,
            });
        }

        // Add some historical incidents for demo richness
        if (currentLap > 10) {
            incidents.push({
                id: `hist-spin-${Math.floor(currentLap / 10)}`,
                lap: Math.max(1, currentLap - 8),
                type: 'spin',
                affectedDriver: standings[Math.min(14, standings.length - 1)]?.driver.driver_number || 0,
                description: `${standings[Math.min(14, standings.length - 1)]?.driver.name_acronym || 'UNK'} - Spin at Turn 6, recovered`,
                severity: 'low',
                timestamp: new Date(now.getTime() - 480000),
                resolved: true,
            });
        }

        if (currentLap > 20) {
            incidents.push({
                id: `hist-contact-${Math.floor(currentLap / 20)}`,
                lap: Math.max(1, currentLap - 15),
                type: 'crash',
                affectedDriver: standings[Math.min(17, standings.length - 1)]?.driver.driver_number || 0,
                description: `${standings[Math.min(17, standings.length - 1)]?.driver.name_acronym || 'UNK'} - Contact with barrier, front wing damage`,
                severity: 'medium',
                timestamp: new Date(now.getTime() - 900000),
                resolved: true,
            });
        }

        // Sort by lap descending (most recent first)
        return incidents.sort((a, b) => b.lap - a.lap);
    }, [standings, currentLap]);
}

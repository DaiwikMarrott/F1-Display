import { useMemo } from 'react';
import type { DriverStanding } from '../types/f1';
import type { 
  TireAnalysis, 
  SectorData, 
  GapTrend, 
  StrategyRecommendation,
  DriverForm,
  TelemetryData,
  AnalyticsState
} from '../types/analytics';
import { clampPercent, positiveOrNull, safeTireAge } from '../utils/formatters';
import { deterministicRange, deterministicUnit } from '../utils/deterministic';

// Tire compound specifications
const TIRE_SPECS: Record<string, { maxLaps: number; color: string; grip: number }> = {
  'SOFT': { maxLaps: 25, color: '#E8002D', grip: 1.0 },
  'MEDIUM': { maxLaps: 35, color: '#FFFF00', grip: 0.95 },
  'HARD': { maxLaps: 45, color: '#FFFFFF', grip: 0.90 },
};

/**
 * Calculate tire analysis for a driver
 */
function calculateTireAnalysis(
  standing: DriverStanding,
  currentLap: number,
  totalLaps: number
): TireAnalysis | null {
  if (!standing.currentStint) return null;
  
  const compound = standing.currentStint.compound;
  const age = safeTireAge(standing.tireAge) ?? 0;
  const specs = TIRE_SPECS[compound] || TIRE_SPECS['MEDIUM'];
  const maxAge = specs.maxLaps;
  
  // Degradation: polynomial curve, ~0.1-0.3s per lap
  const degradationRate = 0.05 + (age / maxAge) * 0.25;
  const performanceLoss = clampPercent((age / maxAge) * 100) ?? 0;
  
  // Pit window: optimal when tire is at 60-75% life
  const optimalStart = Math.ceil(maxAge * 0.6);
  const optimalPitLap = currentLap + Math.max(1, optimalStart - age);
  
  // Condition percent for visual: 100% = new, 0% = end of life
  const conditionPercent = Math.max(0, 100 - performanceLoss);
  
  return {
    driver_number: standing.driver.driver_number,
    compound,
    age,
    maxAge,
    degradationRate,
    performanceLoss,
    optimalPitLap: Math.min(optimalPitLap, totalLaps),
    pitLossPredicted: deterministicRange(20, 23, standing.driver.driver_number, currentLap, 'pit-loss'),
    lapsSinceStart: age,
    conditionPercent,
  };
}

/**
 * Simulate sector analysis (based on lap time distribution)
 */
function calculateSectorData(
  standing: DriverStanding,
  leaderLapTime: number
): SectorData | null {
  // Sector distribution in typical lap: S1=33%, S2=40%, S3=27%
  const totalTime = positiveOrNull(standing.lastLap) ?? positiveOrNull(standing.bestLap);
  if (totalTime === null) return null;
  const sector1 = totalTime * 0.33;
  const sector2 = totalTime * 0.40;
  const sector3 = totalTime * 0.27;
  
  // Add realistic variation per sector
  const seed = [standing.driver.driver_number, totalTime];
  const s1 = sector1 * deterministicRange(0.98, 1.02, ...seed, 's1');
  const s2 = sector2 * deterministicRange(0.98, 1.02, ...seed, 's2');
  const s3 = sector3 * deterministicRange(0.98, 1.02, ...seed, 's3');
  
  // Best sectors are usually 5-8 tenths better
  const bestS1 = s1 * 0.94;
  const bestS2 = s2 * 0.94;
  const bestS3 = s3 * 0.94;
  
  // Delta to leader's sectors
  const leaderS1 = leaderLapTime * 0.33;
  const leaderS2 = leaderLapTime * 0.40;
  const leaderS3 = leaderLapTime * 0.27;
  
  const s1Delta = s1 - leaderS1;
  const s2Delta = s2 - leaderS2;
  const s3Delta = s3 - leaderS3;
  
  const getStatus = (delta: number): 'purple' | 'green' | 'yellow' | 'red' => {
    if (delta < -0.05) return 'purple'; // faster than leader
    if (delta < 0.05) return 'green';
    if (delta < 0.15) return 'yellow';
    return 'red';
  };
  
  return {
    driver_number: standing.driver.driver_number,
    sector1: s1 * 1000, // convert to ms
    sector2: s2 * 1000,
    sector3: s3 * 1000,
    totalLapTime: totalTime * 1000,
    sector1Delta: s1Delta,
    sector2Delta: s2Delta,
    sector3Delta: s3Delta,
    bestSector1: bestS1 * 1000,
    bestSector2: bestS2 * 1000,
    bestSector3: bestS3 * 1000,
    sector1Status: getStatus(s1Delta),
    sector2Status: getStatus(s2Delta),
    sector3Status: getStatus(s3Delta),
  };
}

/**
 * Calculate gap trends and overtake probability
 */
function calculateGapTrend(
  standing: DriverStanding
): GapTrend | null {
  const parsedGap = standing.gapToLeader === 'LEADER'
    ? 0
    : Number.parseFloat(standing.gapToLeader.replace('+', ''));
  if (!Number.isFinite(parsedGap) || parsedGap < 0) return null;
  const gapSeconds = parsedGap;
  
  // Simulate gap closing rate based on position and tire performance
  // Lower positions close gap faster; newer tires close gap faster
  const positionFactor = 1 - (standing.position / 20);
  const tireFactor = standing.tireAge > 15 ? -0.02 : 0.01; // old tires lose gap
  const gapTrendValue = (-0.1 * positionFactor + tireFactor)
    * deterministicUnit(standing.driver.driver_number, standing.position, standing.tireAge, 'gap');
  
  // DRS detection: within 1.0 second
  const drsWindow = gapSeconds > 0 && gapSeconds <= 1.0;
  
  // Overtake probability calculation
  let overtakeProbability = 0;
  let lapsUntilOvertake = -1;
  
  if (gapSeconds > 0 && gapSeconds < 2.0 && standing.position < 5) {
    // Realistic overtake window
    overtakeProbability = Math.max(0, Math.min(100, (1.0 - gapSeconds) * 100));
    
    if (overtakeProbability > 20) {
      // Estimate laps to overtake based on gap closing rate
      const closingRate = Math.abs(gapTrendValue) * 0.5 + 0.05;
      lapsUntilOvertake = Math.ceil(gapSeconds / (closingRate + 0.01));
    }
  }
  
  // Position trend
  let positionTrend: 'gaining' | 'stable' | 'losing' = 'stable';
  if (gapTrendValue < -0.02) positionTrend = 'gaining';
  else if (gapTrendValue > 0.02) positionTrend = 'losing';
  
  return {
    driver_number: standing.driver.driver_number,
    gapToLeader: gapSeconds,
    gapTrend: gapTrendValue,
    position: standing.position,
    positionTrend,
    drsWindow,
    overtakeProbability: Math.round(overtakeProbability),
    lapsUntilOvertake,
  };
}

/**
 * Generate strategy recommendations
 */
function calculateStrategyRecommendation(
  standing: DriverStanding,
  currentLap: number,
  totalLaps: number,
  tireAnalysis: TireAnalysis
): StrategyRecommendation {
  const lapsRemaining = Math.max(0, totalLaps - currentLap);
  const tireLapsRemaining = tireAnalysis.maxAge - tireAnalysis.age;
  const fuelBurnPerLap = Number((1.55 + (standing.position <= 5 ? 0.08 : 0.14) + (standing.tireAge > 15 ? 0.04 : 0)).toFixed(2));
  const estimatedFuelRemaining = Number(Math.max(0, lapsRemaining * fuelBurnPerLap).toFixed(1));
  const fuelSavingPotential = Number(Math.max(0, (standing.position <= 3 ? 0.08 : 0.05) * lapsRemaining).toFixed(1));
  
  // Determine current strategy
  let currentStrategy: 'aggressive' | 'conservative' | 'neutral' = 'neutral';
  if (standing.position <= 3 && standing.tireAge < 10) currentStrategy = 'aggressive';
  else if (standing.position > 15 && standing.tireAge < 5) currentStrategy = 'conservative';
  
  // Recommend action
  let recommendedAction: 'pit-now' | 'stay-out' | 'monitor' | 'push' = 'monitor';
  if (tireLapsRemaining < 5 && lapsRemaining > 10) recommendedAction = 'pit-now';
  else if (standing.position <= 3 && tireAnalysis.age > 10) recommendedAction = 'stay-out';
  else if (standing.position > 10 && tireAnalysis.age > 12) recommendedAction = 'push';
  
  // Optimal next stop
  const optimalLap = tireAnalysis.optimalPitLap;
  const nextCompound: 'HARD' | 'MEDIUM' = tireAnalysis.age > 15 ? 'HARD' : 'MEDIUM';
  const gainSeconds = Math.max(0, tireAnalysis.performanceLoss * 0.5);
  
  // Predict finish position
  const predictedFinish = Math.max(
    1,
    standing.position + Math.round(deterministicRange(-1.5, 1.5, standing.driver.driver_number, currentLap, 'finish')),
  );

  const pitNowScenario = {
    label: 'Pit now',
    action: 'pit-now' as const,
    compound: tireAnalysis.age > 15 ? 'HARD' as const : 'MEDIUM' as const,
    pitLap: currentLap,
    projectedFinishPosition: Math.max(
      1,
      standing.position + (standing.position <= 3 ? 0 : 1)
        - Math.round(deterministicUnit(standing.driver.driver_number, currentLap, 'pit-now-position')),
    ),
    projectedTimeGain: Number((tireAnalysis.performanceLoss * 0.45 + fuelSavingPotential * 0.2).toFixed(1)),
    confidence: Math.round(deterministicRange(74, 90, standing.driver.driver_number, currentLap, 'pit-now-confidence')),
  };

  const currentDryCompound = tireAnalysis.compound === 'INTERMEDIATE' || tireAnalysis.compound === 'WET'
    ? 'MEDIUM' as const
    : tireAnalysis.compound;

  const stayOutScenario = {
    label: 'Stay out',
    action: 'stay-out' as const,
    compound: currentDryCompound,
    pitLap: Math.min(totalLaps, currentLap + Math.max(1, Math.ceil(tireLapsRemaining / 2))),
    projectedFinishPosition: Math.max(
      1,
      standing.position + Math.round(
        (standing.tireAge > 18 ? 2 : 1)
        + deterministicRange(0, 2, standing.driver.driver_number, currentLap, 'stay-position'),
      ),
    ),
    projectedTimeGain: Number(Math.max(0, tireAnalysis.performanceLoss * 0.15).toFixed(1)),
    confidence: Math.round(deterministicRange(68, 86, standing.driver.driver_number, currentLap, 'stay-confidence')),
  };

  const pushScenario = {
    label: 'Push',
    action: 'push' as const,
    compound: currentDryCompound,
    pitLap: Math.min(totalLaps, currentLap + 1),
    projectedFinishPosition: Math.max(
      1,
      standing.position - Math.round(deterministicRange(0, 2, standing.driver.driver_number, currentLap, 'push-position')),
    ),
    projectedTimeGain: Number((Math.max(0, tireAnalysis.performanceLoss * 0.25) + fuelSavingPotential * 0.1).toFixed(1)),
    confidence: Math.round(deterministicRange(60, 80, standing.driver.driver_number, currentLap, 'push-confidence')),
  };
  
  // Risk assessment
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (lapsRemaining < 5 || tireAnalysis.age > 20) riskLevel = 'high';
  else if (lapsRemaining < 15 || tireAnalysis.age > 15) riskLevel = 'medium';
  
  return {
    driver_number: standing.driver.driver_number,
    currentStrategy,
    recommendedAction,
    fuelBurnPerLap,
    estimatedFuelRemaining,
    fuelSavingPotential,
    optimalNextStop: {
      lapNumber: optimalLap,
      compound: nextCompound,
      gainSeconds,
    },
    whatIfScenarios: [pitNowScenario, stayOutScenario, pushScenario],
    predictedFinishPosition: predictedFinish,
    riskLevel,
    confidence: deterministicRange(70, 95, standing.driver.driver_number, currentLap, 'strategy-confidence'),
  };
}

/**
 * Calculate driver form and momentum
 */
function calculateDriverForm(
  standing: DriverStanding
): DriverForm | null {
  // Simulate last 5 lap times with degradation trend
  const last5Laps: number[] = [];
  const baseLap = positiveOrNull(standing.bestLap) ?? positiveOrNull(standing.lastLap);
  if (baseLap === null) return null;
  for (let i = -4; i <= 0; i++) {
    const degradation = Math.abs(i) * 0.15
      * deterministicUnit(standing.driver.driver_number, standing.tireAge, i, 'form');
    last5Laps.push(baseLap + degradation);
  }
  
  const averageLast5 = last5Laps.reduce((a, b) => a + b) / 5;
  
  // Trend analysis
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  const first2Avg = (last5Laps[0] + last5Laps[1]) / 2;
  const last2Avg = (last5Laps[3] + last5Laps[4]) / 2;
  if (last2Avg < first2Avg - 0.1) trend = 'improving';
  else if (last2Avg > first2Avg + 0.1) trend = 'declining';
  
  // Consistency: variance between laps (lower = more consistent)
  const variance = Math.sqrt(last5Laps.reduce((sq, lap) => sq + Math.pow(lap - averageLast5, 2), 0) / 5);
  const consistency = Math.max(0, 100 - variance * 100);
  
  // Momentum score
  const momentumScore = (first2Avg - last2Avg) * 50; // -100 to 100
  
  // Peak performance window
  let peakPerformanceWindow: 'early' | 'mid' | 'late' = 'mid';
  if (trend === 'declining') peakPerformanceWindow = 'early';
  else if (trend === 'improving') peakPerformanceWindow = 'late';
  
  return {
    driver_number: standing.driver.driver_number,
    last5Laps,
    averageLast5,
    trend,
    consistency: Math.round(consistency),
    peakPerformanceWindow,
    momentumScore: Math.round(momentumScore),
  };
}

/**
 * Calculate telemetry data
 */
function calculateTelemetryData(
  standing: DriverStanding
): TelemetryData {
  // Simulate realistic telemetry
  const baseSpeed = 300 + standing.position * 2; // faster drivers slightly faster
  const topSpeed = baseSpeed + deterministicRange(-10, 10, standing.driver.driver_number, 'top-speed');
  const avgSpeed = topSpeed * 0.92;
  
  return {
    driver_number: standing.driver.driver_number,
    topSpeed: Math.round(topSpeed),
    avgSpeed: Math.round(avgSpeed),
    brakingZones: [], // Would need detailed track data
    acceleration: deterministicRange(75, 100, standing.driver.driver_number, 'acceleration'),
    cornerSpeed: avgSpeed * 0.75,
    gForce: deterministicRange(3.5, 5, standing.driver.driver_number, 'g-force'),
    maxGForce: deterministicRange(4.5, 6, standing.driver.driver_number, 'max-g-force'),
  };
}

/**
 * Main analytics hook - calculates all analytics data
 */
export function calculateAnalytics(
  standings: DriverStanding[],
  currentLap: number,
  totalLaps: number
): AnalyticsState {
  const tireAnalysis = new Map<number, TireAnalysis>();
  const sectors = new Map<number, SectorData>();
  const gapTrends = new Map<number, GapTrend>();
  const strategies = new Map<number, StrategyRecommendation>();
  const formData = new Map<number, DriverForm>();
  const telemetry = new Map<number, TelemetryData>();
    
  const leaderLapTime = positiveOrNull(standings[0]?.bestLap) ?? 0;
    
  standings.forEach(standing => {
    const driverNum = standing.driver.driver_number;

    const tire = calculateTireAnalysis(standing, currentLap, totalLaps);
    if (tire) {
      tireAnalysis.set(driverNum, tire);
    }

    const sector = calculateSectorData(standing, leaderLapTime);
    if (sector) sectors.set(driverNum, sector);

    const gap = calculateGapTrend(standing);
    if (gap) gapTrends.set(driverNum, gap);

    if (tire && currentLap > 0 && totalLaps > currentLap) {
      strategies.set(driverNum, calculateStrategyRecommendation(standing, currentLap, totalLaps, tire));
    }

    const form = calculateDriverForm(standing);
    if (form) formData.set(driverNum, form);

    telemetry.set(driverNum, calculateTelemetryData(standing));
  });
    
  return {
    tireAnalysis,
    sectors,
    gapTrends,
    strategies,
    formData,
    telemetry,
    incidents: [],
    lastUpdateLap: currentLap,
  };
}

export function useAnalytics(
  standings: DriverStanding[],
  currentLap: number,
  totalLaps: number
): AnalyticsState {
  return useMemo(
    () => calculateAnalytics(standings, currentLap, totalLaps),
    [standings, currentLap, totalLaps],
  );
}

export default useAnalytics;

import { useMemo } from 'react';
import type { DriverStanding, Lap } from '../types/f1';
import type { 
  TireAnalysis, 
  SectorData, 
  GapTrend, 
  StrategyRecommendation,
  DriverForm,
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
  laps: Lap[],
  sessionBest: [number, number, number],
): SectorData | null {
  const valid = laps
    .filter(lap =>
      positiveOrNull(lap.duration_sector_1) !== null
      && positiveOrNull(lap.duration_sector_2) !== null
      && positiveOrNull(lap.duration_sector_3) !== null)
    .sort((a, b) => a.lap_number - b.lap_number);
  const latest = valid[valid.length - 1];
  if (
    !latest
    || latest.duration_sector_1 === null
    || latest.duration_sector_2 === null
    || latest.duration_sector_3 === null
  ) return null;
  const s1 = latest.duration_sector_1;
  const s2 = latest.duration_sector_2;
  const s3 = latest.duration_sector_3;
  const totalTime = s1 + s2 + s3;
  const bestS1 = Math.min(...valid.map(lap => lap.duration_sector_1!));
  const bestS2 = Math.min(...valid.map(lap => lap.duration_sector_2!));
  const bestS3 = Math.min(...valid.map(lap => lap.duration_sector_3!));
  const [leaderS1, leaderS2, leaderS3] = sessionBest;
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
  standing: DriverStanding,
  laps: Lap[],
): DriverForm | null {
  const last5Laps = laps
    .filter(lap => positiveOrNull(lap.lap_duration) !== null && !lap.is_pit_out_lap)
    .sort((a, b) => a.lap_number - b.lap_number)
    .slice(-5)
    .map(lap => lap.lap_duration!);
  if (last5Laps.length < 2) return null;
  
  const averageLast5 = last5Laps.reduce((a, b) => a + b) / last5Laps.length;
  
  // Trend analysis
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  const first2Avg = (last5Laps[0] + last5Laps[Math.min(1, last5Laps.length - 1)]) / 2;
  const last2Avg = (last5Laps[Math.max(0, last5Laps.length - 2)] + last5Laps[last5Laps.length - 1]) / 2;
  if (last2Avg < first2Avg - 0.1) trend = 'improving';
  else if (last2Avg > first2Avg + 0.1) trend = 'declining';
  
  // Consistency: variance between laps (lower = more consistent)
  const variance = Math.sqrt(
    last5Laps.reduce((sq, lap) => sq + Math.pow(lap - averageLast5, 2), 0)
    / last5Laps.length,
  );
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
 * Main analytics hook - calculates all analytics data
 */
export function calculateAnalytics(
  standings: DriverStanding[],
  currentLap: number,
  totalLaps: number,
  laps: Lap[] = [],
): AnalyticsState {
  const tireAnalysis = new Map<number, TireAnalysis>();
  const sectors = new Map<number, SectorData>();
  const gapTrends = new Map<number, GapTrend>();
  const strategies = new Map<number, StrategyRecommendation>();
  const formData = new Map<number, DriverForm>();
  const telemetry: AnalyticsState['telemetry'] = new Map();
  const lapsByDriver = new Map<number, Lap[]>();
  for (const lap of laps) {
    const rows = lapsByDriver.get(lap.driver_number) ?? [];
    rows.push(lap);
    lapsByDriver.set(lap.driver_number, rows);
  }
  const validSectors = laps.filter(lap =>
    positiveOrNull(lap.duration_sector_1) !== null
    && positiveOrNull(lap.duration_sector_2) !== null
    && positiveOrNull(lap.duration_sector_3) !== null);
  const sessionBest: [number, number, number] = validSectors.length > 0
    ? [
      Math.min(...validSectors.map(lap => lap.duration_sector_1!)),
      Math.min(...validSectors.map(lap => lap.duration_sector_2!)),
      Math.min(...validSectors.map(lap => lap.duration_sector_3!)),
    ]
    : [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
    
  standings.forEach(standing => {
    const driverNum = standing.driver.driver_number;

    const tire = calculateTireAnalysis(standing, currentLap, totalLaps);
    if (tire) {
      tireAnalysis.set(driverNum, tire);
    }

    const driverLaps = lapsByDriver.get(driverNum) ?? [];
    const sector = calculateSectorData(standing, driverLaps, sessionBest);
    if (sector) sectors.set(driverNum, sector);

    const gap = calculateGapTrend(standing);
    if (gap) gapTrends.set(driverNum, gap);

    if (tire && currentLap > 0 && totalLaps > currentLap) {
      strategies.set(driverNum, calculateStrategyRecommendation(standing, currentLap, totalLaps, tire));
    }

    const form = calculateDriverForm(standing, driverLaps);
    if (form) formData.set(driverNum, form);
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
  totalLaps: number,
  laps: Lap[] = [],
): AnalyticsState {
  return useMemo(
    () => calculateAnalytics(standings, currentLap, totalLaps, laps),
    [standings, currentLap, totalLaps, laps],
  );
}

export default useAnalytics;

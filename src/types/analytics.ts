/**
 * Analytics types for pit wall data analyst features
 */

export interface TireAnalysis {
  driver_number: number;
  compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
  age: number;
  maxAge: number; // Expected lifespan for this compound
  degradationRate: number; // seconds per lap
  performanceLoss: number; // percentage from new
  optimalPitLap: number; // recommended lap to pit
  pitLossPredicted: number; // estimated pit stop time
  lapsSinceStart: number;
  conditionPercent: number; // 0-100, visual indicator
}

export interface SectorData {
  driver_number: number;
  sector1: number; // milliseconds
  sector2: number;
  sector3: number;
  totalLapTime: number;
  sector1Delta: number; // vs leader
  sector2Delta: number;
  sector3Delta: number;
  bestSector1: number;
  bestSector2: number;
  bestSector3: number;
  sector1Status: 'purple' | 'green' | 'yellow' | 'red'; // vs leader
  sector2Status: 'purple' | 'green' | 'yellow' | 'red';
  sector3Status: 'purple' | 'green' | 'yellow' | 'red';
}

export interface GapTrend {
  driver_number: number;
  gapToLeader: number; // seconds
  gapTrend: number; // closing rate (seconds/lap), negative = closing
  position: number;
  positionTrend: 'gaining' | 'stable' | 'losing';
  drsWindow: boolean; // within 1.0s of car ahead
  overtakeProbability: number; // 0-100 percent
  lapsUntilOvertake: number; // estimated, -1 if no overtake likely
}

export interface StrategyRecommendation {
  driver_number: number;
  currentStrategy: 'aggressive' | 'conservative' | 'neutral';
  recommendedAction: 'pit-now' | 'stay-out' | 'monitor' | 'push';
  optimalNextStop: {
    lapNumber: number;
    compound: 'SOFT' | 'MEDIUM' | 'HARD';
    gainSeconds: number; // estimated improvement vs staying out
  };
  predictedFinishPosition: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
}

export interface DriverForm {
  driver_number: number;
  last5Laps: number[];
  averageLast5: number;
  trend: 'improving' | 'stable' | 'declining';
  consistency: number; // 0-100, higher = more consistent
  peakPerformanceWindow: string; // 'early', 'mid', 'late'
  momentumScore: number; // -100 to 100, positive = improving
}

export interface TelemetryData {
  driver_number: number;
  topSpeed: number; // km/h
  avgSpeed: number;
  brakingZones: number[]; // coordinate indices
  acceleration: number; // 0-100
  cornerSpeed: number; // average through high-speed corners
  gForce: number; // average
  maxGForce: number;
}

export interface Incident {
  id: string;
  lap: number;
  type: 'crash' | 'spin' | 'off-track' | 'pit-issue' | 'dnf' | 'safety-car' | 'vsc';
  affectedDriver: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  resolved: boolean;
}

export interface AnalyticsState {
  tireAnalysis: Map<number, TireAnalysis>;
  sectors: Map<number, SectorData>;
  gapTrends: Map<number, GapTrend>;
  strategies: Map<number, StrategyRecommendation>;
  formData: Map<number, DriverForm>;
  telemetry: Map<number, TelemetryData>;
  incidents: Incident[];
  lastUpdateLap: number;
}

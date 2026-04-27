export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
  session_key: number;
  country_code?: string;
}

export interface Position {
  driver_number: number;
  position: number;
  date: string;
  session_key: number;
  meeting_key: number;
}

export interface Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  st_speed: number | null;
  date_start: string;
  is_pit_out_lap: boolean;
  session_key: number;
  meeting_key: number;
}

export interface Stint {
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number | null;
  compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
  tyre_age_at_start: number;
  session_key: number;
  meeting_key: number;
}

export interface PitStop {
  driver_number: number;
  lap_number: number;
  pit_duration: number | null;
  date: string;
  session_key: number;
  meeting_key: number;
}

export interface Location {
  driver_number: number;
  x: number;
  y: number;
  z: number;
  date: string;
  session_key: number;
  meeting_key: number;
}

export interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
  status: string;
  date_start: string;
  date_end: string;
  circuit_short_name: string;
  country_name: string;
  year: number;
  meeting_key: number;
}

export interface CarData {
  driver_number: number;
  speed: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  drs: number;
  date: string;
  session_key: number;
  meeting_key: number;
}

export interface RaceControl {
  date: string;
  driver_number: number | null;
  lap_number: number | null;
  category: string;
  flag: string | null;
  scope: string | null;
  message: string;
  session_key: number;
  meeting_key: number;
}

export interface DriverStanding {
  driver: Driver;
  position: number;
  gapToLeader: string;
  lastLap: number | null;
  bestLap: number | null;
  isFastestLap: boolean;
  currentStint: Stint | null;
  tireAge: number;
  pitCount: number;
  location: Location | null;
  winProbability: number;
}

export interface PitNotification {
  id: string;
  driverNumber: number;
  driverName: string;
  position: number;
  lapNumber: number;
  timestamp: number;
}

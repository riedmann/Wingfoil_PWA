export interface GpsPoint {
  lat: number;
  lng: number;
  altitude?: number;
  timestamp: number; // unix ms
  heartRate?: number;
  speed?: number; // m/s
}

export type ActivityType =
  | "running"
  | "cycling"
  | "walking"
  | "hiking"
  | "swimming"
  | "wingfoiling"
  | "other";

export interface Track {
  id: string;
  name: string;
  activityType: ActivityType;
  startTime: number; // unix ms
  endTime: number; // unix ms
  durationSeconds: number;
  distanceMeters: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgSpeed?: number; // m/s
  maxSpeed?: number;
  elevationGain?: number; // meters
  calories?: number;
  points: GpsPoint[];
}

export type BluetoothStatus =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "downloading"
  | "error";

export interface BluetoothState {
  status: BluetoothStatus;
  deviceName?: string;
  errorMessage?: string;
  downloadProgress?: number; // 0-100
}

export type SortField =
  | "startTime"
  | "durationSeconds"
  | "distanceMeters"
  | "name"
  | "avgHeartRate";
export type SortDirection = "asc" | "desc";

/**
 * A detected jibe segment. Indices reference the `points` array of the parent Track.
 * A jibe is a ~180° direction reversal; `good` means speed never dropped below
 * MIN_JIBE_SPEED_KMH (10 km/h) during the manoeuvre.
 */
export interface Jibe {
  startIndex: number;
  endIndex: number;
  /** Index of the point with maximum cumulative turn (peak of the manoeuvre). */
  peakIndex: number;
  /** True when min speed during the jibe was ≥ 10 km/h */
  good: boolean;
  /** Lowest speed recorded during the jibe in km/h */
  minSpeedKmh: number;
  /** Total heading change in degrees (~130–220) */
  totalTurnDeg: number;
  durationSeconds: number;
}

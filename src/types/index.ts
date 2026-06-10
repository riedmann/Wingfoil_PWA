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

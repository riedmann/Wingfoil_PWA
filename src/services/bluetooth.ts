import type { Track, ActivityType, GpsPoint } from "../types";

// Xiaomi Mi Watch S4 BLE service & characteristic UUIDs
// The watch uses a proprietary Amazfit/Huami protocol over BLE.
// The service below is the standard Huami fitness service UUID pattern.
const HUAMI_SERVICE_UUID = "0000fee0-0000-1000-8000-00805f9b34fb";
const HUAMI_CHAR_CMD = "00000001-0000-1000-8000-00805f9b34fb";
const HUAMI_CHAR_DATA = "00000002-0000-1000-8000-00805f9b34fb";

export type DownloadProgressCallback = (progress: number) => void;
export type StatusCallback = (msg: string) => void;

export class XiaomiBluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  get connected() {
    return this.server?.connected ?? false;
  }

  get deviceName() {
    return this.device?.name ?? undefined;
  }

  async connect(onStatus?: StatusCallback): Promise<void> {
    onStatus?.("Scanning for Xiaomi Mi Watch S4...");

    this.device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: "Xiaomi Watch S4" },
        { namePrefix: "Mi Watch S4" },
        { namePrefix: "Watch S4" },
      ],
      optionalServices: [HUAMI_SERVICE_UUID],
    });

    onStatus?.(`Found ${this.device.name}. Connecting...`);

    this.device.addEventListener("gattserverdisconnected", () => {
      this.server = null;
    });

    this.server = await this.device.gatt!.connect();

    try {
      const service = await this.server.getPrimaryService(HUAMI_SERVICE_UUID);
      await service.getCharacteristic(HUAMI_CHAR_CMD);
      await service.getCharacteristic(HUAMI_CHAR_DATA);
    } catch {
      // Service/characteristic not found – watch may need pairing first
      // Continue anyway; downloadTracks will fall back to mock data
    }

    onStatus?.(`Connected to ${this.device.name}`);
  }

  async disconnect(): Promise<void> {
    if (this.server?.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
  }

  /**
   * Download fitness tracks from the watch.
   * The Amazfit/Huami protocol is proprietary and not publicly documented.
   * A real implementation would need to send auth + fetch commands via cmdChar
   * and read chunked binary responses from dataChar.
   *
   * This implementation returns realistic mock tracks to demonstrate the full UI.
   * Replace the body of this method with the actual protocol when available.
   */
  async downloadTracks(
    onProgress?: DownloadProgressCallback,
    onStatus?: StatusCallback,
  ): Promise<Track[]> {
    onStatus?.("Requesting activity list from watch...");
    onProgress?.(0);

    // Simulate protocol round-trips
    await delay(800);
    onProgress?.(15);
    onStatus?.("Authenticating...");

    await delay(600);
    onProgress?.(30);
    onStatus?.("Fetching track headers...");

    await delay(700);
    onProgress?.(50);
    onStatus?.("Downloading GPS data...");

    await delay(900);
    onProgress?.(75);
    onStatus?.("Downloading heart rate data...");

    await delay(600);
    onProgress?.(90);
    onStatus?.("Parsing data...");

    await delay(400);
    onProgress?.(100);

    return generateMockTracks();
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

/** Exported so the store can seed demo data on every page load. */
export function generateDemoTracks(): Track[] {
  return generateMockTracks();
}

function generateMockTracks(): Track[] {
  const now = Date.now();
  return [
    generateWingfoilTrack(now),
    makeMockTrack(
      "Morning Run",
      "running",
      now - 1 * 86_400_000,
      35 * 60,
      6_200,
      148,
      178,
      150,
    ),
    makeMockTrack(
      "Evening Cycle",
      "cycling",
      now - 2 * 86_400_000,
      55 * 60,
      18_500,
      135,
      162,
      200,
    ),
    makeMockTrack(
      "Lunch Walk",
      "walking",
      now - 3 * 86_400_000,
      28 * 60,
      2_800,
      102,
      125,
      90,
    ),
    makeMockTrack(
      "Trail Hike",
      "hiking",
      now - 5 * 86_400_000,
      120 * 60,
      12_000,
      130,
      165,
      480,
    ),
    makeMockTrack(
      "Park Run",
      "running",
      now - 7 * 86_400_000,
      30 * 60,
      5_000,
      155,
      185,
      140,
    ),
    makeMockTrack(
      "Road Ride",
      "cycling",
      now - 9 * 86_400_000,
      80 * 60,
      28_000,
      140,
      170,
      320,
    ),
    makeMockTrack(
      "Easy Jog",
      "running",
      now - 10 * 86_400_000,
      25 * 60,
      3_800,
      138,
      160,
      110,
    ),
    makeMockTrack(
      "City Walk",
      "walking",
      now - 12 * 86_400_000,
      45 * 60,
      4_200,
      98,
      118,
      130,
    ),
  ];
}

/**
 * Generate a realistic wingfoil mock session on Lake Starnberg.
 * The track tacks back and forth (E↔W beam reach) with 5 jibes:
 * jibes 1, 3, 4 are GOOD (min speed ≥ 10 km/h), jibes 2, 5 are SLOW.
 */
function generateWingfoilTrack(now: number): Track {
  // Lake Starnberg, Bavaria — popular wingfoil spot
  const baseLat = 47.91;
  const baseLng = 11.32;
  const startTime = now - 4 * 86_400_000;

  const LAT_PER_M = 1 / 111_320;
  const LNG_PER_M = 1 / (111_320 * Math.cos(baseLat * (Math.PI / 180)));

  type Leg = {
    kind: "leg";
    durationS: number;
    headingDeg: number;
    speedMps: number;
  };
  type Jibe = {
    kind: "jibe";
    durationS: number;
    fromHeadingDeg: number;
    good: boolean;
  };

  const segments: (Leg | Jibe)[] = [
    { kind: "leg", durationS: 75, headingDeg: 90, speedMps: 6.2 },
    { kind: "jibe", durationS: 8, fromHeadingDeg: 90, good: true }, // J1 good
    { kind: "leg", durationS: 75, headingDeg: 270, speedMps: 5.8 },
    { kind: "jibe", durationS: 9, fromHeadingDeg: 270, good: false }, // J2 slow
    { kind: "leg", durationS: 75, headingDeg: 90, speedMps: 6.5 },
    { kind: "jibe", durationS: 7, fromHeadingDeg: 90, good: true }, // J3 good
    { kind: "leg", durationS: 75, headingDeg: 270, speedMps: 6.0 },
    { kind: "jibe", durationS: 8, fromHeadingDeg: 270, good: true }, // J4 good
    { kind: "leg", durationS: 75, headingDeg: 90, speedMps: 6.3 },
    { kind: "jibe", durationS: 10, fromHeadingDeg: 90, good: false }, // J5 slow
    { kind: "leg", durationS: 75, headingDeg: 270, speedMps: 5.9 },
  ];

  const FAST_MPS = 5.5;
  const GOOD_MIN = 3.2; // ~11.5 km/h — above threshold
  const BAD_MIN = 1.6; // ~5.8 km/h  — below threshold

  const points: GpsPoint[] = [];
  let t = startTime;
  let lat = baseLat;
  let lng = baseLng;

  for (const seg of segments) {
    if (seg.kind === "leg") {
      const headingRad = (seg.headingDeg * Math.PI) / 180;
      for (let s = 0; s < seg.durationS; s++) {
        const speed = seg.speedMps * (0.92 + Math.random() * 0.16);
        lat += Math.cos(headingRad) * speed * LAT_PER_M;
        lng += Math.sin(headingRad) * speed * LNG_PER_M;
        points.push({
          lat,
          lng,
          altitude: 585,
          timestamp: t,
          speed,
          heartRate: 140 + Math.floor(Math.random() * 30),
        });
        t += 1_000;
      }
    } else {
      // Jibe: heading sweeps clockwise from fromHeadingDeg to fromHeadingDeg+180°
      const minSpeed = seg.good ? GOOD_MIN : BAD_MIN;
      for (let s = 0; s < seg.durationS; s++) {
        const progress = seg.durationS > 1 ? s / (seg.durationS - 1) : 0;
        // Clockwise sweep: (from + progress*180) % 360
        const headingDeg = (seg.fromHeadingDeg + progress * 180) % 360;
        const headingRad = (headingDeg * Math.PI) / 180;
        // Speed dips in the middle (sin bell curve)
        const dip = Math.sin(progress * Math.PI);
        const speed = Math.max(
          0.1,
          FAST_MPS - dip * (FAST_MPS - minSpeed) + (Math.random() - 0.5) * 0.2,
        );
        lat += Math.cos(headingRad) * speed * LAT_PER_M;
        lng += Math.sin(headingRad) * speed * LNG_PER_M;
        points.push({
          lat,
          lng,
          altitude: 585,
          timestamp: t,
          speed,
          heartRate: 150 + Math.floor(Math.random() * 25),
        });
        t += 1_000;
      }
    }
  }

  const durationSeconds = Math.round((t - startTime) / 1_000);
  let distanceMeters = 0;
  for (let i = 1; i < points.length; i++) {
    const dlat = (points[i].lat - points[i - 1].lat) * 111_320;
    const dlng =
      (points[i].lng - points[i - 1].lng) *
      111_320 *
      Math.cos(baseLat * (Math.PI / 180));
    distanceMeters += Math.sqrt(dlat * dlat + dlng * dlng);
  }

  return {
    id: `track-wingfoil-${startTime}`,
    name: "Lake Starnberg Session",
    activityType: "wingfoiling",
    startTime,
    endTime: t,
    durationSeconds,
    distanceMeters,
    avgSpeed: 5.5,
    maxSpeed: 7.8,
    calories: 480,
    points,
  };
}

function makeMockTrack(
  name: string,
  activityType: ActivityType,
  startTime: number,
  durationSeconds: number,
  distanceMeters: number,
  avgHeartRate: number,
  maxHeartRate: number,
  calories: number,
): Track {
  const points = generateGpsPoints(startTime, durationSeconds, distanceMeters);
  const avgSpeed = distanceMeters / durationSeconds;

  return {
    id: `track-${startTime}`,
    name,
    activityType,
    startTime,
    endTime: startTime + durationSeconds * 1000,
    durationSeconds,
    distanceMeters,
    avgHeartRate,
    maxHeartRate,
    avgSpeed,
    maxSpeed: avgSpeed * 1.4,
    elevationGain:
      activityType === "hiking" ? 320 : activityType === "running" ? 45 : 20,
    calories,
    points,
  };
}

function generateGpsPoints(
  startTime: number,
  durationSeconds: number,
  distanceMeters: number,
): GpsPoint[] {
  // Munich area as base
  const baseLat = 48.1351 + (Math.random() - 0.5) * 0.04;
  const baseLng = 11.582 + (Math.random() - 0.5) * 0.04;
  const points: GpsPoint[] = [];
  const count = Math.min(200, Math.max(40, Math.floor(durationSeconds / 10)));
  const intervalMs = (durationSeconds * 1000) / count;
  const metersPerPoint = distanceMeters / count;
  // approx degrees per meter
  const degPerMeter = 1 / 111_320;

  let lat = baseLat;
  let lng = baseLng;
  let angle = Math.random() * 2 * Math.PI;

  for (let i = 0; i < count; i++) {
    // Slightly curve the path
    angle += (Math.random() - 0.5) * 0.4;
    lat += Math.cos(angle) * metersPerPoint * degPerMeter;
    lng +=
      Math.sin(angle) *
      metersPerPoint *
      degPerMeter *
      (1 / Math.cos(baseLat * (Math.PI / 180)));

    points.push({
      lat,
      lng,
      altitude: 520 + Math.sin(i / 10) * 30 + Math.random() * 5,
      timestamp: startTime + i * intervalMs,
      heartRate: 100 + Math.floor(Math.random() * 80),
      speed: (distanceMeters / durationSeconds) * (0.8 + Math.random() * 0.4),
    });
  }

  return points;
}

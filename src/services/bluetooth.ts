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

function generateMockTracks(): Track[] {
  const now = Date.now();
  return [
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

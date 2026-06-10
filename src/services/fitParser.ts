import FitParser from "fit-file-parser";
import type { Track, GpsPoint, ActivityType } from "../types";

const SPORT_MAP: Record<string, ActivityType> = {
  running: "running",
  cycling: "cycling",
  walking: "walking",
  hiking: "hiking",
  swimming: "swimming",
};

/** Parse a .fit file (ArrayBuffer content) into a Track */
export async function parseFit(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<Track | null> {
  const parser = new FitParser({
    force: true,
    speedUnit: "m/s",
    lengthUnit: "m",
  });

  const data = await parser.parseAsync(buffer);

  const records = data.records ?? [];
  const session = data.sessions?.[0];

  // Build GPS points from records
  const points: GpsPoint[] = records
    .filter((r) => r.position_lat != null && r.position_long != null)
    .map((r) => ({
      // FIT stores semicircles, convert to degrees
      lat: semicirclesToDeg(r.position_lat!),
      lng: semicirclesToDeg(r.position_long!),
      altitude: r.altitude,
      timestamp: r.timestamp ? r.timestamp.getTime() : 0,
      heartRate: r.heart_rate,
      speed: r.speed,
    }))
    .filter((p) => p.lat !== 0 && p.lng !== 0);

  if (points.length === 0) return null;

  const startTime = session?.start_time?.getTime() ?? points[0].timestamp;
  const durationSeconds =
    session?.total_elapsed_time ??
    Math.round((points[points.length - 1].timestamp - startTime) / 1000);
  const distanceMeters = session?.total_distance ?? 0;
  const avgHeartRate = session?.avg_heart_rate;
  const maxHeartRate = session?.max_heart_rate;
  const avgSpeed =
    session?.avg_speed ?? distanceMeters / (durationSeconds || 1);
  const maxSpeed = session?.max_speed ?? avgSpeed * 1.5;
  const elevationGain = session?.total_ascent;
  const calories = session?.total_calories;

  const sport = session?.sport ?? "";
  const activityType: ActivityType = SPORT_MAP[sport.toLowerCase()] ?? "other";

  const name = fileName.replace(/\.[^.]+$/, "");

  return {
    id: `import-${startTime}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    activityType,
    startTime,
    endTime: startTime + durationSeconds * 1000,
    durationSeconds,
    distanceMeters,
    avgHeartRate,
    maxHeartRate,
    avgSpeed,
    maxSpeed,
    elevationGain,
    calories,
    points,
  };
}

/** FIT semicircle unit → decimal degrees */
function semicirclesToDeg(sc: number): number {
  return sc * (180 / 2 ** 31);
}

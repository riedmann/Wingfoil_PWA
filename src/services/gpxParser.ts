import type { Track, GpsPoint, ActivityType } from "../types";

/** Parse a .gpx file (string content) into a Track */
export function parseGpx(content: string, fileName: string): Track | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "application/xml");

    if (doc.querySelector("parsererror")) {
      throw new Error("Invalid GPX XML");
    }

    // Collect track points from all trkseg > trkpt elements
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));

    if (trkpts.length === 0) {
      // Try route points as fallback
      const rtepts = Array.from(doc.querySelectorAll("rtept"));
      if (rtepts.length === 0) return null;
      trkpts.push(...rtepts);
    }

    const points: GpsPoint[] = trkpts.map((pt) => {
      const lat = parseFloat(pt.getAttribute("lat") ?? "0");
      const lng = parseFloat(pt.getAttribute("lon") ?? "0");
      const eleEl = pt.querySelector("ele");
      const timeEl = pt.querySelector("time");
      const hrEl = pt.querySelector(
        "extensions hr, extensions gpxtpx\\:hr, hr",
      );
      const cadEl = pt.querySelector("extensions cad");

      const altitude = eleEl ? parseFloat(eleEl.textContent ?? "0") : undefined;
      const timestamp = timeEl
        ? new Date(timeEl.textContent ?? "").getTime()
        : 0;
      const heartRate = hrEl
        ? parseInt(hrEl.textContent ?? "0", 10)
        : undefined;

      void cadEl; // not used currently

      return { lat, lng, altitude, timestamp, heartRate };
    });

    // Filter out points with invalid coordinates
    const validPoints = points.filter(
      (p) => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0,
    );
    if (validPoints.length === 0) return null;

    const startTime = validPoints[0].timestamp || Date.now();
    const endTime = validPoints[validPoints.length - 1].timestamp || startTime;

    // Calculate distance from consecutive coordinates (Haversine)
    let distanceMeters = 0;
    for (let i = 1; i < validPoints.length; i++) {
      distanceMeters += haversine(validPoints[i - 1], validPoints[i]);
    }

    // Elevation gain
    let elevationGain = 0;
    for (let i = 1; i < validPoints.length; i++) {
      const diff =
        (validPoints[i].altitude ?? 0) - (validPoints[i - 1].altitude ?? 0);
      if (diff > 0) elevationGain += diff;
    }

    // Heart rate stats
    const hrValues = validPoints
      .map((p) => p.heartRate)
      .filter((h): h is number => h !== undefined && h > 0);
    const avgHeartRate =
      hrValues.length > 0
        ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
        : undefined;
    const maxHeartRate =
      hrValues.length > 0 ? Math.max(...hrValues) : undefined;

    const durationSeconds = Math.round((endTime - startTime) / 1000);
    const avgSpeed = durationSeconds > 0 ? distanceMeters / durationSeconds : 0;

    // Infer activity type from gpx metadata or filename
    const activityType = inferActivityType(doc, fileName);

    // Track name: prefer <name> element, fall back to file name without extension
    const nameEl = doc.querySelector("trk > name, name");
    const name =
      nameEl?.textContent?.trim() || fileName.replace(/\.[^.]+$/, "");

    return {
      id: `import-${startTime}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      activityType,
      startTime,
      endTime,
      durationSeconds,
      distanceMeters,
      avgHeartRate,
      maxHeartRate,
      avgSpeed,
      maxSpeed: avgSpeed * 1.5,
      elevationGain,
      calories: undefined,
      points: validPoints,
    };
  } catch (e) {
    console.error("GPX parse error", e);
    return null;
  }
}

function inferActivityType(doc: Document, fileName: string): ActivityType {
  const type =
    doc.querySelector("trk > type, type")?.textContent?.toLowerCase() ?? "";
  const name = (
    doc.querySelector("trk > name, name")?.textContent ?? fileName
  ).toLowerCase();
  const combined = `${type} ${name}`;
  if (/cycling|biking|bike|ride/i.test(combined)) return "cycling";
  if (/walk/i.test(combined)) return "walking";
  if (/hik/i.test(combined)) return "hiking";
  if (/swim/i.test(combined)) return "swimming";
  if (/run|jog/i.test(combined)) return "running";
  return "other";
}

// Haversine distance in meters between two lat/lng points
function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

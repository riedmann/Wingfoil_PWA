import type { GpsPoint, Jibe } from "../types";

// ─── constants ────────────────────────────────────────────────────────────────
export const MIN_JIBE_SPEED_KMH = 10;

/** Minimum cumulative bearing change to count as a jibe (degrees) */
const MIN_TURN_DEG = 130;
/** Maximum allowed cumulative change before we consider it noise/spin-out */
const MAX_TURN_DEG = 230;
/** Maximum wall-clock duration of a single jibe */
const MAX_JIBE_DURATION_MS = 20_000;
/** Minimum entry speed — avoids detecting "jibes" while standing on shore */
const MIN_ENTRY_SPEED_MPS = 1.5; // 5.4 km/h

// ─── geometry helpers ─────────────────────────────────────────────────────────

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** True compass bearing (0-360°N clockwise) from a → b */
function gpsBearing(a: GpsPoint, b: GpsPoint): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

/** Signed angular difference a → b in (-180, 180].  Positive = clockwise. */
function signedAngleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

/** Haversine distance in metres */
function dist(a: GpsPoint, b: GpsPoint): number {
  const R = 6_371_000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Speed at index: prefer embedded GPS speed, fall back to positional delta */
function speedAt(points: GpsPoint[], i: number): number {
  const p = points[i];
  if (p.speed != null && p.speed > 0) return p.speed;
  if (i === 0 || i >= points.length - 1) return 0;
  const dt = (points[i + 1].timestamp - points[i - 1].timestamp) / 1000;
  if (dt <= 0) return 0;
  return dist(points[i - 1], points[i + 1]) / dt;
}

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * Detect jibes in a wingfoil GPS track.
 *
 * A jibe is a ~180° heading reversal completed within MAX_JIBE_DURATION_MS.
 * The `good` flag is set when the minimum speed during the manoeuvre was
 * ≥ MIN_JIBE_SPEED_KMH (10 km/h).
 */
export function detectJibes(points: GpsPoint[]): Jibe[] {
  if (points.length < 6) return [];

  // ── Step 1: compute raw bearings between consecutive points ────────────────
  // Suppress noise for very close points (GPS jitter when nearly stationary).
  const rawBearings: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    if (dist(points[i], points[i + 1]) < 0.5 && rawBearings.length > 0) {
      rawBearings.push(rawBearings[rawBearings.length - 1]);
    } else {
      rawBearings.push(gpsBearing(points[i], points[i + 1]));
    }
  }

  // ── Step 2: smooth with a 3-point circular mean ────────────────────────────
  const bearings: number[] = rawBearings.map((_, i) => {
    const p = rawBearings[Math.max(0, i - 1)];
    const c = rawBearings[i];
    const n = rawBearings[Math.min(rawBearings.length - 1, i + 1)];
    const avgSin =
      (Math.sin(toRad(p)) + Math.sin(toRad(c)) + Math.sin(toRad(n))) / 3;
    const avgCos =
      (Math.cos(toRad(p)) + Math.cos(toRad(c)) + Math.cos(toRad(n))) / 3;
    return (Math.atan2(avgSin, avgCos) * (180 / Math.PI) + 360) % 360;
  });

  // ── Step 3: sliding-window jibe search ────────────────────────────────────
  const jibes: Jibe[] = [];
  const used = new Set<number>();

  for (let i = 1; i < bearings.length - 2; i++) {
    if (used.has(i)) continue;
    if (speedAt(points, i) < MIN_ENTRY_SPEED_MPS) continue;

    const startTime = points[i].timestamp;
    let cumTurn = 0;
    let turnSign = 0;
    let minSpeed = speedAt(points, i);
    let peakTurnIdx = i;
    let maxAbsTurn = 0;

    for (let j = i + 1; j < bearings.length; j++) {
      const elapsed = points[j].timestamp - startTime;
      if (elapsed > MAX_JIBE_DURATION_MS) break;

      const delta = signedAngleDiff(bearings[j - 1], bearings[j]);

      // Establish turn direction from first significant bearing change
      if (turnSign === 0 && Math.abs(delta) > 8) {
        turnSign = Math.sign(delta);
      }

      // Stop if the turn reverses significantly (not just GPS noise)
      if (
        turnSign !== 0 &&
        Math.sign(delta) !== 0 &&
        Math.sign(delta) !== turnSign &&
        Math.abs(delta) > 25
      ) {
        break;
      }

      cumTurn += delta;

      const spd = speedAt(points, j);
      if (spd > 0) minSpeed = Math.min(minSpeed, spd);

      const absTurn = Math.abs(cumTurn);
      if (absTurn > maxAbsTurn) {
        maxAbsTurn = absTurn;
        peakTurnIdx = j;
      }

      if (absTurn >= MIN_TURN_DEG) {
        if (absTurn <= MAX_TURN_DEG) {
          const minSpeedKmh = minSpeed * 3.6;
          for (let k = i; k <= j; k++) used.add(k);
          jibes.push({
            startIndex: i,
            endIndex: j,
            peakIndex: peakTurnIdx,
            good: minSpeedKmh >= MIN_JIBE_SPEED_KMH,
            minSpeedKmh: Math.round(minSpeedKmh * 10) / 10,
            totalTurnDeg: Math.round(absTurn),
            durationSeconds: Math.round(elapsed / 1000),
          });
        }
        break; // stop regardless — turn is complete (or over-rotated)
      }
    }
  }

  return jibes;
}

export interface FlyingStats {
  /** Total seconds with speed ≥ 10 km/h */
  flyingSeconds: number;
  /** flyingSeconds / totalDurationSeconds as 0–100 */
  flyingRatePct: number;
}

/**
 * Calculates flying time (speed ≥ MIN_JIBE_SPEED_KMH) and flying rate.
 * Uses the inter-point time interval weighted by whether the speed at that
 * point meets the threshold.
 */
export function computeFlyingStats(points: GpsPoint[]): FlyingStats {
  if (points.length < 2) return { flyingSeconds: 0, flyingRatePct: 0 };

  const thresholdMps = MIN_JIBE_SPEED_KMH / 3.6;
  let flyingMs = 0;
  let totalMs = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dt = points[i + 1].timestamp - points[i].timestamp;
    if (dt <= 0) continue;
    totalMs += dt;

    // Prefer embedded GPS speed; fall back to positional delta for this interval
    let intervalSpeed: number;
    const embeddedSpeed = points[i].speed;
    if (embeddedSpeed != null && embeddedSpeed > 0) {
      intervalSpeed = embeddedSpeed;
    } else {
      const dtSec = dt / 1000;
      intervalSpeed = dtSec > 0 ? dist(points[i], points[i + 1]) / dtSec : 0;
    }

    if (intervalSpeed >= thresholdMps) {
      flyingMs += dt;
    }
  }

  const flyingSeconds = Math.round(flyingMs / 1000);
  const flyingRatePct =
    totalMs > 0 ? Math.round((flyingMs / totalMs) * 100) : 0;

  return { flyingSeconds, flyingRatePct };
}

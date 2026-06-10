import type { Track } from "../types";

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters.toFixed(0)} m`;
}

export function formatPace(track: Track): string {
  if (
    track.activityType === "cycling" ||
    track.activityType === "wingfoiling"
  ) {
    const kmh = (track.avgSpeed ?? 0) * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  }
  if (!track.avgSpeed || track.avgSpeed === 0) return "–";
  const secPerKm = 1000 / track.avgSpeed;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

export function formatSpeed(mps: number): string {
  return `${(mps * 3.6).toFixed(1)} km/h`;
}

export const activityIcons: Record<string, string> = {
  running: "🏃",
  cycling: "🚴",
  walking: "🚶",
  hiking: "🥾",
  swimming: "🏊",
  wingfoiling: "🪁",
  other: "⌚",
};

export const activityColors: Record<string, string> = {
  running: "bg-orange-100 text-orange-700",
  cycling: "bg-blue-100 text-blue-700",
  walking: "bg-green-100 text-green-700",
  hiking: "bg-emerald-100 text-emerald-700",
  swimming: "bg-cyan-100 text-cyan-700",
  wingfoiling: "bg-sky-100 text-sky-700",
  other: "bg-gray-100 text-gray-700",
};

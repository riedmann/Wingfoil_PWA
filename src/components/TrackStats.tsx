import type { Track, Jibe } from "../types";
import type { FlyingStats } from "../services/jibeDetector";
import {
  formatDuration,
  formatDistance,
  formatPace,
  formatSpeed,
} from "../utils/format";
import {
  Heart,
  Flame,
  TrendingUp,
  Zap,
  MapPin,
  Clock,
  Route,
  Activity,
  Wind,
} from "lucide-react";

interface Props {
  track: Track;
  jibes?: Jibe[];
  flyingStats?: FlyingStats;
}

export default function TrackStats({ track, jibes, flyingStats }: Props) {
  const stats = [
    {
      icon: <Clock size={18} className="text-blue-500" />,
      label: "Duration",
      value: formatDuration(track.durationSeconds),
    },
    {
      icon: <Route size={18} className="text-emerald-500" />,
      label: "Distance",
      value: formatDistance(track.distanceMeters),
    },
    {
      icon: <Activity size={18} className="text-violet-500" />,
      label: track.activityType === "cycling" ? "Avg Speed" : "Avg Pace",
      value: formatPace(track),
    },
    {
      icon: <Zap size={18} className="text-yellow-500" />,
      label: "Max Speed",
      value: track.maxSpeed ? formatSpeed(track.maxSpeed) : "–",
    },
    {
      icon: <Heart size={18} className="text-red-500" />,
      label: "Avg Heart Rate",
      value: track.avgHeartRate ? `${track.avgHeartRate} bpm` : "–",
    },
    {
      icon: <Heart size={18} className="text-red-700" />,
      label: "Max Heart Rate",
      value: track.maxHeartRate ? `${track.maxHeartRate} bpm` : "–",
    },
    {
      icon: <TrendingUp size={18} className="text-orange-500" />,
      label: "Elevation Gain",
      value: track.elevationGain ? `${track.elevationGain} m` : "–",
    },
    {
      icon: <Flame size={18} className="text-orange-400" />,
      label: "Calories",
      value: track.calories ? `${track.calories} kcal` : "–",
    },
    {
      icon: <MapPin size={18} className="text-gray-400" />,
      label: "GPS Points",
      value: track.points.length.toString(),
    },
  ];

  const goodJibes = jibes?.filter((j) => j.good) ?? [];
  const badJibes = jibes?.filter((j) => !j.good) ?? [];
  const successRate =
    jibes && jibes.length > 0
      ? Math.round((goodJibes.length / jibes.length) * 100)
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{s.icon}</div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Flying time section – wingfoil only */}
      {flyingStats && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Wind size={16} className="text-sky-500" />
            Flying stats
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sky-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-sky-600">
                {formatDuration(flyingStats.flyingSeconds)}
              </p>
              <p className="text-xs text-sky-500 mt-0.5">Flying time</p>
            </div>
            <div className="bg-sky-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-sky-600">
                {flyingStats.flyingRatePct}%
              </p>
              <p className="text-xs text-sky-500 mt-0.5">Flying rate</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-slate-500">
                {formatDuration(
                  track.durationSeconds - flyingStats.flyingSeconds,
                )}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Non-flying time</p>
            </div>
          </div>
        </div>
      )}

      {/* Jibe section – only shown for wingfoil sessions */}
      {jibes && jibes.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🪂 Jibes
            <span className="text-sm font-normal text-gray-400">
              ({jibes.length} detected)
            </span>
          </h3>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {goodJibes.length}
              </p>
              <p className="text-xs text-green-600 mt-0.5">Good jibes</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-500">
                {badJibes.length}
              </p>
              <p className="text-xs text-red-500 mt-0.5">Slow jibes</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
              <p className="text-xs text-blue-500 mt-0.5">Success rate</p>
            </div>
          </div>

          {/* Per-jibe rows */}
          <div className="space-y-2">
            {jibes.map((jibe, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                  jibe.good ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white shrink-0 ${
                    jibe.good ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`font-medium flex-1 ${
                    jibe.good ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {jibe.good ? "Good jibe" : "Slow jibe"}
                </span>
                <span className="text-xs text-gray-500 flex gap-3 shrink-0">
                  <span>Min {jibe.minSpeedKmh} km/h</span>
                  <span>{jibe.totalTurnDeg}°</span>
                  <span>{jibe.durationSeconds}s</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

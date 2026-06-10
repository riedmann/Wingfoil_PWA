import type { Track } from "../types";
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
} from "lucide-react";

interface Props {
  track: Track;
}

export default function TrackStats({ track }: Props) {
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
    </div>
  );
}

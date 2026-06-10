import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Heart, Flame, MapPin, Trash2 } from "lucide-react";
import type { Track } from "../types";
import {
  formatDuration,
  formatDistance,
  formatPace,
  activityColors,
  activityIcons,
} from "../utils/format";
import { useAppStore } from "../store/useAppStore";

interface Props {
  track: Track;
}

export default function TrackCard({ track }: Props) {
  const navigate = useNavigate();
  const deleteTrack = useAppStore((s) => s.deleteTrack);
  const colorClass = activityColors[track.activityType] ?? activityColors.other;
  const icon = activityIcons[track.activityType] ?? "⌚";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTrack(track.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/track/${track.id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/track/${track.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl ${colorClass} shrink-0`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {track.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(track.startTime), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          aria-label="Delete track"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Stat label="Duration" value={formatDuration(track.durationSeconds)} />
        <Stat label="Distance" value={formatDistance(track.distanceMeters)} />
        <Stat label="Pace / Speed" value={formatPace(track)} />
        {track.avgHeartRate ? (
          <Stat
            label="Avg HR"
            value={`${track.avgHeartRate} bpm`}
            icon={<Heart size={11} className="text-red-400" />}
          />
        ) : track.calories ? (
          <Stat
            label="Calories"
            value={`${track.calories} kcal`}
            icon={<Flame size={11} className="text-orange-400" />}
          />
        ) : (
          <Stat
            label="Points"
            value={`${track.points.length}`}
            icon={<MapPin size={11} className="text-blue-400" />}
          />
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 flex items-center gap-0.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

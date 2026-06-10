import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import TrackMap from "../components/TrackMap";
import TrackStats from "../components/TrackStats";
import { activityIcons, activityColors } from "../utils/format";

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const track = useAppStore((s) => s.tracks.find((t) => t.id === id));

  if (!track) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-400">Track not found.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-blue-600 text-sm hover:underline"
        >
          ← Back to list
        </button>
      </div>
    );
  }

  const icon = activityIcons[track.activityType] ?? "⌚";
  const colorClass = activityColors[track.activityType] ?? activityColors.other;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Back nav */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        All Tracks
      </button>

      {/* Title */}
      <div className="flex items-center gap-3">
        <span
          className={`text-2xl w-12 h-12 flex items-center justify-center rounded-2xl ${colorClass} shrink-0`}
        >
          {icon}
        </span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{track.name}</h1>
          <p className="text-sm text-gray-400">
            {format(new Date(track.startTime), "EEEE, dd MMMM yyyy · HH:mm")}
          </p>
        </div>
      </div>

      {/* Map */}
      <TrackMap points={track.points} />

      {/* Stats */}
      <TrackStats track={track} />
    </div>
  );
}

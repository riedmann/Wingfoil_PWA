import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import TrackMap from "../components/TrackMap";
import TrackStats from "../components/TrackStats";
import EditTrackModal from "../components/EditTrackModal";
import { activityIcons, activityColors } from "../utils/format";
import { detectJibes, computeFlyingStats } from "../services/jibeDetector";

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const track = useAppStore((s) => s.tracks.find((t) => t.id === id));
  const editTrack = useAppStore((s) => s.editTrack);
  const [showEdit, setShowEdit] = useState(false);

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

  // Only run jibe detection for wingfoil sessions (avoids false positives on other activities)
  const jibes = useMemo(
    () =>
      track.activityType === "wingfoiling" ? detectJibes(track.points) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track.id, track.activityType],
  );

  const flyingStats = useMemo(
    () =>
      track.activityType === "wingfoiling"
        ? computeFlyingStats(track.points)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track.id, track.activityType],
  );

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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`text-2xl w-12 h-12 flex items-center justify-center rounded-2xl ${colorClass} shrink-0`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {track.name}
            </h1>
            <p className="text-sm text-gray-400">
              {format(new Date(track.startTime), "EEEE, dd MMMM yyyy · HH:mm")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 mt-1"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      {/* Map */}
      <TrackMap points={track.points} jibes={jibes} />

      {/* Stats */}
      <TrackStats
        track={track}
        jibes={jibes}
        flyingStats={flyingStats ?? undefined}
      />

      {/* Edit modal */}
      {showEdit && (
        <EditTrackModal
          track={track}
          onSave={(patch) => editTrack(track.id, patch)}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

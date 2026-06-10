import { useState } from "react";
import { X, Check } from "lucide-react";
import type { Track, ActivityType } from "../types";
import { activityIcons } from "../utils/format";

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "wingfoiling", label: "🪂 Wingfoiling" },
  { value: "running", label: "🏃 Running" },
  { value: "cycling", label: "🚴 Cycling" },
  { value: "walking", label: "🚶 Walking" },
  { value: "hiking", label: "🥾 Hiking" },
  { value: "swimming", label: "🏊 Swimming" },
  { value: "other", label: "⌚ Other" },
];

interface Props {
  track: Track;
  onSave: (patch: Partial<Pick<Track, "name" | "activityType">>) => void;
  onClose: () => void;
}

export default function EditTrackModal({ track, onSave, onClose }: Props) {
  const [name, setName] = useState(track.name);
  const [activityType, setActivityType] = useState<ActivityType>(
    track.activityType,
  );

  const handleSave = () => {
    const patch: Partial<Pick<Track, "name" | "activityType">> = {};
    if (name.trim() && name.trim() !== track.name) patch.name = name.trim();
    if (activityType !== track.activityType) patch.activityType = activityType;
    onSave(patch);
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-lg">Edit session</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Name field */}
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="track-name"
          >
            Name
          </label>
          <input
            id="track-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Activity type */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-gray-700">
            Activity type
          </span>
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActivityType(opt.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors ${
                  activityType === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>{activityIcons[opt.value]}</span>
                <span>{opt.label.split(" ").slice(1).join(" ")}</span>
                {activityType === opt.value && (
                  <Check size={13} className="ml-auto shrink-0 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

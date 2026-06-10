import { Search, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { SortField, SortDirection } from "../types";

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: "Date", value: "startTime" },
  { label: "Duration", value: "durationSeconds" },
  { label: "Distance", value: "distanceMeters" },
  { label: "Name", value: "name" },
  { label: "Heart Rate", value: "avgHeartRate" },
];

const ACTIVITY_OPTIONS = [
  { label: "All", value: "all" },
  { label: "🪂 Wingfoiling", value: "wingfoiling" },
  { label: "🏃 Running", value: "running" },
  { label: "🚴 Cycling", value: "cycling" },
  { label: "🚶 Walking", value: "walking" },
  { label: "🥾 Hiking", value: "hiking" },
  { label: "🏊 Swimming", value: "swimming" },
  { label: "⌚ Other", value: "other" },
];

export default function TrackFilters() {
  const {
    searchQuery,
    setSearch,
    sortField,
    sortDirection,
    setSort,
    activityFilter,
    setActivityFilter,
  } = useAppStore();

  const toggleDir = (field: SortField) => {
    if (sortField === field) {
      setSort(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSort(field, "desc");
    }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search tracks…"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Activity filter */}
      <div className="flex gap-1.5 flex-wrap">
        {ACTIVITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActivityFilter(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activityFilter === opt.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Sort:</span>
        {SORT_OPTIONS.map((opt) => {
          const active = sortField === opt.value;
          const dir: SortDirection = active ? sortDirection : "desc";
          return (
            <button
              key={opt.value}
              onClick={() => toggleDir(opt.value)}
              className={`flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
              {active && (
                <span className="ml-0.5">{dir === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

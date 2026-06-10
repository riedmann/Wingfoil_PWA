import BluetoothPanel from "../components/BluetoothPanel";
import TrackFilters from "../components/TrackFilters";
import TrackCard from "../components/TrackCard";
import FileImport from "../components/FileImport";
import { useAppStore } from "../store/useAppStore";
import { useMemo, useState } from "react";
import type { Track, SortField } from "../types";
import { Watch, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";

export default function TrackListPage() {
  const { tracks, searchQuery, sortField, sortDirection, activityFilter, importTracks } =
    useAppStore();
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    let list: Track[] = [...tracks];

    if (activityFilter !== "all") {
      list = list.filter((t) => t.activityType === activityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const field = sortField as SortField;
      const av = a[field] ?? 0;
      const bv = b[field] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDirection === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      return sortDirection === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });

    return list;
  }, [tracks, searchQuery, sortField, sortDirection, activityFilter]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
          <Watch size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">WatchFit</h1>
          <p className="text-xs text-gray-400">Xiaomi Mi Watch S4 companion</p>
        </div>
      </div>

      {/* BT panel */}
      <BluetoothPanel />

      {/* File import panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <button
          onClick={() => setShowImport((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-2xl transition-colors"
        >
          <span className="flex items-center gap-2">
            <FolderOpen size={16} className="text-gray-400" />
            Import GPX / FIT files
          </span>
          {showImport ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showImport && (
          <div className="px-5 pb-5">
            <FileImport onImport={importTracks} />
          </div>
        )}
      </div>

      {/* Filters */}
      {tracks.length > 0 && <TrackFilters />}

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <EmptyState />
      ) : (
        <p className="text-center text-sm text-gray-400 py-8">
          No tracks match your search.
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-5xl mb-4">⌚</div>
      <p className="font-medium text-gray-600 mb-1">No tracks yet</p>
      <p className="text-sm">
        Import <strong>.gpx</strong> or <strong>.fit</strong> files from the
        Zepp app, or connect your watch above.
      </p>
    </div>
  );
}

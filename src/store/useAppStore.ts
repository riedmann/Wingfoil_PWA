import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Track,
  BluetoothStatus,
  SortField,
  SortDirection,
} from "../types";
import { XiaomiBluetoothService } from "../services/bluetooth";

const btService = new XiaomiBluetoothService();

interface AppState {
  // Bluetooth
  btStatus: BluetoothStatus;
  btDeviceName?: string;
  btError?: string;
  downloadProgress: number;
  statusMessage: string;

  // Tracks
  tracks: Track[];

  // List UI
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  activityFilter: string;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  downloadTracks: () => Promise<void>;
  setSearch: (q: string) => void;
  setSort: (field: SortField, dir: SortDirection) => void;
  setActivityFilter: (type: string) => void;
  deleteTrack: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      btStatus: "disconnected",
      downloadProgress: 0,
      statusMessage: "",
      tracks: [],
      searchQuery: "",
      sortField: "startTime",
      sortDirection: "desc",
      activityFilter: "all",

      connect: async () => {
        set({ btStatus: "scanning", btError: undefined });
        try {
          await btService.connect((msg) =>
            set({ statusMessage: msg, btStatus: "connecting" }),
          );
          set({
            btStatus: "connected",
            btDeviceName: btService.deviceName,
            statusMessage: "",
          });
        } catch (err) {
          set({
            btStatus: "error",
            btError: (err as Error).message,
          });
        }
      },

      disconnect: () => {
        btService.disconnect();
        set({
          btStatus: "disconnected",
          btDeviceName: undefined,
          statusMessage: "",
        });
      },

      downloadTracks: async () => {
        set({
          btStatus: "downloading",
          downloadProgress: 0,
          btError: undefined,
        });
        try {
          const tracks = await btService.downloadTracks(
            (progress) => set({ downloadProgress: progress }),
            (msg) => set({ statusMessage: msg }),
          );
          const existing = get().tracks;
          // Merge – avoid duplicates by id
          const merged = [
            ...tracks,
            ...existing.filter((e) => !tracks.find((t) => t.id === e.id)),
          ];
          set({ tracks: merged, btStatus: "connected", statusMessage: "" });
        } catch (err) {
          set({
            btStatus: "error",
            btError: (err as Error).message,
          });
        }
      },

      setSearch: (searchQuery) => set({ searchQuery }),
      setSort: (sortField, sortDirection) => set({ sortField, sortDirection }),
      setActivityFilter: (activityFilter) => set({ activityFilter }),
      deleteTrack: (id) =>
        set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) })),
    }),
    {
      name: "watchfit-store",
      // Only persist tracks; reset BT state on reload
      partialize: (s) => ({ tracks: s.tracks }),
    },
  ),
);

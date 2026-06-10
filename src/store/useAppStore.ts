import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Track,
  BluetoothStatus,
  SortField,
  SortDirection,
} from "../types";
import {
  XiaomiBluetoothService,
  generateDemoTracks,
} from "../services/bluetooth";

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
  importTracks: (tracks: Track[]) => void;
  editTrack: (
    id: string,
    patch: Partial<Pick<Track, "name" | "activityType">>,
  ) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      btStatus: "disconnected",
      downloadProgress: 0,
      statusMessage: "",
      tracks: generateDemoTracks(),
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
      editTrack: (id, patch) =>
        set((s) => ({
          tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      importTracks: (incoming) =>
        set((s) => {
          const merged = [
            ...incoming,
            ...s.tracks.filter((e) => !incoming.find((t) => t.id === e.id)),
          ];
          return { tracks: merged };
        }),
    }),
    {
      name: "watchfit-store",
      // Only persist user-imported tracks; demo tracks are always regenerated.
      partialize: (s) => ({
        tracks: s.tracks.filter((t) => t.id.startsWith("import-")),
      }),
      // On rehydration: fresh demo tracks + any previously imported tracks.
      merge: (persistedState, currentState) => {
        const imported = (
          (persistedState as Partial<AppState>).tracks ?? []
        ).filter((t) => t.id.startsWith("import-"));
        return {
          ...(currentState as AppState),
          tracks: [...generateDemoTracks(), ...imported],
        };
      },
    },
  ),
);

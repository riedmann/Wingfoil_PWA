import {
  Bluetooth,
  BluetoothOff,
  Download,
  Loader2,
  Unplug,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";

export default function BluetoothPanel() {
  const {
    btStatus,
    btDeviceName,
    btError,
    downloadProgress,
    statusMessage,
    connect,
    disconnect,
    downloadTracks,
  } = useAppStore();

  const isConnected = btStatus === "connected";
  const isBusy =
    btStatus === "scanning" ||
    btStatus === "connecting" ||
    btStatus === "downloading";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected
                ? "bg-green-500"
                : btStatus === "error"
                  ? "bg-red-500"
                  : isBusy
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-gray-300"
            }`}
          />
          <h2 className="font-semibold text-gray-800">
            {btDeviceName ?? "Xiaomi Mi Watch S4"}
          </h2>
        </div>

        <div className="flex gap-2">
          {!isConnected && !isBusy && (
            <button
              onClick={connect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Bluetooth size={15} />
              Connect
            </button>
          )}

          {isConnected && (
            <>
              <button
                onClick={downloadTracks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Download size={15} />
                Sync Tracks
              </button>
              <button
                onClick={disconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Unplug size={15} />
                Disconnect
              </button>
            </>
          )}

          {isBusy && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              {btStatus === "downloading" ? `${downloadProgress}%` : "..."}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {btStatus === "downloading" && (
        <div className="mt-2">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status message */}
      {statusMessage && (
        <p className="mt-2 text-xs text-gray-500">{statusMessage}</p>
      )}

      {/* Error */}
      {btStatus === "error" && btError && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{btError}</span>
        </div>
      )}

      {/* Connected confirm */}
      {isConnected && !statusMessage && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle size={14} />
          <span>Ready to sync</span>
        </div>
      )}

      {/* Not connected info */}
      {btStatus === "disconnected" && (
        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <BluetoothOff size={12} />
          Connect your Xiaomi Mi Watch S4 via Bluetooth to sync fitness tracks.
        </p>
      )}
    </div>
  );
}

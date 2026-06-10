import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GpsPoint, Jibe } from "../types";

interface Props {
  points: GpsPoint[];
  jibes?: Jibe[];
}

// ─── speed colour scale ───────────────────────────────────────────────────────
// Tuned for wingfoiling; still useful for other activities.
function speedColor(mps: number | undefined): string {
  if (mps == null) return "#3b82f6"; // no speed data → default blue
  const kmh = mps * 3.6;
  if (kmh < 5) return "#94a3b8"; // slate  – nearly stationary
  if (kmh < 10) return "#f97316"; // orange – below jibe threshold
  if (kmh < 20) return "#3b82f6"; // blue   – normal speed
  if (kmh < 30) return "#06b6d4"; // cyan   – fast
  return "#8b5cf6"; //               violet – very fast
}

interface Segment {
  positions: [number, number][];
  color: string;
}

/**
 * Groups consecutive GPS points with the same display colour into polyline
 * segments.  Jibe segments override the speed-based colour.
 */
function buildSegments(points: GpsPoint[], jibes: Jibe[]): Segment[] {
  if (points.length < 2) return [];

  // Build per-point colour: speed-based by default, overridden by jibe colour
  const colorOf: string[] = points.map((p) => speedColor(p.speed));
  for (const j of jibes) {
    const c = j.good ? "#22c55e" : "#ef4444";
    for (let k = j.startIndex; k <= j.endIndex && k < points.length; k++) {
      colorOf[k] = c;
    }
  }

  const segments: Segment[] = [];
  let curColor = colorOf[0];
  let curPositions: [number, number][] = [[points[0].lat, points[0].lng]];

  for (let i = 1; i < points.length; i++) {
    if (colorOf[i] !== curColor) {
      // Include point[i] in current segment so there are no gaps
      curPositions.push([points[i].lat, points[i].lng]);
      segments.push({ positions: curPositions, color: curColor });
      curColor = colorOf[i];
      curPositions = [[points[i].lat, points[i].lng]];
    } else {
      curPositions.push([points[i].lat, points[i].lng]);
    }
  }
  if (curPositions.length >= 2) {
    segments.push({ positions: curPositions, color: curColor });
  }
  return segments;
}

// ─── leaflet helpers ──────────────────────────────────────────────────────────

function FitBounds({ points }: { points: GpsPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [30, 30] },
    );
  }, [points, map]);
  return null;
}

function makeJibeIcon(num: number, good: boolean): L.DivIcon {
  const bg = good ? "#22c55e" : "#ef4444";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);font-family:system-ui,sans-serif">${num}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function TrackMap({ points, jibes = [] }: Props) {
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-2xl text-gray-400 text-sm">
        No GPS data available
      </div>
    );
  }

  const segments = useMemo(() => buildSegments(points, jibes), [points, jibes]);

  const start = points[0];
  const end = points[points.length - 1];
  const hasSpeedData = points.some((p) => p.speed != null && p.speed > 0);

  return (
    <div>
      <div
        className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
        style={{ height: 380 }}
      >
        <MapContainer
          center={[start.lat, start.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Speed / jibe coloured polyline */}
          {segments.map((seg, idx) => (
            <Polyline
              key={idx}
              positions={seg.positions}
              color={seg.color}
              weight={4}
              opacity={0.9}
            />
          ))}

          {/* Start marker */}
          <CircleMarker
            center={[start.lat, start.lng]}
            radius={8}
            color="#22c55e"
            fillColor="#22c55e"
            fillOpacity={1}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              Start
            </Tooltip>
          </CircleMarker>

          {/* End marker */}
          <CircleMarker
            center={[end.lat, end.lng]}
            radius={8}
            color="#ef4444"
            fillColor="#ef4444"
            fillOpacity={1}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              End
            </Tooltip>
          </CircleMarker>

          {/* Numbered jibe peak markers */}
          {jibes.map((jibe, idx) => {
            const peak = points[jibe.peakIndex];
            if (!peak) return null;
            return (
              <Marker
                key={`jibe-${idx}`}
                position={[peak.lat, peak.lng]}
                icon={makeJibeIcon(idx + 1, jibe.good)}
              >
                <Tooltip direction="top" offset={[0, -14]}>
                  <div className="text-xs leading-5">
                    <strong>
                      Jibe {idx + 1} — {jibe.good ? "✅ Good" : "❌ Slow"}
                    </strong>
                    <br />
                    Min speed: {jibe.minSpeedKmh} km/h
                    <br />
                    Turn: {jibe.totalTurnDeg}° · {jibe.durationSeconds}s
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

          <FitBounds points={points} />
        </MapContainer>
      </div>

      {/* Legend */}
      {(hasSpeedData || jibes.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 px-1">
          {hasSpeedData && (
            <>
              <span className="font-medium text-gray-600">Speed:</span>
              {(
                [
                  { color: "#94a3b8", label: "< 5 km/h" },
                  { color: "#f97316", label: "5–10 km/h" },
                  { color: "#3b82f6", label: "10–20 km/h" },
                  { color: "#06b6d4", label: "20–30 km/h" },
                  { color: "#8b5cf6", label: "> 30 km/h" },
                ] as const
              ).map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1">
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  {label}
                </span>
              ))}
            </>
          )}
          {jibes.length > 0 && (
            <>
              <span className="font-medium text-gray-600 ml-2">Jibes:</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 shrink-0" />
                Good (≥10 km/h)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 shrink-0" />
                Slow (&lt;10 km/h)
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GpsPoint } from "../types";

interface Props {
  points: GpsPoint[];
}

function FitBounds({ points }: Props) {
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

export default function TrackMap({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-2xl text-gray-400 text-sm">
        No GPS data available
      </div>
    );
  }

  const positions = points.map((p) => [p.lat, p.lng] as [number, number]);
  const start = points[0];
  const end = points[points.length - 1];

  return (
    <div
      className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
      style={{ height: 380 }}
    >
      <MapContainer
        center={[start.lat, start.lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={positions}
          color="#3b82f6"
          weight={4}
          opacity={0.85}
        />
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
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}

"use client";

import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import type { CityState } from "@/lib/types";
import { pct, statusToPill } from "@/lib/utils";
import { Card, Pill } from "@/components/ui";

export function MapPanel({ state }: { state: CityState }) {
  const route = state.stations.map((station) => [station.lat, station.lng] as [number, number]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <Card className="p-2">
        <MapContainer center={[9.995, 76.315]} zoom={12} scrollWheelZoom className="z-0">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={route} pathOptions={{ color: "#111", weight: 4, opacity: 0.3 }} />
          {state.stations.map((station) => (
            <CircleMarker
              key={station.id}
              center={[station.lat, station.lng]}
              radius={8 + station.passenger_occupancy * 8}
              pathOptions={{
                color: healthColor(station.health_status),
                fillColor: healthColor(station.health_status),
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <strong>{station.name}</strong>
                  <p>Passengers: {pct(station.passenger_occupancy)}</p>
                  <p>Traffic: {pct(station.traffic_index)}</p>
                  <p>Parking: {pct(station.parking_occupancy)}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {state.trains.map((train) => (
            <CircleMarker
              key={train.id}
              center={[train.lat, train.lng]}
              radius={5}
              pathOptions={{ color: "#111", fillColor: "#111", fillOpacity: 0.4 }}
            >
              <Popup>
                <strong>{train.id}</strong>
                <p>Direction: {train.direction}</p>
                <p>Delay: {train.delay_minutes} min</p>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-[#111111]">GIS layers</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <LayerMetric label="Passenger" value={state.stations} />
          <LayerMetric label="Traffic" value={state.stations} />
          <LayerMetric label="Parking" value={state.stations} />
          <LayerMetric label="Weather" value={state.weather.severity} isDirect />
        </div>
        <div className="mt-8 space-y-3">
          <p className="text-sm font-medium text-[#111111]">Stations needing attention</p>
          {state.stations
            .filter((s) => s.health_status !== "healthy")
            .map((station) => (
              <div key={station.id} className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#111111]">{station.name}</p>
                  <Pill variant={ statusToPill(station.health_status)}>{station.health_status}</Pill>
                </div>
                <p className="mt-2 text-sm text-[#787774]">
                  Passenger {pct(station.passenger_occupancy)} · Parking {pct(station.parking_occupancy)}
                </p>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

function LayerMetric({ label, value, isDirect }: { label: string; value: CityState["stations"] | number; isDirect?: boolean }) {
  const num = isDirect ? (value as number) : Math.max(...(value as CityState["stations"]).map(s => s.passenger_occupancy));
  return (
    <div className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-3">
      <p className="text-[11px] uppercase tracking-[0.1em] text-[#787774]">{label}</p>
      <p className="mt-1.5 text-2xl font-medium tracking-tight text-[#111111] tabular-nums">
        {pct(num)}
      </p>
    </div>
  );
}

function healthColor(status: string) {
  if (status === "critical") return "#9F2F2D";
  if (status === "warning") return "#956400";
  return "#346538";
}

"use client";

import { TrendUp } from "@phosphor-icons/react";
import type { CityState } from "@/lib/types";
import { pct, statusToPill } from "@/lib/utils";
import { Card, Pill } from "@/components/ui";
import { ScrollReveal } from "@/components/ScrollReveal";

export function Predictions({ state }: { state: CityState }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <ScrollReveal>
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <TrendUp size={22} weight="bold" className="text-[#111111]" />
            <div>
              <h2 className="text-lg font-medium text-[#111111]">Station forecast matrix</h2>
              <p className="text-sm text-[#787774] text-pretty">
                +60 minute passenger, traffic, parking, and health predictions
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-[#EAEAEA]">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-[#F9F9F8] text-[11px] uppercase tracking-[0.1em] text-[#787774]">
                <tr>
                  <th className="p-3 font-medium">Station</th>
                  <th className="p-3 font-medium">Passengers</th>
                  <th className="p-3 font-medium">Traffic</th>
                  <th className="p-3 font-medium">Parking</th>
                  <th className="p-3 font-medium">Health</th>
                  <th className="p-3 font-medium">Crowding</th>
                </tr>
              </thead>
              <tbody>
                {state.predictions.map((prediction) => (
                  <tr key={prediction.station_id} className="border-t border-[#EAEAEA]">
                    <td className="p-3 font-medium text-[#111111]">{prediction.station_name}</td>
                    <td className="p-3 text-[#787774] tabular-nums">{pct(prediction.passenger_occupancy)}</td>
                    <td className="p-3 text-[#787774] tabular-nums">{pct(prediction.traffic_index)}</td>
                    <td className="p-3 text-[#787774] tabular-nums">{pct(prediction.parking_occupancy)}</td>
                    <td className="p-3">
                      <Pill variant={prediction.health_status === "healthy" ? "green" : prediction.health_status === "warning" ? "yellow" : "red"}>
                        {prediction.health_status}
                      </Pill>
                    </td>
                    <td className="p-3 text-[#787774]">{prediction.crowding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <Card>
          <h2 className="text-lg font-medium text-[#111111]">Decision queue</h2>
          <div className="mt-5 space-y-3">
            {state.recommendations.slice(0, 8).map((rec) => (
              <div key={rec.id} className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{rec.action}</p>
                    <p className="text-xs text-[#787774]">{rec.station_name}</p>
                  </div>
                  <Pill variant={statusToPill(rec.priority)}>{rec.priority}</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#787774] text-pretty">{rec.expected_impact}</p>
                <p className="mt-2 text-xs text-[#787774] tabular-nums">Confidence {pct(rec.confidence)}</p>
              </div>
            ))}
          </div>
        </Card>
      </ScrollReveal>
    </div>
  );
}

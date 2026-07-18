"use client";

import { useMutation } from "@tanstack/react-query";
import { Gauge, Users, CloudRain, Car } from "@phosphor-icons/react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { CityState } from "@/lib/types";
import { pct, statusToPill } from "@/lib/utils";
import { Button, Card, Pill } from "@/components/ui";
import { ScrollReveal } from "@/components/ScrollReveal";
import { fetchForecast, generateAiReport, generateReport } from "@/lib/api";
import { useMetroMindStore } from "@/lib/store";

const timeline = [
  { label: "Now", minutes: 0 },
  { label: "+15m", minutes: 15 },
  { label: "+30m", minutes: 30 },
  { label: "+1h", minutes: 60 },
  { label: "+2h", minutes: 120 }
];

const workflowStates = ["New", "Acknowledged", "In Progress", "Resolved"] as const;

export function Dashboard({ state }: { state: CityState }) {
  const setSimulatedState = useMetroMindStore((store) => store.setSimulatedState);
  const modeLabel = useMetroMindStore((store) => store.modeLabel);
  const [workflow, setWorkflow] = useState<Record<string, (typeof workflowStates)[number]>>({});
  const forecastMutation = useMutation({
    mutationFn: fetchForecast,
    onSuccess: (data, horizon) => setSimulatedState(data, horizon === 0 ? null : `Forecast +${horizon}m`)
  });
  const reportMutation = useMutation({ mutationFn: generateReport });
  const aiReportMutation = useMutation({ mutationFn: generateAiReport });

  const passengerTrend = state.predictions.map((prediction) => ({
    name: prediction.station_name.replace("Maharaja's College", "Maharaja's"),
    current: Math.round(
      state.stations.find((station) => station.id === prediction.station_id)!.passenger_occupancy * 100
    ),
    forecast: Math.round(prediction.passenger_occupancy * 100)
  }));

  const metrics = [
    {
      label: "Network health",
      value: `${state.network_health.score}%`,
      helper: `${state.network_health.critical_stations.length} critical stations under watch`,
      icon: <Gauge size={20} weight="bold" />
    },
    {
      label: "Peak passenger load",
      value: pct(Math.max(...state.stations.map((s) => s.passenger_occupancy))),
      helper: "Highest live occupancy across the corridor",
      icon: <Users size={20} weight="bold" />
    },
    {
      label: "Weather",
      value: pct(state.weather.severity),
      helper: state.weather.condition,
      icon: <CloudRain size={20} weight="bold" />
    },
    {
      label: "Parking risk",
      value: pct(Math.max(...state.stations.map((s) => s.parking_occupancy))),
      helper: "Highest station parking utilization",
      icon: <Car size={20} weight="bold" />
    }
  ];

  const chartTooltipStyle = {
    background: "#FFFFFF",
    border: "1px solid #EAEAEA",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  };

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <Card>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-lg font-medium text-[#111111]">Operations control add-ons</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#787774]">
                {modeLabel ?? "Live twin"} · inspect future horizons, generate official reports, and track directive acknowledgement.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {timeline.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.minutes === 0) setSimulatedState(null);
                    else forecastMutation.mutate(item.minutes);
                  }}
                  className={`rounded-md border px-3 py-2 text-sm transition ${
                    (item.minutes === 0 && !modeLabel) || modeLabel === `Forecast +${item.minutes}m`
                      ? "border-[#111] bg-[#111] text-white"
                      : "border-[#EAEAEA] text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </ScrollReveal>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <ScrollReveal key={m.label} delay={i * 60}>
            <Card className="min-h-[128px]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] text-[#787774]">{m.label}</p>
                  <p className="mt-1.5 text-3xl font-medium tracking-tight text-[#111111] tabular-nums">
                    {m.value}
                  </p>
                </div>
                <div className="shrink-0 rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-2.5 text-[#787774]">
                  {m.icon}
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-6 text-[#787774] text-pretty">{m.helper}</p>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <ScrollReveal delay={120}>
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-[#111111]">Passenger forecast</h2>
                <p className="text-sm text-[#787774]">Current load compared with +60 minute prediction</p>
              </div>
              <Pill variant="green">Deterministic</Pill>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={passengerTrend}>
                  <defs>
                    <linearGradient id="forecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#111111" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EAEAEA" vertical={false} />
                  <XAxis dataKey="name" stroke="#787774" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#787774" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area dataKey="current" stroke="#787774" fill="transparent" strokeWidth={2} />
                  <Area dataKey="forecast" stroke="#111111" fill="url(#forecast)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <Card>
            <h2 className="text-lg font-medium text-[#111111]">Active alerts</h2>
            <div className="mt-5 space-y-3">
              {state.alerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#111111]">{alert.title}</p>
                    <Pill variant={alert.level === "Critical" ? "red" : alert.level === "High" ? "yellow" : "blue"}>
                      {alert.level}
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-[#787774]">{alert.station_name}</p>
                </div>
              ))}
            </div>
          </Card>
        </ScrollReveal>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ScrollReveal delay={240}>
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <WarningIcon />
              <h2 className="text-lg font-medium text-[#111111]">Directive workflow</h2>
            </div>
            <div className="grid gap-4">
              {state.recommendations.slice(0, 4).map((rec) => (
                <div key={rec.id} className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#787774]">
                        {rec.issue ?? "Operational issue"}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#111111]">{rec.directive ?? rec.action}</p>
                    </div>
                    <Pill variant={statusToPill(rec.priority)}>{rec.priority}</Pill>
                  </div>
                  <p className="mt-2 text-[13px] text-[#787774] text-pretty">{rec.expected_impact}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774]">
                      {rec.station_name} · {rec.owner ?? "Operations Control"}
                    </p>
                    <select
                      value={workflow[rec.id] ?? "New"}
                      onChange={(event) => setWorkflow((current) => ({ ...current, [rec.id]: event.target.value as (typeof workflowStates)[number] }))}
                      className="rounded-md border border-[#EAEAEA] bg-white px-2 py-1.5 text-xs text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111]"
                    >
                      {workflowStates.map((stateName) => (
                        <option key={stateName}>{stateName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-[#111111]">Operations report</h2>
                <p className="mt-1 text-sm text-[#787774]">Official brief with directives, owners, and watchlist.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => reportMutation.mutate()}>
                  Generate
                </Button>
                <Button variant="primary" onClick={() => aiReportMutation.mutate()}>
                  AI brief
                </Button>
              </div>
            </div>
            {reportMutation.data ? (
              <div className="mt-5 rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#787774]">
                  {reportMutation.data.report_id}
                </p>
                <div className="mt-3 space-y-2 text-sm text-[#787774]">
                  {reportMutation.data.summary.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {aiReportMutation.data?.briefing ? (
              <div className="mt-5 max-h-72 overflow-y-auto rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#787774]">
                    AI official brief
                  </p>
                  <Pill variant="blue">{aiReportMutation.data.provider}</Pill>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#111]">{aiReportMutation.data.briefing}</p>
              </div>
            ) : null}
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#787774" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v5" />
      <path d="M12 17v.01" />
      <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
    </svg>
  );
}

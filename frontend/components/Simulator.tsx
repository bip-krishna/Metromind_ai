"use client";

import { useMutation } from "@tanstack/react-query";
import { Play, ArrowClockwise } from "@phosphor-icons/react";
import { useState } from "react";
import { simulateScenario } from "@/lib/api";
import { useMetroMindStore } from "@/lib/store";
import type { CityState } from "@/lib/types";
import { pct } from "@/lib/utils";
import { Button, Card, Pill } from "@/components/ui";
import { ScrollReveal } from "@/components/ScrollReveal";

const scenarios = [
  "Heavy Rain",
  "Football Match",
  "Train Delay",
  "Power Failure",
  "Station Closure",
  "Festival",
  "Maintenance",
  "VIP Movement"
];

export function Simulator({ state }: { state: CityState }) {
  const [scenario, setScenario] = useState("Heavy Rain");
  const [stationId, setStationId] = useState("kaloor");
  const [horizon, setHorizon] = useState(60);
  const setSimulatedState = useMetroMindStore((store) => store.setSimulatedState);
  const simulatedState = useMetroMindStore((store) => store.simulatedState);

  const mutation = useMutation({
    mutationFn: simulateScenario,
    onSuccess: (data, variables) => setSimulatedState(data, `Scenario: ${variables.scenario}`)
  });

  const comparison = (simulatedState ?? state).predictions
    .slice()
    .sort((a, b) => b.health_score - a.health_score)
    .slice(0, 5);
  const scenarioDelta = simulatedState ? buildScenarioDelta(state, simulatedState) : null;

  const handleRun = () =>
    mutation.mutate({ scenario, station_id: stationId, time_horizon_minutes: horizon });

  const handleReset = () => setSimulatedState(null);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <ScrollReveal>
        <Card>
          <h2 className="text-lg font-medium text-[#111111]">Scenario simulator</h2>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm text-[#787774]">Scenario</span>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="mt-2 w-full rounded-md border border-[#EAEAEA] bg-white p-3 text-sm text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111]"
              >
                {scenarios.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-[#787774]">Focus station</span>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="mt-2 w-full rounded-md border border-[#EAEAEA] bg-white p-3 text-sm text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111]"
              >
                {state.stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-[#787774]">
                Timeline: +{horizon} minutes
              </span>
              <input
                type="range"
                min={15}
                max={120}
                step={15}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="mt-3 w-full accent-[#111]"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={handleRun}>
                <Play size={16} weight="bold" />
                Run simulation
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <ArrowClockwise size={16} />
                Reset
              </Button>
            </div>
            {mutation.isError && (
              <p className="text-sm text-pastel-red-text">
                Simulation failed. Check backend API.
              </p>
            )}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[#111111]">Simulated network impact</h2>
              <p className="text-sm text-[#787774]">
                {simulatedState ? `${scenario} at +${horizon} minutes` : "Baseline prediction state"}
              </p>
            </div>
            <Pill variant={simulatedState ? "yellow" : "green"}>
              {simulatedState ? "Simulated" : "Live"}
            </Pill>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Impact label="Network health" value={`${(simulatedState ?? state).network_health.score}%`} />
            <Impact
              label="Peak passenger"
              value={pct(Math.max(...(simulatedState ?? state).predictions.map((item) => item.passenger_occupancy)))}
            />
            <Impact label="Alerts" value={`${(simulatedState ?? state).alerts.length}`} />
          </div>
          {scenarioDelta ? (
            <div className="mt-5 rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#111]">Before vs after</h3>
                <Pill variant="blue">delta</Pill>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Delta label="Health" value={scenarioDelta.health} suffix="%" inverse />
                <Delta label="Peak passengers" value={scenarioDelta.passenger} suffix="%" />
                <Delta label="Traffic" value={scenarioDelta.traffic} suffix="%" />
                <Delta label="Alerts" value={scenarioDelta.alerts} suffix="" />
              </div>
            </div>
          ) : null}
          <div className="mt-6 space-y-3">
            {comparison.map((prediction) => (
              <div key={prediction.station_id} className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#111]">{prediction.station_name}</p>
                  <Pill variant={prediction.health_status === "healthy" ? "green" : prediction.health_status === "warning" ? "yellow" : "red"}>
                    {prediction.health_status}
                  </Pill>
                </div>
                <p className="mt-2 text-sm text-[#787774]">
                  Passengers {pct(prediction.passenger_occupancy)} · Traffic {pct(prediction.traffic_index)} · Parking{" "}
                  {pct(prediction.parking_occupancy)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </ScrollReveal>
    </div>
  );
}

function Impact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-4">
      <p className="text-sm text-[#787774]">{label}</p>
      <p className="mt-1.5 text-3xl font-medium tracking-tight text-[#111] tabular-nums">{value}</p>
    </div>
  );
}

function Delta({
  label,
  value,
  suffix,
  inverse = false
}: {
  label: string;
  value: number;
  suffix: string;
  inverse?: boolean;
}) {
  const rounded = Math.round(value * 10) / 10;
  const isRisk = inverse ? rounded < 0 : rounded > 0;
  return (
    <div className="rounded-md border border-[#EAEAEA] bg-white p-3">
      <p className="text-xs text-[#787774]">{label}</p>
      <p className={`mt-1 text-xl font-medium tabular-nums ${isRisk ? "text-pastel-red-text" : "text-[#111]"}`}>
        {rounded > 0 ? "+" : ""}
        {rounded}
        {suffix}
      </p>
    </div>
  );
}

function buildScenarioDelta(base: CityState, simulated: CityState) {
  const basePeakPassenger = Math.max(...base.predictions.map((item) => item.passenger_occupancy));
  const simulatedPeakPassenger = Math.max(...simulated.predictions.map((item) => item.passenger_occupancy));
  const basePeakTraffic = Math.max(...base.predictions.map((item) => item.traffic_index));
  const simulatedPeakTraffic = Math.max(...simulated.predictions.map((item) => item.traffic_index));
  return {
    health: simulated.network_health.score - base.network_health.score,
    passenger: (simulatedPeakPassenger - basePeakPassenger) * 100,
    traffic: (simulatedPeakTraffic - basePeakTraffic) * 100,
    alerts: simulated.alerts.length - base.alerts.length
  };
}

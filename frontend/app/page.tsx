"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  Pulse,
  MapPin,
  TrendUp,
  Broadcast,
  Robot,
  Sparkle,
  WarningCircle
} from "@phosphor-icons/react";
import { Dashboard } from "@/components/Dashboard";
import { Predictions } from "@/components/Predictions";
import { Simulator } from "@/components/Simulator";
import { Copilot } from "@/components/Copilot";
import { fetchState } from "@/lib/api";
import { useMetroMindStore, views } from "@/lib/store";
import type { CityState } from "@/lib/types";
import { Card, Pill, Button } from "@/components/ui";
import { ScrollReveal } from "@/components/ScrollReveal";

const MapPanel = dynamic(() => import("@/components/MapPanel").then((mod) => mod.MapPanel), {
  ssr: false,
  loading: () => <Card className="min-h-[560px] animate-pulse" />
});

const iconMap: Record<string, React.ElementType> = {
  Dashboard: Pulse,
  Map: MapPin,
  Predictions: TrendUp,
  Simulator: Broadcast,
  "AI Copilot": Robot
};

export default function Home() {
  const activeView = useMetroMindStore((store) => store.activeView);
  const setActiveView = useMetroMindStore((store) => store.setActiveView);
  const simulatedState = useMetroMindStore((store) => store.simulatedState);
  const modeLabel = useMetroMindStore((store) => store.modeLabel);
  const query = useQuery({ queryKey: ["city-state"], queryFn: fetchState, refetchInterval: 30000 });
  const state = simulatedState ?? query.data;

  return (
    <main id="main-content" className="min-h-screen px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <ScrollReveal>
          <header className="mb-10">
            <div className="mb-3 flex items-center gap-2.5">
              <Sparkle size={16} weight="fill" className="text-[#787774]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#787774]">
                KMRCL control room
              </span>
            </div>
            <h1 className="font-serif text-5xl font-light leading-[1.1] tracking-[-0.03em] text-[#111111] md:text-7xl text-balance">
              MetroMind AI
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#787774] md:text-lg text-pretty">
              Real-time operations twin for the Kochi Metro. Observe network state, predict pressure, recommend action.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Pill variant={simulatedState ? "yellow" : "green"}>
                {modeLabel ?? "Live twin"}
              </Pill>
              <Pill variant="neutral">REST + JSON</Pill>
            </div>
          </header>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
          <ScrollReveal delay={80}>
            <nav className="card p-3" aria-label="Operations views">
              <div className="mb-3 flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#787774]">
                <WarningCircle size={14} />
                Views
              </div>
              <div className="space-y-1">
                {views.map((view) => {
                  const Icon = iconMap[view];
                  const isActive = activeView === view;
                  return (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${
                        isActive
                          ? "bg-[#111111] text-white"
                          : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]"
                      }`}
                    >
                      <Icon size={16} />
                      {view}
                    </button>
                  );
                })}
              </div>
            </nav>
          </ScrollReveal>

          <section className="min-w-0">
            {query.isLoading ? <LoadingState /> : null}
            {query.isError ? <ErrorState /> : null}
            {state ? <View activeView={activeView} state={state} /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function View({ activeView, state }: { activeView: string; state: CityState }) {
  if (activeView === "Dashboard") return <Dashboard state={state} />;
  if (activeView === "Map") return <MapPanel state={state} />;
  if (activeView === "Predictions") return <Predictions state={state} />;
  if (activeView === "Simulator") return <Simulator state={state} />;
  return <Copilot />;
}

function LoadingState() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-lg border border-[#EAEAEA] bg-white p-6">
          <div className="mb-3 h-3 w-16 rounded bg-[#F0F0EF]" />
          <div className="h-7 w-24 rounded bg-[#F0F0EF]" />
          <div className="mt-4 h-3 w-32 rounded bg-[#F0F0EF]" />
        </div>
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <Card>
      <h2 className="text-lg font-medium text-[#111111]">Backend unavailable</h2>
      <p className="mt-2 text-sm text-[#787774] text-pretty">
        Start the FastAPI server on port 8000, then refresh the dashboard.
      </p>
      <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>
        Refresh
      </Button>
    </Card>
  );
}

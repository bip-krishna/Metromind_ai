import { create } from "zustand";
import type { CityState } from "@/lib/types";

type ViewName = "Dashboard" | "Map" | "Predictions" | "Simulator" | "AI Copilot";

interface MetroMindStore {
  activeView: ViewName;
  simulatedState: CityState | null;
  modeLabel: string | null;
  setActiveView: (view: ViewName) => void;
  setSimulatedState: (state: CityState | null, label?: string | null) => void;
}

export const useMetroMindStore = create<MetroMindStore>((set) => ({
  activeView: "Dashboard",
  simulatedState: null,
  modeLabel: null,
  setActiveView: (activeView) => set({ activeView }),
  setSimulatedState: (simulatedState, modeLabel = null) => set({ simulatedState, modeLabel })
}));

export const views: ViewName[] = ["Dashboard", "Map", "Predictions", "Simulator", "AI Copilot"];

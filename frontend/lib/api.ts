import type { CityState, OperationsReport } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchState(): Promise<CityState> {
  const response = await fetch(`${API_BASE_URL}/state`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load MetroMind state");
  }
  return response.json();
}

export async function simulateScenario(input: {
  scenario: string;
  station_id?: string;
  time_horizon_minutes: number;
}): Promise<CityState> {
  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error("Simulation failed");
  }
  return response.json();
}

export async function fetchForecast(horizonMinutes: number): Promise<CityState> {
  const response = await fetch(`${API_BASE_URL}/forecast/${horizonMinutes}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Forecast failed");
  }
  return response.json();
}

export async function refreshWeather(): Promise<CityState> {
  const response = await fetch(`${API_BASE_URL}/weather/refresh`, {
    method: "POST",
    headers: {"Content-Type": "application/json"}
  });
  if (!response.ok) {
    throw new Error("Weather refresh failed");
  }
  await response.json();
  return fetchState();
}

export async function generateReport(): Promise<OperationsReport> {
  const response = await fetch(`${API_BASE_URL}/report`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Report generation failed");
  }
  return response.json();
}

export async function generateAiReport(): Promise<OperationsReport & { briefing: string; provider: string }> {
  const response = await fetch(`${API_BASE_URL}/report/ai`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("AI report generation failed");
  }
  return response.json();
}

export async function askCopilot(message: string): Promise<{ answer: string; provider: string }> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message })
  });
  if (!response.ok) {
    throw new Error("Copilot is unavailable");
  }
  return response.json();
}

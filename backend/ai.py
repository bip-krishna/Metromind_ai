from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import httpx


SYSTEM_PROMPT = (
    "You are the Kochi Metro Operations Control Officer issuing an official operational note. "
    "Never invent facts. Answer only using supplied Digital Twin data. "
    "Use formal incident-command language. Structure responses with: Situation, Assessment, Directive, "
    "Priority, Responsible unit, Timeline, and Rationale. "
    "Directives must be action-oriented and suitable for a control-room log. "
    "Explain predictions and recommendations using supplied drivers only. "
    "If information is unavailable, explicitly state that the data is unavailable."
)


class AICopilotService:
    def __init__(self) -> None:
        self._load_env_file()
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    async def answer(self, message: str, state: dict[str, Any]) -> dict[str, Any]:
        context = self._compact_context(state)
        if not self.api_key:
            return {"answer": self._fallback_answer(message, context), "provider": "local"}

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": f"Digital Twin data: {context}\n\nQuestion: {message}",
                        },
                    ],
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()
        payload = response.json()
        return {"answer": payload["choices"][0]["message"]["content"], "provider": "groq"}

    def _compact_context(self, state: dict[str, Any]) -> dict[str, Any]:
        return {
            "network_health": state["network_health"],
            "weather": state["weather"],
            "stations": [
                {
                    "name": station["name"],
                    "passengers": station["passenger_occupancy"],
                    "traffic": station["traffic_index"],
                    "parking": station["parking_occupancy"],
                    "weather": station["weather_severity"],
                    "incident": station["incident_severity"],
                    "health": station["health_status"],
                }
                for station in state["stations"]
            ],
            "alerts": state["alerts"][:8],
            "recommendations": state["recommendations"][:8],
            "predictions": state["predictions"][:10],
        }

    def _load_env_file(self) -> None:
        env_path = Path(__file__).resolve().parents[1] / ".env"
        if not env_path.exists():
            return
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

    def _fallback_answer(self, message: str, context: dict[str, Any]) -> str:
        critical = context["network_health"]["critical_stations"]
        top_alerts = context["alerts"][:3]
        top_recs = context["recommendations"][:3]
        station_hint = next(
            (
                station
                for station in context["stations"]
                if station["name"].lower() in message.lower()
            ),
            None,
        )
        if station_hint:
            return (
                f"Situation: {station_hint['name']} is currently classified as {station_hint['health']}.\n"
                f"Assessment: Passenger occupancy is {station_hint['passengers']:.0%}, traffic pressure is "
                f"{station_hint['traffic']:.0%}, parking utilization is {station_hint['parking']:.0%}, "
                f"and incident severity is {station_hint['incident']:.0%}.\n"
                "Directive: Maintain station-level monitoring and assign field staff if passenger or incident "
                "severity crosses the active alert threshold.\n"
                "Responsible unit: Station operations controller.\n"
                "Timeline: Immediate review; continue monitoring through the current forecast window.\n"
                "Rationale: This assessment uses only the current digital twin values."
            )
        return (
            f"Situation: Network health is {context['network_health']['score']}%.\n"
            f"Assessment: Critical stations: {', '.join(critical) if critical else 'none'}. "
            f"Active issues: {', '.join(alert['title'] + ' at ' + alert['station_name'] for alert in top_alerts) or 'none'}.\n"
            f"Directive: {', '.join(rec['action'] + ' at ' + rec['station_name'] for rec in top_recs) or 'No immediate directive required'}.\n"
            "Responsible unit: Operations control room with station supervisors.\n"
            "Timeline: Immediate for high-priority items; otherwise continue monitoring in the current forecast cycle.\n"
            "Rationale: Directives are derived from current alerts, predictions, and recommendations in the digital twin."
        )

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ai import AICopilotService
from digital_twin import ChatRequest, DigitalTwinService, SimulationRequest, UpdateRequest

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="MetroMind AI API",
    description="Digital Twin and Operations Copilot APIs for Kochi Metro operations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

digital_twin = DigitalTwinService()
ai_copilot = AICopilotService()


@app.on_event("startup")
def startup() -> None:
    digital_twin.initialize()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/state")
@app.get("/city-state")
def get_state() -> dict:
    return digital_twin.get_state()


@app.get("/stations")
def get_stations() -> list[dict]:
    return digital_twin.get_state()["stations"]


@app.get("/predictions")
def get_predictions() -> list[dict]:
    return digital_twin.get_state()["predictions"]


@app.get("/forecast/{horizon_minutes}")
def get_forecast(horizon_minutes: int) -> dict:
    if horizon_minutes not in {0, 15, 30, 60, 120}:
        raise HTTPException(status_code=400, detail="Use horizon 0, 15, 30, 60, or 120 minutes")
    if horizon_minutes == 0:
        return digital_twin.get_state()
    return digital_twin.forecast_state(horizon_minutes)


@app.get("/recommendations")
def get_recommendations() -> list[dict]:
    return digital_twin.get_state()["recommendations"]


@app.get("/alerts")
def get_alerts() -> list[dict]:
    return digital_twin.get_state()["alerts"]


@app.get("/weather")
def get_weather() -> dict:
    return digital_twin.get_state()["weather"]


@app.get("/report")
def get_report() -> dict:
    return digital_twin.generate_report()


@app.post("/weather/refresh")
def refresh_weather() -> dict:
    return digital_twin.refresh_weather()


@app.post("/simulate")
def simulate(request: SimulationRequest) -> dict:
    try:
        return digital_twin.simulate(request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/update")
def update_station(request: UpdateRequest) -> dict:
    try:
        return digital_twin.update_station(request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/chat")
async def chat(request: ChatRequest) -> dict:
    try:
        return await ai_copilot.answer(request.message, digital_twin.get_state())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Copilot unavailable: {exc}") from exc

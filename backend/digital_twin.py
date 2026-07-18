from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import httpx
from pydantic import BaseModel, Field

from predictor import PredictionService, clamp, station_health

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
KOCHI_LATITUDE = 9.9312
KOCHI_LONGITUDE = 76.2673
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class SimulationRequest(BaseModel):
    scenario: str = Field(..., examples=["Heavy Rain"])
    station_id: Optional[str] = Field(default=None, examples=["kaloor"])
    time_horizon_minutes: int = Field(default=60, ge=15, le=120)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=800)


class UpdateRequest(BaseModel):
    station_id: str
    passenger_occupancy: Optional[float] = Field(default=None, ge=0, le=1)
    traffic_index: Optional[float] = Field(default=None, ge=0, le=1)
    parking_occupancy: Optional[float] = Field(default=None, ge=0, le=1)
    weather_severity: Optional[float] = Field(default=None, ge=0, le=1)
    incident_severity: Optional[float] = Field(default=None, ge=0, le=1)


class DigitalTwinService:
    def __init__(self, data_dir: Path = DATA_DIR) -> None:
        self.data_dir = data_dir
        self.predictor = PredictionService()
        self.state: dict[str, Any] = {}

    def initialize(self) -> dict[str, Any]:
        logger.info("Initializing MetroMind digital twin")
        self.state = {
            "stations": self.load_stations(),
            "route": self._load_json("route.geojson"),
            "parking": self.load_parking(),
            "traffic": self.load_traffic(),
            "weather": self.load_weather(),
            "events": self.load_events(),
            "historical_ridership": self._load_json("historical_ridership.json"),
            "trains": self._load_json("train_positions.json"),
            "train_schedule": self._load_json("train_schedule.json"),
            "incidents": self._load_json("incidents.json"),
            "alerts": self._load_json("alerts.json"),
            "recommendations": self._load_json("recommendations.json"),
            "generated_at": datetime.now().isoformat(),
        }
        self._merge_layers()
        self._recalculate()
        self.save_state()
        return self.state

    def load_stations(self) -> list[dict[str, Any]]:
        return self._load_json("stations.json")

    def load_traffic(self) -> list[dict[str, Any]]:
        return self._load_json("traffic.json")

    def load_weather(self) -> dict[str, Any]:
        fallback = self._load_json("weather.json")
        if os.getenv("METROMIND_LIVE_WEATHER", "true").lower() in {"0", "false", "no"}:
            return {**fallback, "source": fallback.get("source", "mock"), "live_available": False}
        return self._fetch_live_weather(fallback)

    def load_events(self) -> list[dict[str, Any]]:
        return self._load_json("events.json")

    def load_parking(self) -> list[dict[str, Any]]:
        return self._load_json("parking.json")

    def update_station(self, update: UpdateRequest) -> dict[str, Any]:
        if not self.state:
            self.initialize()
        station = self._find_station(update.station_id, self.state)
        update_data = update.model_dump(exclude_none=True, exclude={"station_id"})
        station.update(update_data)
        self._recalculate()
        self.save_state()
        return station

    def update_train(self, train_id: str, fields: dict[str, Any]) -> dict[str, Any]:
        if not self.state:
            self.initialize()
        for train in self.state["trains"]:
            if train["id"] == train_id:
                train.update(fields)
                self._recalculate()
                self.save_state()
                return train
        raise KeyError(f"Train {train_id} not found")

    def update_parking(self, station_id: str, occupied: int) -> dict[str, Any]:
        if not self.state:
            self.initialize()
        for parking in self.state["parking"]:
            if parking["station_id"] == station_id:
                parking["occupied"] = max(0, min(parking["capacity"], occupied))
                self._merge_layers()
                self._recalculate()
                self.save_state()
                return parking
        raise KeyError(f"Parking for {station_id} not found")

    def save_state(self) -> None:
        target = self.data_dir / "city_state.json"
        target.write_text(json.dumps(self.state, indent=2), encoding="utf-8")

    def get_state(self) -> dict[str, Any]:
        if not self.state:
            return self.initialize()
        return self.state

    def forecast_state(self, horizon_minutes: int) -> dict[str, Any]:
        if not self.state:
            self.initialize()
        forecast = json.loads(json.dumps(self.state))
        forecast["predictions"] = self.predictor.predict_all(forecast, horizon_minutes)
        self._apply_predictions_to_station_state(forecast)
        self._recalculate(forecast, horizon_minutes=horizon_minutes)
        forecast["mode"] = {
            "type": "forecast",
            "time_horizon_minutes": horizon_minutes,
        }
        return forecast

    def refresh_weather(self) -> dict[str, Any]:
        if not self.state:
            self.initialize()
        self.state["weather"] = self.load_weather()
        self._merge_layers()
        self._recalculate()
        self.save_state()
        return self.state["weather"]

    def generate_report(self) -> dict[str, Any]:
        if not self.state:
            self.initialize()
        state = self.get_state()
        top_predictions = sorted(
            state["predictions"], key=lambda item: item["health_score"], reverse=True
        )[:3]
        critical_alerts = [alert for alert in state["alerts"] if alert["level"] == "Critical"]
        recommendations = state["recommendations"][:5]
        report_id = f"KMRCL-OPS-{datetime.now().strftime('%Y%m%d-%H%M')}"
        summary_lines = [
            f"Network health stands at {state['network_health']['score']}%.",
            f"{len(critical_alerts)} critical alerts are active.",
            "Highest-risk stations: "
            + ", ".join(item["station_name"] for item in top_predictions)
            + ".",
        ]
        directives = [
            {
                "station": item["station_name"],
                "issue": item.get("issue", "Operational issue"),
                "directive": item.get("directive", item["action"]),
                "priority": item["priority"],
                "owner": item.get("owner", "Operations Control"),
                "timeline": item.get("timeline", "Immediate review"),
                "confidence": item["confidence"],
            }
            for item in recommendations
        ]
        return {
            "report_id": report_id,
            "generated_at": datetime.now().isoformat(),
            "classification": "Operations Control Brief",
            "summary": summary_lines,
            "weather": state["weather"],
            "critical_alerts": critical_alerts,
            "directives": directives,
            "forecast_watchlist": top_predictions,
        }

    def simulate(self, request: SimulationRequest) -> dict[str, Any]:
        if not self.state:
            self.initialize()
        simulated = self.predictor.simulate(
            self.state,
            request.scenario,  # type: ignore[arg-type]
            request.station_id,
            request.time_horizon_minutes,
        )
        self._recalculate(simulated)
        return simulated

    def _load_json(self, filename: str) -> Any:
        path = self.data_dir / filename
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            logger.exception("Dataset %s missing", filename)
            raise RuntimeError(f"Required dataset missing: {filename}") from exc
        except json.JSONDecodeError as exc:
            logger.exception("Dataset %s contains invalid JSON", filename)
            raise RuntimeError(f"Invalid JSON dataset: {filename}") from exc

    def _fetch_live_weather(self, fallback: dict[str, Any]) -> dict[str, Any]:
        params = {
            "latitude": KOCHI_LATITUDE,
            "longitude": KOCHI_LONGITUDE,
            "current": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "precipitation",
                    "rain",
                    "showers",
                    "weather_code",
                    "cloud_cover",
                    "wind_speed_10m",
                    "wind_gusts_10m",
                ]
            ),
            "hourly": "precipitation_probability",
            "forecast_days": 1,
            "timezone": "Asia/Kolkata",
            "wind_speed_unit": "kmh",
        }
        try:
            response = httpx.get(OPEN_METEO_URL, params=params, timeout=8)
            response.raise_for_status()
            payload = response.json()
            current = payload["current"]
            rain_probability = self._current_precipitation_probability(payload)
            weather_code = int(current.get("weather_code", 0))
            precipitation = float(current.get("precipitation", 0) or 0)
            rain = float(current.get("rain", 0) or 0)
            showers = float(current.get("showers", 0) or 0)
            wind_gusts = float(current.get("wind_gusts_10m", 0) or 0)
            severity = self._weather_severity(
                rain_probability=rain_probability,
                precipitation=precipitation + rain + showers,
                wind_gusts=wind_gusts,
                weather_code=weather_code,
            )
            return {
                "condition": self._weather_condition(weather_code),
                "temperature_c": round(float(current.get("temperature_2m", 0) or 0), 1),
                "apparent_temperature_c": round(
                    float(current.get("apparent_temperature", 0) or 0), 1
                ),
                "humidity_percent": int(current.get("relative_humidity_2m", 0) or 0),
                "rain_probability": rain_probability,
                "precipitation_mm": round(precipitation + rain + showers, 2),
                "cloud_cover_percent": int(current.get("cloud_cover", 0) or 0),
                "wind_kph": round(float(current.get("wind_speed_10m", 0) or 0), 1),
                "wind_gust_kph": round(wind_gusts, 1),
                "weather_code": weather_code,
                "severity": severity,
                "source": "open-meteo",
                "live_available": True,
                "location": {
                    "name": "Kochi, Kerala",
                    "latitude": KOCHI_LATITUDE,
                    "longitude": KOCHI_LONGITUDE,
                },
                "updated_at": current.get("time", datetime.now().isoformat()),
                "fetched_at": datetime.now().isoformat(),
            }
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            logger.warning("Live weather unavailable, using fallback weather.json: %s", exc)
            return {
                **fallback,
                "source": fallback.get("source", "mock"),
                "live_available": False,
                "fallback_reason": str(exc),
                "fetched_at": datetime.now().isoformat(),
            }

    def _current_precipitation_probability(self, payload: dict[str, Any]) -> float:
        hourly = payload.get("hourly", {})
        probabilities = hourly.get("precipitation_probability") or []
        times = hourly.get("time") or []
        current_time = payload.get("current", {}).get("time")
        if current_time in times:
            index = times.index(current_time)
            return clamp(float(probabilities[index] or 0) / 100)
        if probabilities:
            return clamp(float(probabilities[0] or 0) / 100)
        return 0.0

    def _weather_severity(
        self, rain_probability: float, precipitation: float, wind_gusts: float, weather_code: int
    ) -> float:
        code_severity = self._weather_code_severity(weather_code)
        return clamp(
            rain_probability * 0.35
            + clamp(precipitation / 20) * 0.25
            + clamp(wind_gusts / 60) * 0.2
            + code_severity * 0.2
        )

    def _weather_condition(self, weather_code: int) -> str:
        if weather_code == 0:
            return "Clear sky"
        if weather_code in {1, 2, 3}:
            return "Partly cloudy"
        if weather_code in {45, 48}:
            return "Fog"
        if weather_code in {51, 53, 55, 56, 57}:
            return "Drizzle"
        if weather_code in {61, 63, 65, 66, 67, 80, 81, 82}:
            return "Rain"
        if weather_code in {71, 73, 75, 77, 85, 86}:
            return "Snow"
        if weather_code in {95, 96, 99}:
            return "Thunderstorm"
        return "Weather data available"

    def _weather_code_severity(self, weather_code: int) -> float:
        if weather_code in {95, 96, 99}:
            return 1.0
        if weather_code in {65, 67, 82, 86}:
            return 0.85
        if weather_code in {63, 66, 80, 81, 73, 75, 85}:
            return 0.65
        if weather_code in {51, 53, 55, 56, 57, 61, 71, 77, 45, 48}:
            return 0.4
        if weather_code in {1, 2, 3}:
            return 0.18
        return 0.05

    def _merge_layers(self) -> None:
        parking = {item["station_id"]: item for item in self.state["parking"]}
        traffic = {item["station_id"]: item for item in self.state["traffic"]}
        incidents = {item["station_id"]: item for item in self.state["incidents"]}
        weather_severity = self.state["weather"]["severity"]

        for station in self.state["stations"]:
            station_parking = parking.get(station["id"])
            if station_parking:
                station["parking_occupancy"] = clamp(
                    station_parking["occupied"] / station_parking["capacity"]
                )
            station_traffic = traffic.get(station["id"])
            if station_traffic:
                station["traffic_index"] = station_traffic["congestion"]
            station["weather_severity"] = max(station["weather_severity"], weather_severity)
            station["incident_severity"] = incidents.get(station["id"], {}).get(
                "severity", station["incident_severity"]
            )

    def _recalculate(self, state: dict[str, Any] | None = None, horizon_minutes: int = 60) -> None:
        target = state if state is not None else self.state
        for station in target["stations"]:
            health = station_health(station)
            station["health_score"] = health["score"]
            station["health_status"] = health["status"]

        target["predictions"] = self.predictor.predict_all(target, horizon_minutes)
        target["recommendations"] = self._generate_recommendations(target)
        target["alerts"] = self._generate_alerts(target)
        target["network_health"] = self._network_health(target)
        target["generated_at"] = datetime.now().isoformat()

    def _apply_predictions_to_station_state(self, state: dict[str, Any]) -> None:
        predictions = {item["station_id"]: item for item in state["predictions"]}
        for station in state["stations"]:
            prediction = predictions[station["id"]]
            station["passenger_occupancy"] = prediction["passenger_occupancy"]
            station["traffic_index"] = prediction["traffic_index"]
            station["parking_occupancy"] = prediction["parking_occupancy"]

    def _generate_recommendations(self, state: dict[str, Any]) -> list[dict[str, Any]]:
        recommendations: list[dict[str, Any]] = []
        predictions = {item["station_id"]: item for item in state["predictions"]}
        for station in state["stations"]:
            prediction = predictions[station["id"]]
            if prediction["passenger_occupancy"] > 0.9:
                recommendations.append(
                    self._recommendation(
                        station,
                        "Deploy additional platform marshals",
                        "High",
                        "Passenger forecast exceeds 90%; uncontrolled platform buildup is likely.",
                        "Reduce platform dwell time and maintain safe passenger circulation.",
                        0.88,
                        issue="Passenger overcrowding risk",
                        owner="Station Controller and Platform Supervisor",
                        timeline="Within 10 minutes",
                    )
                )
            if prediction["parking_occupancy"] > 0.95:
                recommendations.append(
                    self._recommendation(
                        station,
                        "Activate overflow parking protocol",
                        "Medium",
                        "Parking forecast exceeds 95%; queue spillback may affect station approach roads.",
                        "Preserve station access and prevent road-side congestion near entry gates.",
                        0.82,
                        issue="Parking saturation risk",
                        owner="Parking Operations Lead",
                        timeline="Within 20 minutes",
                    )
                )
            if station["weather_severity"] > 0.7:
                recommendations.append(
                    self._recommendation(
                        station,
                        "Issue passenger rain advisory",
                        "Medium",
                        "Weather severity is above the heavy rain threshold.",
                        "Improve passenger preparedness and rebalance entry staff before demand rises.",
                        0.8,
                        issue="Weather-driven demand and access risk",
                        owner="Control Room Communications",
                        timeline="Immediately",
                    )
                )
            if station["incident_severity"] > 0.8:
                recommendations.append(
                    self._recommendation(
                        station,
                        "Notify emergency response team",
                        "Critical",
                        "Incident severity exceeds the emergency response threshold.",
                        "Accelerate response, isolate affected area, and prevent passenger exposure.",
                        0.93,
                        issue="Critical station incident",
                        owner="Emergency Response Coordinator",
                        timeline="Immediate dispatch",
                    )
                )
        for train in state["trains"]:
            if train["delay_minutes"] >= 5:
                station = self._find_station(train["station_id"], state)
                recommendations.append(
                    self._recommendation(
                        station,
                        "Initiate platform delay communication",
                        "High",
                        f"Train {train['id']} is delayed by {train['delay_minutes']} minutes.",
                        "Reduce passenger uncertainty and prevent secondary crowding.",
                        0.84,
                        issue="Train delay passenger buildup",
                        owner="Train Controller and Station Announcer",
                        timeline="Immediately; repeat every 5 minutes",
                    )
                )
        return recommendations

    def _generate_alerts(self, state: dict[str, Any]) -> list[dict[str, Any]]:
        alerts: list[dict[str, Any]] = []
        for station in state["stations"]:
            if station["passenger_occupancy"] >= 0.9:
                alerts.append(self._alert(station, "Passenger overflow", "Critical"))
            elif station["passenger_occupancy"] >= 0.8:
                alerts.append(self._alert(station, "Station crowded", "High"))
            if station["parking_occupancy"] >= 0.95:
                alerts.append(self._alert(station, "Parking full", "High"))
            if station["weather_severity"] >= 0.7:
                alerts.append(self._alert(station, "Heavy rain", "Medium"))
            if station["incident_severity"] >= 0.8:
                alerts.append(self._alert(station, "Infrastructure or emergency incident", "Critical"))
        for train in state["trains"]:
            if train["delay_minutes"] >= 5:
                station = self._find_station(train["station_id"], state)
                alerts.append(self._alert(station, f"Train delay: {train['id']}", "High"))
        return alerts

    def _network_health(self, state: dict[str, Any]) -> dict[str, Any]:
        average_risk = sum(station["health_score"] for station in state["stations"]) / len(
            state["stations"]
        )
        return {
            "score": round((1 - average_risk) * 100, 1),
            "risk": round(average_risk, 4),
            "critical_stations": [
                station["name"] for station in state["stations"] if station["health_status"] == "critical"
            ],
        }

    def _recommendation(
        self,
        station: dict[str, Any],
        action: str,
        priority: str,
        reason: str,
        impact: str,
        confidence: float,
        issue: str,
        owner: str,
        timeline: str,
    ) -> dict[str, Any]:
        return {
            "id": f"REC-{station['id']}-{action.lower().replace(' ', '-')}",
            "station_id": station["id"],
            "station_name": station["name"],
            "issue": issue,
            "action": action,
            "directive": action,
            "priority": priority,
            "reason": reason,
            "expected_impact": impact,
            "owner": owner,
            "timeline": timeline,
            "confidence": confidence,
        }

    def _alert(self, station: dict[str, Any], title: str, level: str) -> dict[str, Any]:
        return {
            "id": f"ALERT-{station['id']}-{title.lower().replace(' ', '-')}",
            "station_id": station["id"],
            "station_name": station["name"],
            "title": title,
            "level": level,
            "created_at": datetime.now().isoformat(),
        }

    def _find_station(self, station_id: str, state: dict[str, Any]) -> dict[str, Any]:
        for station in state["stations"]:
            if station["id"] == station_id:
                return station
        raise KeyError(f"Station {station_id} not found")

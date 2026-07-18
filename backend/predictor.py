from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from math import exp
from typing import Any, Literal


ScenarioName = Literal[
    "Heavy Rain",
    "Football Match",
    "Train Delay",
    "Power Failure",
    "Station Closure",
    "Festival",
    "Maintenance",
    "VIP Movement",
]


def clamp(value: float) -> float:
    return max(0.0, min(1.0, round(value, 4)))


def station_health(station: dict[str, Any]) -> dict[str, Any]:
    score = clamp(
        0.35 * station["passenger_occupancy"]
        + 0.20 * station["traffic_index"]
        + 0.15 * station["parking_occupancy"]
        + 0.10 * station["weather_severity"]
        + 0.20 * station["incident_severity"]
    )
    if score >= 0.78:
        status = "critical"
    elif score >= 0.55:
        status = "warning"
    else:
        status = "healthy"
    return {"score": score, "status": status}


class PredictionService:
    def predict_all(self, state: dict[str, Any], horizon_minutes: int = 60) -> list[dict[str, Any]]:
        station_index = {station["id"]: station for station in state["stations"]}
        trends = {item["station_id"]: item for item in state["historical_ridership"]}
        events = state.get("events", [])
        train_pressure = self._train_delay_pressure(state)
        propagated_load = self._propagate_network_pressure(station_index)
        predictions: list[dict[str, Any]] = []

        for station in state["stations"]:
            components = self.prediction_components(
                station,
                station_index,
                trends,
                events,
                train_pressure,
                propagated_load,
                horizon_minutes,
            )
            passenger = components["passenger_occupancy"]
            traffic = self.predict_traffic(station, passenger, components["weather_effect"])
            parking = self.predict_parking(station, passenger, components["event_effect"])
            predicted_station = {
                **station,
                "passenger_occupancy": passenger,
                "traffic_index": traffic,
                "parking_occupancy": parking,
            }
            health = station_health(predicted_station)
            crowding = self.predict_crowding(passenger)
            predictions.append(
                {
                    "station_id": station["id"],
                    "station_name": station["name"],
                    "horizon_minutes": horizon_minutes,
                    "passenger_occupancy": passenger,
                    "traffic_index": traffic,
                    "parking_occupancy": parking,
                    "health_score": health["score"],
                    "health_status": health["status"],
                    "crowding": crowding,
                    "confidence": self._confidence(station, components, events),
                    "model": "operations-ensemble-v2",
                    "components": components,
                    "drivers": self._drivers(station, passenger, parking, components),
                }
            )
        return predictions

    def predict_passenger(
        self,
        station: dict[str, Any],
        station_index: dict[str, dict[str, Any]],
        trends: dict[str, dict[str, Any]],
        events: list[dict[str, Any]],
        horizon_minutes: int,
    ) -> float:
        components = self.prediction_components(
            station,
            station_index,
            trends,
            events,
            {},
            self._propagate_network_pressure(station_index),
            horizon_minutes,
        )
        return components["passenger_occupancy"]

    def prediction_components(
        self,
        station: dict[str, Any],
        station_index: dict[str, dict[str, Any]],
        trends: dict[str, dict[str, Any]],
        events: list[dict[str, Any]],
        train_pressure: dict[str, float],
        propagated_load: dict[str, float],
        horizon_minutes: int,
    ) -> dict[str, Any]:
        horizon_factor = max(0.25, min(2.0, horizon_minutes / 60))
        historical = trends.get(station["id"], {})
        baseline = historical.get("baseline", station["passenger_occupancy"])
        trend = historical.get("trend", 0.02)
        time_profile = self._time_of_day_profile(horizon_minutes)
        historical_effect = ((baseline - station["passenger_occupancy"]) * 0.2 + trend) * time_profile
        weather_effect = self._weather_effect(station["weather_severity"], horizon_factor)
        event_effect = self._event_effect(station, station_index, events, horizon_factor)
        neighbour_effect = propagated_load.get(station["id"], 0.0)
        train_effect = train_pressure.get(station["id"], 0.0) * horizon_factor
        traffic_effect = self._traffic_to_metro_effect(station, station_index, horizon_factor)
        incident_effect = station["incident_severity"] * 0.08 * horizon_factor
        raw_prediction = (
            station["passenger_occupancy"]
            + historical_effect
            + weather_effect
            + event_effect
            + neighbour_effect
            + train_effect
            + traffic_effect
            + incident_effect
        )
        passenger = self._capacity_damped(raw_prediction)
        metro_stress_feedback = self._metro_to_traffic_feedback(station, passenger)
        return {
            "passenger_occupancy": passenger,
            "current": station["passenger_occupancy"],
            "historical_effect": round(historical_effect, 4),
            "time_profile": round(time_profile, 4),
            "weather_effect": round(weather_effect, 4),
            "event_effect": round(event_effect, 4),
            "neighbour_effect": round(neighbour_effect, 4),
            "train_delay_effect": round(train_effect, 4),
            "traffic_effect": round(traffic_effect, 4),
            "metro_stress_feedback": round(metro_stress_feedback, 4),
            "incident_effect": round(incident_effect, 4),
            "capacity_damping": round(max(0.0, raw_prediction - passenger), 4),
        }

    def predict_traffic(
        self, station: dict[str, Any], passenger_prediction: float, weather_effect: float = 0.0
    ) -> float:
        passenger_increase = max(0.0, passenger_prediction - station["passenger_occupancy"])
        metro_stress_feedback = self._metro_to_traffic_feedback(station, passenger_prediction)
        return clamp(
            station["traffic_index"]
            + station["weather_severity"] * 0.05
            + weather_effect * 0.45
            + passenger_increase * 0.2
            + metro_stress_feedback
        )

    def predict_parking(
        self, station: dict[str, Any], passenger_prediction: float, event_effect: float = 0.0
    ) -> float:
        passenger_increase = max(0.0, passenger_prediction - station["passenger_occupancy"])
        parking_elasticity = 0.36 if station["parking_occupancy"] < 0.9 else 0.22
        return clamp(station["parking_occupancy"] + parking_elasticity * passenger_increase + event_effect * 0.12)

    def predict_station_health(self, station: dict[str, Any]) -> dict[str, Any]:
        return station_health(station)

    def predict_crowding(self, passenger_prediction: float) -> str:
        if passenger_prediction >= 0.9:
            return "severe"
        if passenger_prediction >= 0.75:
            return "high"
        if passenger_prediction >= 0.55:
            return "moderate"
        return "normal"

    def simulate(
        self,
        state: dict[str, Any],
        scenario: ScenarioName,
        station_id: str | None = None,
        horizon_minutes: int = 60,
    ) -> dict[str, Any]:
        simulated = deepcopy(state)
        stations = simulated["stations"]
        target_ids = {station_id} if station_id else {station["id"] for station in stations}

        for station in stations:
            is_target = station["id"] in target_ids
            if scenario == "Heavy Rain":
                station["weather_severity"] = clamp(station["weather_severity"] + 0.35)
                station["traffic_index"] = clamp(station["traffic_index"] + 0.18)
                station["passenger_occupancy"] = clamp(station["passenger_occupancy"] + 0.08)
            elif scenario == "Football Match" and (is_target or station["id"] in {"kaloor", "edappally"}):
                station["passenger_occupancy"] = clamp(station["passenger_occupancy"] + 0.22)
                station["traffic_index"] = clamp(station["traffic_index"] + 0.16)
                station["parking_occupancy"] = clamp(station["parking_occupancy"] + 0.18)
            elif scenario == "Train Delay" and is_target:
                station["passenger_occupancy"] = clamp(station["passenger_occupancy"] + 0.18)
                station["incident_severity"] = clamp(station["incident_severity"] + 0.2)
            elif scenario == "Power Failure" and is_target:
                station["incident_severity"] = clamp(station["incident_severity"] + 0.55)
                station["passenger_occupancy"] = clamp(station["passenger_occupancy"] + 0.12)
            elif scenario == "Station Closure" and is_target:
                station["incident_severity"] = 1.0
                station["passenger_occupancy"] = clamp(station["passenger_occupancy"] + 0.1)
            elif scenario == "Festival" and (is_target or station["id"] in {"mg_road", "maharajas"}):
                station["passenger_occupancy"] = clamp(station["passenger_occupancy"] + 0.16)
                station["traffic_index"] = clamp(station["traffic_index"] + 0.14)
            elif scenario == "Maintenance" and is_target:
                station["incident_severity"] = clamp(station["incident_severity"] + 0.25)
            elif scenario == "VIP Movement" and is_target:
                station["traffic_index"] = clamp(station["traffic_index"] + 0.2)

        simulated["scenario"] = {
            "name": scenario,
            "station_id": station_id,
            "time_horizon_minutes": horizon_minutes,
        }
        simulated["predictions"] = self.predict_all(simulated, horizon_minutes)
        return simulated

    def _drivers(
        self,
        station: dict[str, Any],
        passenger_prediction: float,
        parking_prediction: float,
        components: dict[str, Any],
    ) -> list[str]:
        drivers: list[str] = []
        if components["event_effect"] > 0.05:
            drivers.append("Nearby event demand")
        if components["neighbour_effect"] > 0.04:
            drivers.append("Network spillover from adjacent stations")
        if components["train_delay_effect"] > 0.03:
            drivers.append("Train delay platform buildup")
        if components["weather_effect"] > 0.04:
            drivers.append("Weather-driven demand shift")
        if components["traffic_effect"] > 0.03:
            drivers.append("Road congestion diverting demand to metro")
        if components["metro_stress_feedback"] > 0.03:
            drivers.append("Metro stress increasing station-area road pressure")
        if passenger_prediction - station["passenger_occupancy"] > 0.12 and not drivers:
            drivers.append("Combined operating pressure")
        if station["weather_severity"] > 0.7:
            drivers.append("High weather severity")
        if parking_prediction > 0.9:
            drivers.append("Parking saturation")
        if station["traffic_index"] > 0.8:
            drivers.append("Road congestion")
        return drivers or ["Stable operating pattern"]

    def _time_of_day_profile(self, horizon_minutes: int) -> float:
        future_hour = (datetime.now().hour + horizon_minutes / 60) % 24
        morning_peak = exp(-((future_hour - 9) ** 2) / 5.5)
        evening_peak = exp(-((future_hour - 18.5) ** 2) / 6.5)
        late_night_discount = 0.55 if future_hour < 5 or future_hour > 23 else 1.0
        return round((0.78 + 0.42 * max(morning_peak, evening_peak)) * late_night_discount, 4)

    def _weather_effect(self, weather_severity: float, horizon_factor: float) -> float:
        if weather_severity < 0.2:
            return weather_severity * 0.025 * horizon_factor
        return (weather_severity**1.35) * 0.095 * horizon_factor

    def _event_effect(
        self,
        station: dict[str, Any],
        station_index: dict[str, dict[str, Any]],
        events: list[dict[str, Any]],
        horizon_factor: float,
    ) -> float:
        direct = sum(event["impact"] for event in events if event["station_id"] == station["id"])
        neighbour = 0.0
        for event in events:
            event_station_id = event["station_id"]
            if event_station_id in station["neighbours"]:
                event_station = station_index.get(event_station_id, {})
                shared_pressure = 0.35 if station["traffic_index"] > 0.7 else 0.25
                neighbour += event["impact"] * shared_pressure * (1 + event_station.get("passenger_occupancy", 0))
        return clamp((direct + neighbour) * min(1.4, horizon_factor))

    def _propagate_network_pressure(
        self, station_index: dict[str, dict[str, Any]], iterations: int = 2
    ) -> dict[str, float]:
        pressure = {station_id: station["passenger_occupancy"] for station_id, station in station_index.items()}
        for _ in range(iterations):
            next_pressure: dict[str, float] = {}
            for station_id, station in station_index.items():
                neighbours = [item for item in station["neighbours"] if item in pressure]
                if not neighbours:
                    next_pressure[station_id] = 0.0
                    continue
                neighbour_average = sum(pressure[item] for item in neighbours) / len(neighbours)
                overload = max(0.0, neighbour_average - 0.68)
                next_pressure[station_id] = overload * 0.18
            pressure = {
                station_id: station_index[station_id]["passenger_occupancy"] + effect
                for station_id, effect in next_pressure.items()
            }
        return {station_id: clamp(max(0.0, value - station_index[station_id]["passenger_occupancy"])) for station_id, value in pressure.items()}

    def _traffic_to_metro_effect(
        self,
        station: dict[str, Any],
        station_index: dict[str, dict[str, Any]],
        horizon_factor: float,
    ) -> float:
        local_congestion = max(0.0, station["traffic_index"] - 0.62)
        access_penalty = max(0.0, station["parking_occupancy"] - 0.88) * 0.35
        neighbours = [station_index[item] for item in station["neighbours"] if item in station_index]
        neighbour_congestion = (
            sum(max(0.0, item["traffic_index"] - 0.68) for item in neighbours) / len(neighbours)
            if neighbours
            else 0.0
        )
        modal_shift = local_congestion * 0.16 + neighbour_congestion * 0.08 - access_penalty
        return clamp(max(0.0, modal_shift) * min(1.35, horizon_factor))

    def _metro_to_traffic_feedback(self, station: dict[str, Any], passenger_prediction: float) -> float:
        station_exit_pressure = max(0.0, passenger_prediction - 0.78) * 0.14
        parking_search_pressure = max(0.0, station["parking_occupancy"] - 0.82) * 0.12
        incident_access_pressure = station["incident_severity"] * 0.08
        return clamp(station_exit_pressure + parking_search_pressure + incident_access_pressure)

    def _train_delay_pressure(self, state: dict[str, Any]) -> dict[str, float]:
        pressure: dict[str, float] = {}
        station_index = {station["id"]: station for station in state["stations"]}
        for train in state.get("trains", []):
            delay = train.get("delay_minutes", 0)
            if delay < 4:
                continue
            station_id = train["station_id"]
            delay_pressure = min(0.16, delay / 60)
            pressure[station_id] = pressure.get(station_id, 0.0) + delay_pressure
            for neighbour_id in station_index.get(station_id, {}).get("neighbours", []):
                pressure[neighbour_id] = pressure.get(neighbour_id, 0.0) + delay_pressure * 0.35
        return {station_id: clamp(value) for station_id, value in pressure.items()}

    def _capacity_damped(self, raw_prediction: float) -> float:
        if raw_prediction <= 0.88:
            return clamp(raw_prediction)
        overflow = raw_prediction - 0.88
        return clamp(0.88 + overflow * 0.55)

    def _confidence(
        self, station: dict[str, Any], components: dict[str, Any], events: list[dict[str, Any]]
    ) -> float:
        volatility = (
            abs(components["event_effect"]) * 0.35
            + abs(components["train_delay_effect"]) * 0.25
            + abs(components["traffic_effect"]) * 0.2
            + station["incident_severity"] * 0.18
            + station["weather_severity"] * 0.1
        )
        event_bonus = 0.03 if any(event["station_id"] == station["id"] for event in events) else 0.0
        return clamp(0.9 - volatility + event_bonus)

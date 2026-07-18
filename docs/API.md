# API Documentation

The FastAPI app exposes a compact REST surface for the digital twin.

## GET /state and /city-state

Returns the complete centralized digital twin:

- stations
- trains
- parking
- traffic
- weather
- events
- incidents
- predictions
- recommendations
- alerts
- network_health

## GET /stations

Returns station state including normalized passenger, traffic, parking, weather, incident, and health values.

## GET /predictions

Returns deterministic station forecasts. No machine learning or randomness is used.

## GET /recommendations

Returns operational recommendations generated from thresholds and predictions.

## GET /alerts

Returns current alerts sorted by severity.

## GET /weather

Returns the weather layer used by the digital twin.

## POST /weather/refresh

Fetches live Kochi weather from Open-Meteo, recalculates station health, predictions, alerts, and recommendations, persists `city_state.json`, and returns the refreshed weather payload. If Open-Meteo is unreachable, the backend keeps using `data/weather.json` and marks `live_available` as `false`.

## POST /simulate

Body:

```json
{
  "scenario": "Heavy Rain",
  "station_id": "kaloor",
  "time_horizon_minutes": 60
}
```

The simulation returns a recalculated state without persisting to source datasets.

## POST /chat

Body:

```json
{
  "message": "Why is Kaloor crowded?"
}
```

The AI layer receives only the current digital twin state and must explain, not calculate.

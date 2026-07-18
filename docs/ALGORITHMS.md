# Algorithms

## Station Health

Station health is a normalized risk score:

```text
health =
  0.35 * passenger_occupancy +
  0.20 * traffic_index +
  0.15 * parking_occupancy +
  0.10 * weather_severity +
  0.20 * incident_severity
```

Status:

- `healthy`: below 0.55
- `warning`: 0.55 to below 0.78
- `critical`: 0.78 and above

## Passenger Forecast

Passenger prediction uses an explainable operations ensemble, not a single linear formula:

```text
future =
  current +
  historical_effect +
  time_of_day_profile +
  nonlinear_weather_effect +
  direct_and_neighbour_event_effect +
  network_propagation_effect +
  traffic_to_metro_effect +
  train_delay_effect +
  incident_effect -
  capacity_damping
```

Model inputs:

- current station passenger occupancy
- historical station baseline and trend
- time-of-day peak profile
- Open-Meteo weather severity
- nearby event demand
- adjacent station overload propagation
- station-area road congestion and parking access pressure
- train delay pressure at current and neighbouring stations
- incident severity
- station capacity damping near saturation

The API returns `model`, `confidence`, `drivers`, and `components` for every prediction so the UI can explain why the forecast changed.

## Traffic Coupling

MetroMind models a bidirectional relationship between road traffic and metro stress.

Road to metro:

```text
traffic_to_metro_effect =
  local_road_congestion_above_threshold +
  neighbour_road_congestion -
  parking_access_penalty
```

Heavy road traffic near a station can shift passengers toward metro usage. If parking is already saturated, the model applies an access penalty because some passengers may be unable to reach or park at the station.

Metro to road:

```text
metro_stress_feedback =
  station_exit_pressure +
  parking_search_pressure +
  incident_access_pressure
```

High predicted passenger load can increase station-area road pressure through drop-offs, pickups, parking search, and incident-related access friction. This feedback updates predicted traffic and station health.

## Confidence

Prediction confidence starts near 90% and is reduced by volatility from active events, train delays, incidents, and severe weather. Known station-specific events add a small confidence bonus because the forecast has an explicit driver rather than unexplained noise.

## Parking Forecast

```text
future_parking =
  current_parking +
  parking_elasticity * passenger_increase +
  0.12 * event_effect
```

Values are clamped between 0 and 1.

## Recommendations

Recommendations are deterministic and rule based:

- passenger > 0.90: deploy extra platform staff
- parking > 0.95: open overflow parking
- weather > 0.70: issue rain advisory
- incident > 0.80: notify emergency response
- train delay: increase platform communication

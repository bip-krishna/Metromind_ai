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

```text
future =
  current +
  historical_trend +
  weather_effect +
  event_effect +
  neighbour_influence
```

Neighbour influence is `0.15 * sum(neighbour passenger occupancy)`.

## Parking Forecast

```text
future_parking = current_parking + 0.3 * passenger_increase
```

Values are clamped between 0 and 1.

## Recommendations

Recommendations are deterministic and rule based:

- passenger > 0.90: deploy extra platform staff
- parking > 0.95: open overflow parking
- weather > 0.70: issue rain advisory
- incident > 0.80: notify emergency response
- train delay: increase platform communication


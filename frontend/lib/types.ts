export type HealthStatus = "healthy" | "warning" | "critical";

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  line: string;
  passenger_occupancy: number;
  traffic_index: number;
  parking_occupancy: number;
  weather_severity: number;
  incident_severity: number;
  neighbours: string[];
  health_score: number;
  health_status: HealthStatus;
}

export interface Prediction {
  station_id: string;
  station_name: string;
  horizon_minutes: number;
  passenger_occupancy: number;
  traffic_index: number;
  parking_occupancy: number;
  health_score: number;
  health_status: HealthStatus;
  crowding: string;
  confidence: number;
  model: string;
  components: {
    current: number;
    historical_effect: number;
    time_profile: number;
    weather_effect: number;
    event_effect: number;
    neighbour_effect: number;
    train_delay_effect: number;
    traffic_effect: number;
    metro_stress_feedback: number;
    incident_effect: number;
    capacity_damping: number;
    passenger_occupancy: number;
  };
  drivers: string[];
}

export interface Recommendation {
  id: string;
  station_id: string;
  station_name: string;
  issue?: string;
  action: string;
  directive?: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  reason: string;
  expected_impact: string;
  owner?: string;
  timeline?: string;
  confidence: number;
}

export interface Alert {
  id: string;
  station_id: string;
  station_name: string;
  title: string;
  level: "Critical" | "High" | "Medium" | "Low";
  created_at: string;
}

export interface Weather {
  condition: string;
  temperature_c: number;
  apparent_temperature_c?: number;
  humidity_percent?: number;
  rain_probability: number;
  precipitation_mm?: number;
  cloud_cover_percent?: number;
  wind_kph: number;
  wind_gust_kph?: number;
  weather_code?: number;
  severity: number;
  source?: string;
  live_available?: boolean;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  updated_at: string;
  fetched_at?: string;
  fallback_reason?: string;
}

export interface Train {
  id: string;
  lat: number;
  lng: number;
  station_id: string;
  delay_minutes: number;
  direction: string;
}

export interface Event {
  id: string;
  name: string;
  station_id: string;
  impact: number;
  starts_at: string;
  ends_at: string;
}

export interface CityState {
  stations: Station[];
  route: unknown;
  weather: Weather;
  events: Event[];
  trains: Train[];
  predictions: Prediction[];
  recommendations: Recommendation[];
  alerts: Alert[];
  network_health: {
    score: number;
    risk: number;
    critical_stations: string[];
  };
  generated_at: string;
  mode?: {
    type: string;
    time_horizon_minutes?: number;
  };
}

export interface OperationsReport {
  report_id: string;
  generated_at: string;
  classification: string;
  summary: string[];
  weather: Weather;
  critical_alerts: Alert[];
  directives: Array<{
    station: string;
    issue: string;
    directive: string;
    priority: "Critical" | "High" | "Medium" | "Low";
    owner: string;
    timeline: string;
    confidence: number;
  }>;
  forecast_watchlist: Prediction[];
}

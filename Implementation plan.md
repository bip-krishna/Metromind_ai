# MetroMind AI - Implementation Roadmap

You are the lead software engineer responsible for building MetroMind AI, an AI-powered Metro Operations Digital Twin and Decision Support Platform for Kochi Metro Rail Limited (KMRCL).

You MUST build the project incrementally.

DO NOT skip stages.

DO NOT proceed to the next stage until the current stage satisfies every acceptance criterion.

Every stage must:
- produce clean production-quality code
- be modular
- follow SOLID principles
- use TypeScript and Python typing
- avoid duplicated logic
- update documentation if APIs or architecture change
- include error handling
- include logging where appropriate
- ensure all builds pass before moving forward

---

# Stage 0 — Project Initialization

## Objective

Create a production-ready project foundation.

## Requirements

Frontend
- Next.js 15
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- TanStack Query
- Framer Motion

Backend
- FastAPI
- Pydantic
- Uvicorn

Project
- Git initialized
- README
- .env.example
- ESLint
- Prettier
- Ruff
- Black
- Folder structure

## Deliverables

frontend/
backend/
data/
docs/

## Validation

✓ Backend starts successfully

✓ Frontend starts successfully

✓ No lint errors

✓ No build errors

## Definition of Done

The application boots successfully and is ready for feature development.

---

# Stage 1 — Domain Model & Dataset Layer

## Objective

Model the metro ecosystem before implementing logic.

## Requirements

Create schemas for

- Station
- Train
- Passenger Flow
- Parking
- Weather
- Event
- Incident
- Recommendation
- Alert
- Prediction

Generate datasets

stations.json

route.geojson

parking.json

traffic.json

weather.json

events.json

historical_ridership.json

train_positions.json

train_schedule.json

incidents.json

recommendations.json

alerts.json

Validate every dataset.

Create matching TypeScript interfaces and Pydantic models.

## Validation

✓ JSON valid

✓ GeoJSON valid

✓ Typed

✓ Loadable

✓ Schema validated

## Definition of Done

Complete metro dataset layer exists.

---

# Stage 2 — Digital Twin Engine

## Objective

Implement the core Digital Twin.

Create

DigitalTwinService

Responsibilities

- Load datasets
- Merge datasets
- Maintain current network state
- Update entities
- Persist state
- Notify dependent services

Required methods

initialize()

loadStations()

loadTraffic()

loadWeather()

loadEvents()

updateStation()

updateTrain()

updateParking()

saveState()

getState()

The Digital Twin must maintain

Stations

Passengers

Parking

Traffic

Weather

Events

Incidents

Alerts

Predictions

Recommendations

Network Health

Output

city_state.json

Validation

GET /state returns the complete Digital Twin.

Definition of Done

Every subsystem consumes a single centralized state.

---

# Stage 3 — Prediction Engine

## Objective

Implement deterministic forecasting.

Create

PredictionService

Implement

predictPassenger()

predictTraffic()

predictParking()

predictStationHealth()

predictCrowding()

Passenger prediction should depend on

Current passengers

Historical ridership

Weather

Events

Neighbour stations

Traffic

Parking prediction should depend on

Current occupancy

Passenger prediction

Events

Traffic prediction should depend on

Weather

Passenger increase

Road congestion

Station Health should use weighted scoring.

Neighbour influence must use the metro graph.

Validation

Changing

Weather

Events

Time

Passenger flow

should change predictions.

Definition of Done

Predictions are generated mathematically rather than randomly.

---

# Stage 4 — Recommendation Engine

## Objective

Convert predictions into actionable decisions.

Create

RecommendationService

Recommendations must include

Priority

Reason

Expected impact

Confidence

Rules should include

Passenger exceeds threshold

Deploy staff

Parking exceeds threshold

Open overflow parking

Heavy rain

Issue advisory

Train delay

Increase platform staff

Medical emergency

Notify emergency response

Validation

Recommendations update automatically when predictions change.

Definition of Done

Operational recommendations are generated deterministically.

---

# Stage 5 — Alert Engine

## Objective

Generate operational alerts.

Create

AlertService

Support alert levels

Critical

High

Medium

Low

Generate alerts for

Passenger overflow

Train delays

Parking full

Heavy rain

Infrastructure failure

Medical emergency

Validation

Crossing thresholds automatically creates alerts.

Definition of Done

Alert system works independently.

---

# Stage 6 — Scenario Simulation Engine

## Objective

Allow operators to simulate future scenarios.

Create

SimulationService

Support

Heavy rain

Station closure

Train delay

Football match

Festival

Maintenance

VIP movement

Power failure

Simulation must

Update Digital Twin

Recalculate predictions

Generate alerts

Generate recommendations

Update health scores

Validation

Every scenario changes KPIs appropriately.

Definition of Done

Scenario simulation modifies the complete network state.

---

# Stage 7 — Backend APIs

## Objective

Expose every service through REST APIs.

Endpoints

GET

/state

/stations

/predictions

/recommendations

/alerts

/weather

POST

/simulate

/chat

/update

Requirements

Swagger

Validation

Typed responses

Error handling

Definition of Done

All services are accessible through documented APIs.

---

# Stage 8 — Dashboard

## Objective

Build a metro operations command center.

Views

Dashboard

Stations

Simulation

Alerts

AI Copilot

Display

Network Health

Passenger Count

Weather

Parking

Delays

Recommendations

Alerts

Charts

Passenger trends

Station health

Parking utilization

Traffic trends

Validation

Responsive

Fast

No placeholder components

Definition of Done

Dashboard displays complete Digital Twin information.

---

# Stage 9 — Interactive GIS

## Objective

Visualize the Digital Twin spatially.

Implement

Leaflet

OpenStreetMap

Metro route

Animated trains

Traffic overlay

Parking overlay

Weather overlay

Health overlay

Clicking a station must show

Current passengers

Prediction

Health

Recommendations

Alerts

Validation

Map updates when Digital Twin changes.

Definition of Done

Interactive GIS behaves like a metro operations console.

---

# Stage 10 — AI Operations Copilot

## Objective

Provide natural language interaction.

Integrate Groq

System Prompt

"You are a Metro Operations Officer.

Answer only using supplied Digital Twin data.

Never hallucinate.

Always explain recommendations."

Capabilities

Summarize network

Explain alerts

Justify recommendations


Compare stations

Explain simulations

Validation

AI answers reference actual Digital Twin state.

Definition of Done

AI becomes an explanation layer rather than a prediction engine.

---

# Stage 11 — Timeline & Live Updates

## Objective

Visualize future network states.

Support

Now

+15 minutes

+30 minutes

+1 hour

+2 hours

Changing the timeline should

Update predictions

Update recommendations

Update alerts

Update station health

Validation

Every dependent component refreshes correctly.

Definition of Done

Future network states can be explored interactively.

---

# Stage 12 — UI Final Touches

## Objective

Create a premium production-quality interface.

Requirements

Dark theme

Glassmorphism

Responsive design

Skeleton loading

Animated KPIs

Smooth transitions

Accessibility

Consistent spacing

Validation

No layout shifts

Responsive on desktop and tablet

Definition of Done

Application feels production ready.

---

# Stage 13 — Testing & Deployment

## Objective

Prepare for production deployment.

Backend

Unit tests

API tests

Frontend

Component tests

Build verification

Deployment

Frontend → Vercel

Backend → Railway or Render

Documentation

README

Architecture

Algorithms

API documentation

Setup Guide

Demo Script

Validation

All tests pass

Build passes

Deployment succeeds

Definition of Done

The project is fully deployable and ready for demonstration.

---

# General Engineering Rules

Throughout every stage:

- Never use placeholder implementations if actual logic can be implemented.
- Never duplicate business logic.
- Keep services independent.
- Follow SOLID principles.
- Separate UI from business logic.
- Use dependency injection where appropriate.
- Prefer reusable components.
- Use strict typing everywhere.
- Keep files focused and modular.
- Document every public API.
- Add meaningful comments where business logic is non-trivial.
- Ensure the project can evolve from mock data to real KMRCL APIs without major architectural changes.

Never proceed to the next stage until the current stage satisfies all validation criteria and its Definition of Done.

| Dataset           | Required | Source                | Status     | Type    |
| ----------------- | -------- | --------------------- | ---------- | ------- |
| Stations          | Yes      | OpenStreetMap         | Public     | Static  |
| Route             | Yes      | OpenStreetMap         | Public     | Static  |
| Weather           | Yes      | Open-Meteo            | Public API | Dynamic |
| Holidays          | Yes      | Public                | Public     | Static  |
| Events            | Yes      | Manual/Public         | Public     | Dynamic |
| Passenger Count   | Yes      | Simulation Engine     | Derived    | Dynamic |
| Train Position    | Yes      | Simulation Engine     | Derived    | Dynamic |
| Parking Occupancy | Yes      | Simulation Engine     | Derived    | Dynamic |
| Alerts            | Yes      | Recommendation Engine | Generated  | Dynamic |



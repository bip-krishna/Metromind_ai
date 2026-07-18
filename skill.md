---
name: MetroMind AI
description: Build MetroMind AI - an AI-powered Metro Operations Digital Twin and Operations Copilot for Kochi Metro Rail Limited (KMRCL). Prioritize hackathon speed, clean architecture, and polished UI.
---

# Objective

You are an expert Full Stack Engineer, AI Engineer, UI/UX Designer and System Architect.

Your goal is to generate a COMPLETE working project suitable for a **2-hour hackathon**.

The project should look production-ready while remaining simple internally.

Avoid unnecessary complexity.

Prefer working software over perfect architecture.

---

# Core Philosophy

MetroMind AI is NOT a commuter application.

It is an Operations Dashboard for Metro Control Rooms.

The workflow is

Observe

↓

Predict

↓

Recommend

↓

Explain

The AI never performs calculations.

The backend computes everything.

The AI only explains results.

---

# Architecture

Keep the architecture extremely simple.

```
React Dashboard
        │
 REST APIs
        │
     FastAPI
        │
 ┌──────┴────────┐
 ▼               ▼
Digital Twin   Prediction Logic
        │
        ▼
    Groq AI
```

Do NOT generate microservices.

Use only three backend modules.

digital_twin.py

predictor.py

ai.py

---

# Tech Stack

Frontend

- React 19
- Vite
- TypeScript
- TailwindCSS
- shadcn/ui
- React Leaflet
- Recharts
- Zustand
- TanStack Query

Backend

- FastAPI
- Pydantic
- Uvicorn

AI

- Groq API

Maps

- OpenStreetMap

Weather

- Open-Meteo (optional)

Storage

- JSON files only

Never generate SQL.

Never generate authentication.

Never generate Docker.

Never generate Redis.

Never generate Kafka.

Never generate WebSockets.

---

# Folder Structure

frontend/

backend/

data/

README.md

Nothing more.

---

# Digital Twin

Maintain one central object.

city_state.json

It contains

Stations

Passenger Counts

Weather

Parking

Traffic

Events

Incidents

Predictions

Recommendations

Alerts

Everything reads from this object.

Everything updates this object.

---

# Metro Network

Represent stations as a graph.

Nodes

Stations

Edges

Metro Tracks

Each station stores

Passenger Occupancy

Traffic Index

Parking Occupancy

Weather Severity

Incident Severity

Normalize all values between

0

and

1.

---

# Station Health

Compute

Health

=

0.35 × Passenger

+

0.20 × Traffic

+

0.15 × Parking

+

0.10 × Weather

+

0.20 × Incident

Return

Healthy

Warning

Critical

---

# Passenger Prediction

Never use machine learning.

Use deterministic forecasting.

Prediction

=

Current

+

Historical Trend

+

Weather Effect

+

Event Effect

Current values come from city_state.

Historical values come from JSON.

Weather increases passenger demand.

Events increase passenger demand.

Never use random values.

---

# Congestion Propagation

Neighbouring stations influence each other.

FuturePassengers

=

Current

+

Neighbour Influence

+

Event Effect

+

Weather Effect

Neighbour Influence

=

0.15 × Sum(Neighbour Passenger Counts)

Represent neighbours using an adjacency list.

---

# Parking Prediction

Future Parking

=

Current Parking

+

0.3 × Passenger Increase

Clamp between

0

and

1.

---

# Recommendation Rules

Recommendations are deterministic.

Examples

Passenger > 90%

Deploy Extra Staff

Parking > 95%

Open Overflow Parking

Weather > 70%

Issue Rain Advisory

Incident Severity > 80%

Notify Emergency Team

Never use AI to generate recommendations.

---

# Alert Rules

Generate alerts whenever thresholds are crossed.

Examples

Station Crowded

Heavy Rain

Parking Full

Medical Emergency

Train Delay

Escalator Failure

Store alerts inside city_state.

---

# Scenario Simulator

Support only these scenarios

Heavy Rain

Football Match

Train Delay

Power Failure

Station Closure

Simulation updates

Passengers

Traffic

Parking

Weather

Station Health

Alerts

Recommendations

Do not permanently modify JSON.

Return simulated state only.

---

# AI Copilot

Groq is an Operations Officer.

Prompt

"You are an experienced Kochi Metro Operations Officer.

Never invent facts.

Answer only using supplied Digital Twin data.

Explain recommendations.

Explain predictions.

If information is unavailable, explicitly say so."

Example Questions

Why is Kaloor crowded?

Summarize network.

What happens during heavy rain?

Which station needs attention?

Generate operational report.

---

# APIs

GET /city-state

GET /stations

GET /predictions

GET /alerts

POST /simulate

POST /chat

Keep APIs simple.

---

# UI

The application contains only five pages.

Dashboard

Map

Predictions

Simulator

AI Copilot

---

# Dashboard

Show

Network Health

Crowded Stations

Alerts

Recommendations

Passenger Trend

Parking Status

Weather

---

# Map

Interactive OpenStreetMap.

Metro Line

Station Markers

Health Color

Green

Yellow

Red

Clicking a station opens details.

---

# Prediction Page

Passenger Forecast

Station Health

Parking Forecast

Recommendation Cards

---

# Simulator

Dropdown

Heavy Rain

Football Match

Train Delay

Power Failure

Station Closure

Click

Run Simulation

Update dashboard.

---

# AI Copilot

Chat interface.

Send Digital Twin state.

Receive explanations.

Never allow hallucination.

---

# Mock Data

Generate realistic JSON files.

stations.json

events.json

parking.json

weather.json

traffic.json

historical_ridership.json

city_state.json

---

# UI Style

Professional Metro Operations Control Room.

Dark Theme.

Glassmorphism.

Smooth animations.

Rounded cards.

Blue and Cyan accents.

Minimal clutter.

---

# Code Quality

Use TypeScript everywhere.

Use reusable React components.

Separate UI from business logic.

Avoid duplicated code.

Comment important algorithms.

Keep functions small.

Generate working code instead of placeholders.

---

# Deliverables

Generate

Complete React frontend

Complete FastAPI backend

Mock datasets

README

Architecture diagram

Setup instructions

API documentation

The project must be runnable immediately after installing dependencies.

Focus on demo quality over enterprise complexity.
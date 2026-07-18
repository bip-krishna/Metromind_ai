# MetroMind AI

MetroMind AI is an operations digital twin and AI copilot prototype for Kochi Metro Rail Limited control rooms. It follows the workflow:

Observe -> Predict -> Recommend -> Explain

The backend owns all calculations. The AI layer only explains the supplied digital twin data.

## Architecture

```text
Next.js Operations Dashboard
        |
      REST
        |
     FastAPI
        |
  Digital Twin + Deterministic Prediction
        |
     Groq AI explanations
```

## Project Structure

```text
frontend/  Next.js 15 dashboard
backend/   FastAPI app with three core modules
data/      JSON datasets and generated city_state.json
docs/      API and algorithm notes
```

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` at the project root and set `GROQ_API_KEY` to enable live copilot answers. Without a key, the backend returns deterministic local explanations.

Open-Meteo weather is enabled by default and requires no API key. Set `METROMIND_LIVE_WEATHER=false` to force the mock `data/weather.json` fallback. Weather severity feeds station health, predictions, alerts, and recommendations.

## Core API

- `GET /state`
- `GET /city-state`
- `GET /stations`
- `GET /predictions`
- `GET /recommendations`
- `GET /alerts`
- `GET /weather`
- `POST /weather/refresh`
- `POST /simulate`
- `POST /chat`
- `POST /update`

## Demo Script

1. Open Dashboard and review network health, alerts, recommendations, parking, and passenger trend.
2. Open Map and inspect station health across the metro corridor.
3. Open Predictions and compare forecasted passengers, parking, traffic, and health.
4. Run a scenario such as Heavy Rain or Football Match.
5. Ask the AI Copilot: "Which station needs attention and why?"

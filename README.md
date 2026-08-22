# GlobeTrotter

Personalized, collaborative multi-city travel planning app.

## Stack

- **Frontend:** React (Vite) + JavaScript
- **Backend:** FastAPI + SQLAlchemy + Alembic
- **Database:** PostgreSQL 16

## Prerequisites

- Docker Desktop (for Postgres)
- Python 3.11+
- Node.js 20+

## Quick start

### 1. Environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Database

```bash
docker compose up -d
```

### 3. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

Health check: http://localhost:8000/health

API docs (stub handlers): http://localhost:8000/docs

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Project structure

```
GlobeTrotter/
  backend/          # FastAPI application
  frontend/         # Vite + React application
  docs/openapi.yaml # Phase 1 API contract (source of truth)
  docker-compose.yml
```

## API contract

See [`docs/openapi.yaml`](docs/openapi.yaml) for the agreed-upon endpoint shapes. Phases 2–7 should build against this contract.

## Build plan

See [`GLOBETROTTER_BUILD_PLAN.md`](GLOBETROTTER_BUILD_PLAN.md) for the full 7-phase roadmap.

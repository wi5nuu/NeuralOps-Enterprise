# NeuralOps Enterprise

Enterprise AI Engineering Platform for managing LLMs, RAG pipelines, experiments, evaluations, monitoring, and team collaboration.

## Architecture

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy async, PostgreSQL, Redis, Celery
- **Frontend**: React 18, Vite, Tailwind CSS, TanStack Query, Zustand, Recharts
- **AI Models**: Anthropic Claude API, sentence-transformers, FAISS vector search
- **Infrastructure**: Docker, MLflow, Prometheus metrics

## Modules

| Module | Description |
|--------|-------------|
| **LLM Playground** | Chat with Claude models, SSE streaming, prompt management |
| **RAG Engine** | Document upload, chunking, embedding, FAISS search, Q&A |
| **Experiments** | MLflow integration, run tracking, metric visualization |
| **AI Services** | Service monitoring, health checks, latency/error tracking |
| **Model Registry** | Model catalog with versioning and metadata |
| **Task Board** | Kanban with drag-and-drop, priority management |
| **Datasets** | Dataset catalog with version history and preview |
| **Evaluations** | 6 evaluation types via Claude (hallucination, relevance, safety, bias, faithfulness, custom) |
| **Analytics** | Dashboard with KPIs, usage metrics, cost tracking |
| **Settings** | Profile, organization, API keys, team management, notifications |

## Quick Start

```bash
# Environment setup
cp .env.example .env
# Edit .env with your database URL and API keys

# Docker (recommended)
docker-compose up --build -d

# Manual backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Manual frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.example` for all required variables. Key variables:

- `DATABASE_URL` - PostgreSQL async connection string
- `REDIS_URL` - Redis connection string
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `JWT_SECRET` - Secret for JWT token signing
- `MLFLOW_TRACKING_URI` - MLflow server URI

## API Overview

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/usage` - Usage metrics
- `POST /api/playground/conversations` - Create conversation
- `POST /api/playground/conversations/{id}/messages` - Send message
- `GET /api/playground/conversations/{id}/stream` - SSE streaming
- `POST /api/rag/collections` - Create RAG collection
- `POST /api/rag/collections/{id}/documents/upload` - Upload document
- `POST /api/rag/query` - Semantic search query
- `POST /api/evaluations/` - Run evaluation
- `GET /api/experiments/` - List experiments
- `GET /api/services/` - List AI services
- `GET /api/tasks/` - List tasks
- `GET /api/datasets/` - List datasets
- `GET /api/registry/models` - List registered models

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | password123 | Admin |
| dev@acme.com | password123 | Developer |
| admin@startup.com | password123 | Admin |
| lead@devteam.com | password123 | Admin |

## Tech Stack

- **Python**: FastAPI, SQLAlchemy, Alembic, Celery, Pydantic v2
- **React**: Vite, Tailwind CSS, TanStack Query v5, Zustand, React Router v6, Framer Motion, Recharts, React DnD, React Hook Form + Zod, Lucide React
- **AI/ML**: Anthropic Claude API, sentence-transformers, FAISS, MLflow, Prometheus
- **Infrastructure**: Docker, PostgreSQL, Redis, Nginx

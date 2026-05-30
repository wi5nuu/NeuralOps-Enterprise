# NeuralOps Enterprise

![NeuralOps Enterprise](https://img.shields.io/badge/Platform-Enterprise%20AI%20Ops-blueviolet?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

NeuralOps Enterprise is a high-performance, operational management platform designed for AI infrastructure. It provides a unified control plane for AI model registry, performance monitoring, RAG (Retrieval-Augmented Generation) management, and automated evaluation, ensuring that models transition seamlessly from experimentation to production environments.

## Key Features

- **Unified Control Plane:** Centralized dashboard for monitoring, evaluating, and managing AI models.
- **Model Registry:** Integrated with MLflow for versioning and tracking model performance across lifecycles.
- **RAG Management:** Full-stack Retrieval-Augmented Generation support with vector store integration and document chunking.
- **Experimentation & Evaluations:** Run automated evaluation pipelines (via Celery) to benchmark LLM outputs.
- **Real-time Analytics:** Visualized metrics for token consumption, latency, and model health using Recharts.
- **Enterprise-Grade Security:** Robust RBAC (Role-Based Access Control) with JWT authentication and audit logging.
- **AI Playground:** Interactive environment to test various LLM providers (Claude, GPT) and prompt templates.
- **Async Architecture:** Built on FastAPI with asynchronous database operations and background task processing.

## Technical Stack

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.13)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async)
- **Migrations:** [Alembic](https://alembic.sqlalchemy.org/en/latest/)
- **Task Queue:** [Celery](https://docs.celeryq.dev/) with [Redis](https://redis.io/)
- **Vector Store:** [Faiss](https://github.com/facebookresearch/faiss) with [Sentence-Transformers](https://www.sbert.net/)
- **Experiment Tracking:** [MLflow](https://mlflow.org/)
- **Monitoring:** [Prometheus](https://prometheus.io/) & [Flower](https://flower.readthedocs.io/)
- **Authentication:** JWT with OAuth2 scopes
- **Utilities:** [Tiktoken](https://github.com/openai/tiktoken) for token counting, [Pandas](https://pandas.pydata.org/) for data processing

### Frontend
- **Framework:** [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)
- **Visualization:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.13+ (for local development)
- Node.js 18+ (for local development)

### Option 1: Docker Compose (Recommended)
The easiest way to get started is using Docker Compose, which spins up the backend, frontend, database, Redis, and MLflow.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/wi5nuu/NeuralOps-Enterprise.git
   cd NeuralOps-Enterprise
   ```
2. **Environment Setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (Anthropic, OpenAI, etc.)
   ```
3. **Run the application:**
   ```bash
   make dev
   ```
4. **Access the services:**
   - **Frontend:** [http://localhost](http://localhost) (or [http://localhost:3000](http://localhost:3000))
   - **Backend API:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **MLflow:** [http://localhost:5000](http://localhost:5000)
   - **Flower (Celery Monitoring):** [http://localhost:5555](http://localhost:5555)

### Option 2: Local Development
If you prefer running components individually:

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

## Configuration

Key environment variables in `.env`:
- `ANTHROPIC_API_KEY`: Required for Claude services.
- `OPENAI_API_KEY`: Required for OpenAI services.
- `DATABASE_URL`: Connection string for PostgreSQL.
- `JWT_SECRET`: Secret key for authentication.
- `MLFLOW_TRACKING_URI`: Endpoint for MLflow server.

## Development Commands

Use the provided `Makefile` for common tasks:
- `make dev`: Start all services in Docker.
- `make seed`: Populate the database with initial sample data.
- `make migrate`: Run database migrations.
- `make test`: Execute backend test suite.
- `make clean`: Stop and remove all Docker containers and volumes.

## License
All rights reserved. 2026 NeuralOps Enterprise.

---
Built by the NeuralOps Team.

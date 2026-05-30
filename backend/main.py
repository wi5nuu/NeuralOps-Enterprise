from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from config import settings

settings.database_url = "sqlite+aiosqlite:///./neuralops.db"

from database import engine, Base
from middleware.auth_middleware import AuthMiddleware
from middleware.rate_limit import RateLimitMiddleware
from middleware.error_handler import ErrorHandlerMiddleware
from routers import auth, users, organizations, projects, llm_playground, rag, experiments, ai_services, model_registry, tasks, datasets, evaluations, analytics, notifications, audit

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NeuralOps Enterprise API...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    logger.info("Shutting down NeuralOps Enterprise API...")


app = FastAPI(
    title="NeuralOps Enterprise API",
    description="Enterprise AI Engineering Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(organizations.router)
app.include_router(projects.router)
app.include_router(llm_playground.router)
app.include_router(rag.router)
app.include_router(experiments.router)
app.include_router(ai_services.router)
app.include_router(model_registry.router)
app.include_router(tasks.router)
app.include_router(datasets.router)
app.include_router(evaluations.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(audit.router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "neuralops-enterprise", "version": "1.0.0"}


@app.get("/metrics")
async def metrics():
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from prometheus_client import Counter, Histogram

    data = generate_latest()
    return JSONResponse(content=data.decode("utf-8"), media_type=CONTENT_TYPE_LATEST)

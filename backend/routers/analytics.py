from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.user import User
from models.project import Project
from models.experiment import Experiment
from models.ai_service import AIService
from models.dataset import Dataset
from models.evaluation import Evaluation
from models.service_log import ServiceLog
from schemas.analytics import DashboardResponse, DashboardStats, UsageMetrics
from dependencies import get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        org_id = current_user.org_id

        users_count = await db.execute(select(func.count(User.id)).where(User.org_id == org_id))
        projects_count = await db.execute(select(func.count(Project.id)).where(Project.org_id == org_id))
        experiments_count = await db.execute(select(func.count(Experiment.id)).where(Experiment.org_id == org_id))
        services_count = await db.execute(select(func.count(AIService.id)).where(AIService.org_id == org_id))
        datasets_count = await db.execute(select(func.count(Dataset.id)).where(Dataset.org_id == org_id))
        evals_count = await db.execute(select(func.count(Evaluation.id)).where(Evaluation.org_id == org_id))

        recent_activity_stmt = select(Evaluation).where(Evaluation.org_id == org_id).order_by(Evaluation.created_at.desc()).limit(10)
        recent_activity = await db.execute(recent_activity_stmt)

        services = await db.execute(select(AIService).where(AIService.org_id == org_id))
        service_list = [{"name": s.name, "is_healthy": s.is_healthy, "health_score": s.health_score} for s in services.scalars().all()]

        model_pie = await db.execute(
            select(Evaluation.eval_type, func.count(Evaluation.id)).where(Evaluation.org_id == org_id).group_by(Evaluation.eval_type)
        )

        return DashboardResponse(
            stats=DashboardStats(
                total_users=users_count.scalar() or 0,
                total_projects=projects_count.scalar() or 0,
                total_experiments=experiments_count.scalar() or 0,
                total_services=services_count.scalar() or 0,
                total_datasets=datasets_count.scalar() or 0,
                total_evaluations=evals_count.scalar() or 0,
            ),
            recent_activity=[{"type": "evaluation", "name": e.eval_name, "created_at": e.created_at.isoformat() if e.created_at else ""} for e in recent_activity.scalars().all()],
            service_health=service_list,
            model_pie=[{"name": row[0].value if hasattr(row[0], "value") else str(row[0]), "value": row[1]} for row in model_pie.all()],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage", response_model=UsageMetrics)
async def get_usage_metrics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        org_id = current_user.org_id

        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        logs_stmt = select(ServiceLog).where(
            ServiceLog.service_id.in_(select(AIService.id).where(AIService.org_id == org_id)),
            ServiceLog.timestamp >= thirty_days_ago,
        )
        logs_result = await db.execute(logs_stmt)
        logs = list(logs_result.scalars().all())

        total_requests = len(logs)
        errors = [l for l in logs if l.is_error]
        total_tokens = sum((l.input_tokens or 0) + (l.output_tokens or 0) for l in logs)
        latencies = [l.latency_ms for l in logs if l.latency_ms is not None]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        error_rate = (len(errors) / total_requests * 100) if total_requests else 0

        cost_estimate = (total_tokens / 1_000_000) * 3.0

        usage_over_time = {}
        for l in logs:
            day = l.timestamp.strftime("%Y-%m-%d")
            usage_over_time[day] = usage_over_time.get(day, 0) + 1

        return UsageMetrics(
            total_api_calls=total_requests,
            total_tokens=total_tokens,
            avg_latency_ms=round(avg_latency, 2),
            error_rate=round(error_rate, 2),
            cost_estimate=round(cost_estimate, 4),
            costs_by_service=[],
            usage_over_time=[{"date": k, "count": v} for k, v in sorted(usage_over_time.items())],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

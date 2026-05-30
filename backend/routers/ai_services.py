from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.user import User
from models.ai_service import AIService
from models.service_log import ServiceLog
from schemas.ai_service import AIServiceResponse, AIServiceCreateRequest, AIServiceUpdateRequest, ServiceLogResponse
from dependencies import get_current_user
from typing import List
from datetime import datetime, timezone
from services import monitoring_service
import uuid

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("/", response_model=List[AIServiceResponse])
async def list_services(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(AIService).where(AIService.org_id == current_user.org_id).order_by(AIService.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=AIServiceResponse, status_code=201)
async def create_service(req: AIServiceCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        service = AIService(
            id=str(uuid.uuid4()),
            org_id=current_user.org_id,
            **req.model_dump(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(service)
        await db.commit()
        await db.refresh(service)
        return service
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{service_id}", response_model=AIServiceResponse)
async def get_service(service_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(AIService).where(AIService.id == service_id, AIService.org_id == current_user.org_id)
        result = await db.execute(stmt)
        service = result.scalar_one_or_none()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        log_stmt = select(ServiceLog).where(ServiceLog.service_id == service_id).order_by(ServiceLog.timestamp.desc()).limit(100)
        log_result = await db.execute(log_stmt)
        service.logs = list(log_result.scalars().all())
        return service
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{service_id}", response_model=AIServiceResponse)
async def update_service(service_id: str, req: AIServiceUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(AIService).where(AIService.id == service_id, AIService.org_id == current_user.org_id)
        result = await db.execute(stmt)
        service = result.scalar_one_or_none()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        for field, value in req.model_dump(exclude_unset=True).items():
            setattr(service, field, value)
        await db.commit()
        await db.refresh(service)
        return service
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{service_id}", status_code=204)
async def delete_service(service_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(AIService).where(AIService.id == service_id, AIService.org_id == current_user.org_id)
        result = await db.execute(stmt)
        service = result.scalar_one_or_none()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        await db.delete(service)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{service_id}/health-check")
async def health_check_service(service_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(AIService).where(AIService.id == service_id, AIService.org_id == current_user.org_id)
        result = await db.execute(stmt)
        service = result.scalar_one_or_none()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        log_stmt = select(ServiceLog).where(ServiceLog.service_id == service_id).order_by(ServiceLog.timestamp.desc()).limit(50)
        log_result = await db.execute(log_stmt)
        logs = list(log_result.scalars().all())

        if logs:
            latencies = [l.latency_ms for l in logs if l.latency_ms is not None]
            errors = [l for l in logs if l.is_error]
            error_rate = monitoring_service.calculate_error_rate(len(logs), len(errors))
            avg_latency = sum(latencies) / len(latencies) if latencies else 0
            health_score = monitoring_service.calculate_health_score(error_rate, avg_latency, service.sla_target_ms or 1000)

            service.avg_latency_ms = round(avg_latency, 2)
            service.error_rate = error_rate
            service.health_score = health_score
            service.is_healthy = health_score >= 70

        await db.commit()
        await db.refresh(service)
        return service
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{service_id}/logs", response_model=List[ServiceLogResponse])
async def get_service_logs(service_id: str, limit: int = 50, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(ServiceLog).where(ServiceLog.service_id == service_id).order_by(ServiceLog.timestamp.desc()).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

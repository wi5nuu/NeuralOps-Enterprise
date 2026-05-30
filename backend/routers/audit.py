from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.audit_log import AuditLog
from dependencies import get_current_user, get_current_admin
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/")
async def list_audit_logs(
    limit: int = Query(50),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    try:
        stmt = select(AuditLog).where(AuditLog.org_id == current_user.org_id).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(stmt)
        logs = list(result.scalars().all())

        return [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "payload_summary": log.payload_summary,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.user import User
from models.notification import Notification
from schemas.notification import NotificationResponse, NotificationCreateRequest
from dependencies import get_current_user
from services import notification_service
from typing import List

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = Query(False),
    skip: int = Query(0),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        notifications = await notification_service.get_user_notifications(
            db, current_user.id, current_user.org_id, skip=skip, limit=limit, unread_only=unread_only
        )
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(notification_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        notification = await notification_service.mark_notification_read(db, notification_id, current_user.id)
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        return notification
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        count = await notification_service.mark_all_notifications_read(db, current_user.id, current_user.org_id)
        return {"detail": f"{count} notifications marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def get_unread_count(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(func.count(Notification.id)).where(Notification.user_id == current_user.id, Notification.org_id == current_user.org_id, Notification.is_read == False)
        result = await db.execute(stmt)
        return {"count": result.scalar() or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

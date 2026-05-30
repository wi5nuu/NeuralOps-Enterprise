from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.notification import Notification, NotificationTypeEnum
from models.organization import Organization
from models.user import User
from schemas.notification import NotificationCreateRequest
import uuid
from datetime import datetime, timezone


async def create_notification(
    db: AsyncSession,
    org_id: str,
    user_id: str,
    title: str,
    message: str,
    notification_type: NotificationTypeEnum,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
) -> Notification:
    notification = Notification(
        id=str(uuid.uuid4()),
        org_id=org_id,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        resource_type=resource_type,
        resource_id=resource_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def get_user_notifications(db: AsyncSession, user_id: str, org_id: str, skip: int = 0, limit: int = 50, unread_only: bool = False) -> list[Notification]:
    stmt = select(Notification).where(
        Notification.user_id == user_id,
        Notification.org_id == org_id,
    )

    if unread_only:
        stmt = stmt.where(Notification.is_read == False)

    stmt = stmt.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def mark_notification_read(db: AsyncSession, notification_id: str, user_id: str) -> Optional[Notification]:
    stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()
    if not notification:
        return None

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


async def mark_all_notifications_read(db: AsyncSession, user_id: str, org_id: str) -> int:
    stmt = select(Notification).where(Notification.user_id == user_id, Notification.org_id == org_id, Notification.is_read == False)
    result = await db.execute(stmt)
    notifications = list(result.scalars().all())

    for n in notifications:
        n.is_read = True

    await db.commit()
    return len(notifications)

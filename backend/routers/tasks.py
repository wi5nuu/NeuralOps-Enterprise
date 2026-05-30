from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.task import Task, TaskStatusEnum, TaskPriorityEnum
from schemas.task import TaskResponse, TaskCreateRequest, TaskUpdateRequest, TaskBatchUpdateRequest
from dependencies import get_current_user
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskResponse])
async def list_tasks(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Task).where(Task.org_id == current_user.org_id).order_by(Task.sort_order, Task.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(req: TaskCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        max_order = await db.execute(select(Task.sort_order).where(Task.org_id == current_user.org_id).order_by(Task.sort_order.desc()).limit(1))
        max_val = max_order.scalar() or 0

        task = Task(
            id=str(uuid.uuid4()),
            org_id=current_user.org_id,
            **req.model_dump(),
            sort_order=max_val + 1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Task).where(Task.id == task_id, Task.org_id == current_user.org_id)
        result = await db.execute(stmt)
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, req: TaskUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Task).where(Task.id == task_id, Task.org_id == current_user.org_id)
        result = await db.execute(stmt)
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        for field, value in req.model_dump(exclude_unset=True).items():
            setattr(task, field, value)
        task.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(task)
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Task).where(Task.id == task_id, Task.org_id == current_user.org_id)
        result = await db.execute(stmt)
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        await db.delete(task)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/batch/update", response_model=List[TaskResponse])
async def batch_update_tasks(req: TaskBatchUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        updated = []
        for task_id in req.task_ids:
            stmt = select(Task).where(Task.id == task_id, Task.org_id == current_user.org_id)
            result = await db.execute(stmt)
            task = result.scalar_one_or_none()
            if not task:
                continue

            if req.status is not None:
                task.status = TaskStatusEnum(req.status)
            if req.priority is not None:
                task.priority = TaskPriorityEnum(req.priority)
            if req.assignee_id is not None:
                task.assignee_id = req.assignee_id
            task.updated_at = datetime.now(timezone.utc)
            updated.append(task)

        await db.commit()
        for task in updated:
            await db.refresh(task)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

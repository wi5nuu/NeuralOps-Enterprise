from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.model_registry import ModelRegistry
from schemas.model_registry import ModelRegistryResponse, ModelRegistryCreateRequest, ModelRegistryUpdateRequest
from dependencies import get_current_user
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/registry", tags=["registry"])


@router.get("/models", response_model=List[ModelRegistryResponse])
async def list_models(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(ModelRegistry).where(ModelRegistry.org_id == current_user.org_id).order_by(ModelRegistry.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/models", response_model=ModelRegistryResponse, status_code=201)
async def register_model(req: ModelRegistryCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        model = ModelRegistry(
            id=str(uuid.uuid4()),
            org_id=current_user.org_id,
            **req.model_dump(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(model)
        await db.commit()
        await db.refresh(model)
        return model
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/{model_id}", response_model=ModelRegistryResponse)
async def get_model(model_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(ModelRegistry).where(ModelRegistry.id == model_id, ModelRegistry.org_id == current_user.org_id)
        result = await db.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        return model
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/models/{model_id}", response_model=ModelRegistryResponse)
async def update_model(model_id: str, req: ModelRegistryUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(ModelRegistry).where(ModelRegistry.id == model_id, ModelRegistry.org_id == current_user.org_id)
        result = await db.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")

        for field, value in req.model_dump(exclude_unset=True).items():
            setattr(model, field, value)
        await db.commit()
        await db.refresh(model)
        return model
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/models/{model_id}", status_code=204)
async def delete_model(model_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(ModelRegistry).where(ModelRegistry.id == model_id, ModelRegistry.org_id == current_user.org_id)
        result = await db.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        await db.delete(model)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

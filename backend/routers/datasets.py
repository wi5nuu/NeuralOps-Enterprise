from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.dataset import Dataset
from models.dataset_version import DatasetVersion
from schemas.dataset import DatasetResponse, DatasetCreateRequest, DatasetUpdateRequest, DatasetVersionResponse
from dependencies import get_current_user
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("/", response_model=List[DatasetResponse])
async def list_datasets(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Dataset).where(Dataset.org_id == current_user.org_id).order_by(Dataset.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=DatasetResponse, status_code=201)
async def create_dataset(req: DatasetCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        dataset = Dataset(
            id=str(uuid.uuid4()),
            org_id=current_user.org_id,
            **req.model_dump(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(dataset)

        version = DatasetVersion(
            id=str(uuid.uuid4()),
            dataset_id=dataset.id,
            version=1,
            changelog="Initial version",
            created_at=datetime.now(timezone.utc),
        )
        db.add(version)
        await db.commit()
        await db.refresh(dataset)
        return dataset
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.org_id == current_user.org_id)
        result = await db.execute(stmt)
        dataset = result.scalar_one_or_none()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        ver_stmt = select(DatasetVersion).where(DatasetVersion.dataset_id == dataset_id).order_by(DatasetVersion.version.desc())
        ver_result = await db.execute(ver_stmt)
        dataset.versions = list(ver_result.scalars().all())
        return dataset
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(dataset_id: str, req: DatasetUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.org_id == current_user.org_id)
        result = await db.execute(stmt)
        dataset = result.scalar_one_or_none()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        for field, value in req.model_dump(exclude_unset=True).items():
            setattr(dataset, field, value)

        dataset.version += 1
        version = DatasetVersion(
            id=str(uuid.uuid4()),
            dataset_id=dataset_id,
            version=dataset.version,
            changelog="Updated metadata",
            created_at=datetime.now(timezone.utc),
        )
        db.add(version)
        await db.commit()
        await db.refresh(dataset)
        return dataset
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(dataset_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.org_id == current_user.org_id)
        result = await db.execute(stmt)
        dataset = result.scalar_one_or_none()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        await db.delete(dataset)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}/versions", response_model=List[DatasetVersionResponse])
async def list_dataset_versions(dataset_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(DatasetVersion).where(DatasetVersion.dataset_id == dataset_id).order_by(DatasetVersion.version.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

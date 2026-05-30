from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.experiment import Experiment
from models.run import Run
from models.metric import Metric
from schemas.experiment import ExperimentResponse, ExperimentCreateRequest, ExperimentUpdateRequest, RunResponse, RunCreateRequest, MetricResponse, MetricCreateRequest
from dependencies import get_current_user
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


@router.get("/", response_model=List[ExperimentResponse])
async def list_experiments(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Experiment).where(Experiment.org_id == current_user.org_id).order_by(Experiment.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ExperimentResponse, status_code=201)
async def create_experiment(req: ExperimentCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        experiment = Experiment(
            id=str(uuid.uuid4()),
            org_id=current_user.org_id,
            **req.model_dump(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(experiment)
        await db.commit()
        await db.refresh(experiment)
        return experiment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(experiment_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Experiment).where(Experiment.id == experiment_id, Experiment.org_id == current_user.org_id)
        result = await db.execute(stmt)
        experiment = result.scalar_one_or_none()
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")

        run_stmt = select(Run).where(Run.experiment_id == experiment_id).order_by(Run.created_at.desc())
        run_result = await db.execute(run_stmt)
        experiment.runs = list(run_result.scalars().all())
        return experiment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(experiment_id: str, req: ExperimentUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Experiment).where(Experiment.id == experiment_id, Experiment.org_id == current_user.org_id)
        result = await db.execute(stmt)
        experiment = result.scalar_one_or_none()
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")

        for field, value in req.model_dump(exclude_unset=True).items():
            setattr(experiment, field, value)
        await db.commit()
        await db.refresh(experiment)
        return experiment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{experiment_id}", status_code=204)
async def delete_experiment(experiment_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Experiment).where(Experiment.id == experiment_id, Experiment.org_id == current_user.org_id)
        result = await db.execute(stmt)
        experiment = result.scalar_one_or_none()
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        await db.delete(experiment)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{experiment_id}/runs", response_model=List[RunResponse])
async def list_runs(experiment_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Run).where(Run.experiment_id == experiment_id).order_by(Run.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{experiment_id}/runs", response_model=RunResponse, status_code=201)
async def create_run(experiment_id: str, req: RunCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Experiment).where(Experiment.id == experiment_id, Experiment.org_id == current_user.org_id)
        result = await db.execute(stmt)
        experiment = result.scalar_one_or_none()
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")

        run = Run(
            id=str(uuid.uuid4()),
            experiment_id=experiment_id,
            **req.model_dump(),
            created_at=datetime.now(timezone.utc),
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)
        return run
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{experiment_id}/runs/{run_id}/best")
async def mark_run_best(experiment_id: str, run_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        run_stmt = select(Run).where(Run.id == run_id, Run.experiment_id == experiment_id)
        run_result = await db.execute(run_stmt)
        run = run_result.scalar_one_or_none()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        other_runs = await db.execute(select(Run).where(Run.experiment_id == experiment_id, Run.id != run_id))
        for other in other_runs.scalars().all():
            other.is_best = False

        run.is_best = True
        await db.commit()
        return {"detail": "Run marked as best"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/runs/{run_id}/metrics", response_model=MetricResponse, status_code=201)
async def log_metrics(run_id: str, req: MetricCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        run_stmt = select(Run).where(Run.id == run_id)
        run_result = await db.execute(run_stmt)
        run = run_result.scalar_one_or_none()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        metric = Metric(
            id=str(uuid.uuid4()),
            run_id=run_id,
            **req.model_dump(),
            created_at=datetime.now(timezone.utc),
        )
        db.add(metric)
        await db.commit()
        await db.refresh(metric)
        return metric
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

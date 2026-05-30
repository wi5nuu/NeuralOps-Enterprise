from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.user import User
from models.evaluation import Evaluation, EvalTypeEnum
from schemas.evaluation import EvaluationResponse, EvaluationCreateRequest
from dependencies import get_current_user
from services.evaluation_service import run_evaluation
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])


@router.get("/", response_model=List[EvaluationResponse])
async def list_evaluations(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Evaluation).where(Evaluation.org_id == current_user.org_id).order_by(Evaluation.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=EvaluationResponse, status_code=201)
async def create_evaluation(req: EvaluationCreateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        eval_result = await run_evaluation(
            eval_type=req.eval_type,
            model_output=req.model_output,
            context=req.context,
            ground_truth=req.ground_truth,
            custom_criteria=req.custom_criteria,
        )

        score = eval_result.get("score", 50)
        issues = eval_result.get("issues", [])
        explanation = eval_result.get("explanation", "")

        evaluation = Evaluation(
            id=str(uuid.uuid4()),
            org_id=current_user.org_id,
            eval_name=req.eval_name,
            eval_type=EvalTypeEnum(req.eval_type),
            model_output=req.model_output,
            context=req.context,
            ground_truth=req.ground_truth,
            custom_criteria=req.custom_criteria,
            score=float(score),
            passed=float(score) >= req.threshold,
            threshold=req.threshold,
            issues={"items": issues},
            explanation=explanation,
            suggestions=", ".join(issues) if issues else None,
            created_at=datetime.now(timezone.utc),
        )
        db.add(evaluation)
        await db.commit()
        await db.refresh(evaluation)
        return evaluation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_evaluation_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        total = await db.execute(select(func.count(Evaluation.id)).where(Evaluation.org_id == current_user.org_id))
        passed = await db.execute(select(func.count(Evaluation.id)).where(Evaluation.org_id == current_user.org_id, Evaluation.passed == True))
        avg_score = await db.execute(select(func.avg(Evaluation.score)).where(Evaluation.org_id == current_user.org_id))

        type_counts = await db.execute(
            select(Evaluation.eval_type, func.count(Evaluation.id)).where(Evaluation.org_id == current_user.org_id).group_by(Evaluation.eval_type)
        )

        return {
            "total": total.scalar() or 0,
            "passed": passed.scalar() or 0,
            "avg_score": round(float(avg_score.scalar() or 0), 2),
            "by_type": {row[0].value: row[1] for row in type_counts.all()},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

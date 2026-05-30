from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.organization import Organization
from schemas.organization import OrganizationResponse, OrganizationUpdateRequest
from dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(Organization).where(Organization.id == current_user.org_id)
        result = await db.execute(stmt)
        org = result.scalar_one_or_none()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/current", response_model=OrganizationResponse)
async def update_current_organization(req: OrganizationUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin)):
    try:
        stmt = select(Organization).where(Organization.id == current_user.org_id)
        result = await db.execute(stmt)
        org = result.scalar_one_or_none()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        if req.name is not None:
            org.name = req.name
        if req.plan is not None:
            org.plan = req.plan
        if req.is_active is not None:
            org.is_active = req.is_active
        await db.commit()
        await db.refresh(org)
        return org
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

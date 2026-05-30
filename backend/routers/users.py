from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User, UserRoleEnum
from models.organization import Organization
from schemas.user import UserResponse, UserUpdateRequest
from dependencies import get_current_user, get_current_admin
from typing import List

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(req: UserUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        if req.name is not None:
            current_user.name = req.name
        if req.email is not None:
            existing = await db.execute(select(User).where(User.email == req.email, User.id != current_user.id))
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already in use")
            current_user.email = req.email
        if req.profile_image_url is not None:
            current_user.profile_image_url = req.profile_image_url
        await db.commit()
        await db.refresh(current_user)
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        stmt = select(User).where(User.org_id == current_user.org_id).order_by(User.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, req: UserUpdateRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin)):
    try:
        stmt = select(User).where(User.id == user_id, User.org_id == current_user.org_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if req.name is not None:
            user.name = req.name
        if req.email is not None:
            existing = await db.execute(select(User).where(User.email == req.email, User.id != user_id))
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = req.email
        if req.is_active is not None:
            user.is_active = req.is_active
        await db.commit()
        await db.refresh(user)
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

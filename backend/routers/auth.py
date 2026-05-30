from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User, UserRoleEnum
from models.organization import Organization
from schemas.auth import LoginRequest, TokenResponse, RefreshRequest, RegisterRequest
from dependencies import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(User).where(User.email == req.email)
        existing = await db.execute(stmt)
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        org = Organization(
            id=str(uuid.uuid4()),
            name=req.organization_name,
            plan="free",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(org)
        await db.flush()

        user = User(
            id=str(uuid.uuid4()),
            org_id=org.id,
            email=req.email,
            name=req.name,
            hashed_password=hash_password(req.password),
            role=UserRoleEnum.ADMIN,
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        access_token = create_access_token(user.id, org.id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(User).where(User.email == req.email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user.is_active:
            raise HTTPException(status_code=401, detail="Account is inactive")

        access_token = create_access_token(user.id, user.org_id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload.get("sub")
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")

        access_token = create_access_token(user.id, user.org_id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

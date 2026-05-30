import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from database import Base, get_db
from main import app
from dependencies import hash_password, create_access_token
from models.user import User, UserRoleEnum
from models.organization import Organization
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session(engine):
    session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)()
    yield session
    await session.rollback()
    await session.close()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_org(db_session):
    org = Organization(id=str(uuid.uuid4()), name="Test Org", plan="free", is_active=True, created_at=datetime.now(timezone.utc))
    db_session.add(org)
    await db_session.flush()
    return org


@pytest_asyncio.fixture
async def test_user(db_session, test_org):
    user = User(id=str(uuid.uuid4()), org_id=test_org.id, email="test@example.com", name="Test User", hashed_password=hash_password("testpass123"), role=UserRoleEnum.ADMIN, is_active=True, created_at=datetime.now(timezone.utc))
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user):
    token = create_access_token(test_user.id, test_user.org_id, test_user.role.value)
    return {"Authorization": f"Bearer {token}"}

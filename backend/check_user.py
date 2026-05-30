import asyncio
from database import async_session_factory
from models.user import User
from sqlalchemy import select

async def run_check():
    async with async_session_factory() as db:
        stmt = select(User).where(User.email == 'wisnualfian117@gmail.com')
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        print(f"User: {user}")

if __name__ == '__main__':
    asyncio.run(run_check())

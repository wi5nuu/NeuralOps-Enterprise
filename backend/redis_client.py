from typing import Optional
import json
import redis.asyncio as redis
from config import settings


class RedisClient:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    async def init(self):
        if settings.redis_url:
            try:
                self.redis = redis.from_url(settings.redis_url, decode_responses=True)
            except Exception:
                self.redis = None

    async def get(self, key: str) -> Optional[str]:
        if not self.redis:
            return None
        try:
            return await self.redis.get(key)
        except Exception:
            return None

    async def set(self, key: str, value: str, ttl: int = 300):
        if not self.redis:
            return
        try:
            await self.redis.set(key, value, ex=ttl)
        except Exception:
            pass

    async def delete(self, key: str):
        if not self.redis:
            return
        try:
            await self.redis.delete(key)
        except Exception:
            pass

    async def cache_get(self, key: str) -> Optional[dict]:
        data = await self.get(key)
        if data:
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return None
        return None

    async def cache_set(self, key: str, data: dict, ttl: int = 300):
        await self.set(key, json.dumps(data), ttl)

    async def cache_delete(self, key: str):
        await self.delete(key)


redis_client = RedisClient()

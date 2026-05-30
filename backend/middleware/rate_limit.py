from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from redis_client import redis_client
from config import settings
import time


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not settings.redis_url:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        key = f"rate_limit:{client_ip}:{path}"

        current = await redis_client.get(key)
        if current and int(current) > 100:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
            )

        if not redis_client.redis:
            return await call_next(request)

        pipe = redis_client.redis.pipeline()
        await pipe.incr(key)
        await pipe.expire(key, 60)
        await pipe.execute()

        return await call_next(request)

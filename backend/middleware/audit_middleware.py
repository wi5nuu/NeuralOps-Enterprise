from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ["/health", "/metrics", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)

        response = await call_next(request)

        user_id = getattr(request.state, "user_id", None)
        if user_id:
            logger.info(
                "Audit: user=%s method=%s path=%s status=%d",
                user_id,
                request.method,
                request.url.path,
                response.status_code,
            )

        return response

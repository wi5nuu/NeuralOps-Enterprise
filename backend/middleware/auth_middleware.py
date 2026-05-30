from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from jose import JWTError, jwt
from config import settings


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ["/docs", "/openapi.json", "/redoc", "/health", "/metrics"]:
            return await call_next(request)

        if request.url.path.startswith("/api/auth/"):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
                request.state.user_id = payload.get("sub")
                request.state.org_id = payload.get("org_id")
                request.state.role = payload.get("role")
            except JWTError:
                pass

        return await call_next(request)

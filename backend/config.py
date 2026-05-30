from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    app_name: str = "NeuralOps Enterprise"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True

    anthropic_api_key: str = ""
    openai_api_key: str = ""

    database_url: str = "sqlite+aiosqlite:///./neuralops.db"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "your-super-secret-jwt-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    mlflow_tracking_uri: str = "http://localhost:5000"

    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    log_level: str = "INFO"

    file_upload_max_size: int = 50 * 1024 * 1024
    allowed_extensions: List[str] = [".pdf", ".txt", ".docx", ".csv"]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()

if settings.environment == "development":
    print(f"[Config] Loaded {settings.app_name} v{settings.app_version} - {settings.environment}")

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    environment: str = "development"

    # PostgreSQL is the frozen database choice (MONSOONCOVER_SPEC.md §11.2).
    # SQLite is used only as a dependency-free test substrate — see tests/conftest.py.
    database_url: str = "postgresql+psycopg://monsooncover:monsooncover@localhost:5432/monsooncover"

    jwt_secret_key: str = "change-me-in-env-file"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5183"]


settings = Settings()

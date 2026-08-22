from functools import lru_cache
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_WEAK_SECRETS = {"change-me", "change-me-to-a-long-random-secret", "secret", "password", ""}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "GlobeTrotter API"
    debug: bool = False
    database_url: str
    secret_key: str  # Required — no default; must be set via env var
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = "uploads"

    @model_validator(mode="after")
    def _validate_secret_key(self) -> "Settings":
        if self.secret_key in _WEAK_SECRETS:
            raise ValueError(
                "SECRET_KEY is set to a known weak default. "
                "Please set a strong, random SECRET_KEY (at least 32 characters)."
            )
        if len(self.secret_key) < 32:
            raise ValueError(
                f"SECRET_KEY is too short ({len(self.secret_key)} chars). "
                "It must be at least 32 characters."
            )
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def upload_dir_path(self) -> Path:
        path = Path(self.upload_dir)
        if not path.is_absolute():
            path = Path(__file__).resolve().parents[2] / path
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()

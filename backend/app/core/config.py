from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "GlobeTrotter API"
    debug: bool = False
    database_url: str
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = "uploads"

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

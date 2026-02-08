"""
Camp Connect - Application Configuration
Loads environment variables via pydantic-settings.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # Database (direct Postgres connection to Supabase)
    database_url: str = ""

    # Application
    app_name: str = "Camp Connect"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-this-in-production"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://camp-connect-pi.vercel.app",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


settings = Settings()

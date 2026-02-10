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

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""  # The Twilio phone number to send from

    # SendGrid
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "noreply@campconnect.com"
    sendgrid_from_name: str = "Camp Connect"

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    # Anthropic (Claude AI Insights)
    anthropic_api_key: str = ""
    ai_model: str = "claude-sonnet-4-20250514"
    ai_max_tokens: int = 4096

    # AWS Rekognition (facial recognition for camper photos)
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"

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

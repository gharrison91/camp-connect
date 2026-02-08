"""
Camp Connect - Database Configuration
Async SQLAlchemy engine and session factory for Supabase Postgres.
"""

from __future__ import annotations

from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


def _get_async_url(url: str) -> str:
    """Convert a standard PostgreSQL URL to asyncpg format."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def create_engine() -> Optional[AsyncEngine]:
    """Create the async SQLAlchemy engine if DATABASE_URL is configured."""
    if not settings.database_url:
        return None
    return create_async_engine(
        _get_async_url(settings.database_url),
        echo=settings.debug,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )


engine: Optional[AsyncEngine] = create_engine()

# Session factory — will be None if no engine
async_session_factory: Optional[async_sessionmaker] = None
if engine is not None:
    async_session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    if async_session_factory is None:
        raise RuntimeError(
            "Database not configured. Set DATABASE_URL in your .env file."
        )
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()

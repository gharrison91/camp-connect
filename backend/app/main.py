"""
Camp Connect - Registration & Event Management Platform
FastAPI Backend Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Camp Connect API",
    description="Registration & Event Management Platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "name": "Camp Connect API",
        "version": "0.1.0",
        "status": "operational",
    }


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}

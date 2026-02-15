"""
API v1 Package
"""

from fastapi import APIRouter
from .voice import router as voice_router
from .admin import router as admin_router

# Create main v1 router
router = APIRouter(prefix="/v1")

# Include sub-routers
router.include_router(voice_router, prefix="/voice", tags=["voice"])
router.include_router(admin_router, prefix="/admin", tags=["admin"])

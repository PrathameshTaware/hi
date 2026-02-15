"""
Admin API Endpoints
Provides system statistics and monitoring data
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()


class SystemStats(BaseModel):
    """System statistics response model"""
    total_queries: int
    scams_blocked: int
    cache_hit_rate: float
    avg_latency_ms: int
    uptime_seconds: int
    active_users: int
    timestamp: str


# Mock stats (TODO: Replace with real metrics from database)
_stats = {
    "total_queries": 1247,
    "scams_blocked": 89,
    "cache_hit_rate": 67.5,
    "avg_latency_ms": 124,
    "start_time": datetime.now()
}


async def verify_admin_key(x_admin_api_key: Optional[str] = Header(None)):
    """Verify admin API key"""
    from app.core.config import settings
    
    if not x_admin_api_key:
        raise HTTPException(status_code=401, detail="Admin API key required")
    
    if x_admin_api_key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin API key")
    
    return True


@router.get("/stats", response_model=SystemStats)
async def get_system_stats(authorized: bool = Depends(verify_admin_key)):
    """
    Get system-wide statistics
    
    Requires admin authentication via X-Admin-API-Key header
    """
    try:
        uptime = (datetime.now() - _stats["start_time"]).total_seconds()
        
        return SystemStats(
            total_queries=_stats["total_queries"],
            scams_blocked=_stats["scams_blocked"],
            cache_hit_rate=_stats["cache_hit_rate"],
            avg_latency_ms=_stats["avg_latency_ms"],
            uptime_seconds=int(uptime),
            active_users=0,  # TODO: Track from WebSocket connections
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")


@router.get("/health")
async def admin_health():
    """Health check for admin service"""
    return {
        "status": "healthy",
        "service": "admin"
    }

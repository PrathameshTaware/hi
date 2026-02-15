"""
Voice API Endpoints
Handles voice query processing and streaming
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class VoiceQueryRequest(BaseModel):
    """Request model for voice query processing"""
    user_id: str = Field(..., description="Unique user identifier")
    query: str = Field(..., min_length=1, max_length=1000, description="User query text")
    language: str = Field(default="en", pattern="^(en|hi)$", description="Language code")
    offline_mode: bool = Field(default=False, description="Enable offline fallback mode")


class VoiceQueryResponse(BaseModel):
    """Response model for voice query"""
    text: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    risk_level: str = Field(..., pattern="^(low|medium|high)$")
    sources: list[str]
    risk_flags: list[str]
    intent: str
    timestamp: str


@router.post("/query", response_model=VoiceQueryResponse)
async def process_voice_query(request: VoiceQueryRequest):
    """
    Process a voice query through the AI orchestrator
    
    This endpoint:
    1. Validates the input
    2. Runs through LangGraph orchestrator
    3. Returns AI response with metadata
    """
    try:
        # TODO: Get orchestrator instance from app state
        # For now, create a new instance (not optimal for production)
        from app.services.ai.orchestrator import AIOrchestrator
        from app.core.telemetry import TelemetryManager
        
        telemetry = TelemetryManager()
        await telemetry.initialize()
        
        orchestrator = AIOrchestrator(telemetry)
        await orchestrator.initialize()
        
        # Process the query
        result = await orchestrator.process_query(
            user_id=request.user_id,
            query=request.query,
            language=request.language,
            offline_mode=request.offline_mode
        )
        
        return VoiceQueryResponse(
            text=result["text"],
            confidence=result["confidence"],
            risk_level=result["riskLevel"],
            sources=result["sources"],
            risk_flags=result["riskFlags"],
            intent=result["intent"],
            timestamp=result["timestamp"]
        )
        
    except Exception as e:
        logger.error(f"Error processing voice query: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to process query",
                "message": str(e),
                "error_code": "PROCESSING_ERROR"
            }
        )


@router.get("/health")
async def voice_health():
    """Health check for voice service"""
    return {
        "status": "healthy",
        "service": "voice",
        "capabilities": ["stt", "llm", "tts"]
    }

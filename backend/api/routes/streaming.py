"""
Streaming API Routes - REAL STREAMING IMPLEMENTATION
Server-Sent Events for real-time AI processing updates
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import asyncio
import json
import logging
from datetime import datetime

from core.validators import VoiceInputValidator
from core.exceptions import ValidationError, VoiceProcessingError

logger = logging.getLogger(__name__)
router = APIRouter()

class StreamingRequest(BaseModel):
    text: str
    user_id: Optional[str] = "anonymous"
    language: Optional[str] = "hi"

@router.post("/stream-text")
async def stream_text_processing(request: StreamingRequest):
    """Stream text processing through AI pipeline with real-time updates"""
    
    async def generate_stream():
        try:
            # Import here to avoid circular imports
            from main import ai_orchestrator, telemetry_manager
            
            # Validate input
            validator = VoiceInputValidator(
                text=request.text,
                user_id=request.user_id,
                language=request.language
            )
            
            # Convert text to mock audio for processing
            mock_audio = request.text.encode('utf-8')
            
            # Stream the processing
            async for event in ai_orchestrator.stream_response(mock_audio, request.user_id):
                # Format as Server-Sent Events
                yield f"data: {json.dumps(event)}\n\n"
                
                # Small delay to make streaming visible
                await asyncio.sleep(0.1)
                
        except ValidationError as e:
            error_event = {
                "type": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_event)}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            error_event = {
                "type": "error", 
                "error": "Streaming failed",
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@router.get("/stream-demo")
async def stream_demo():
    """Demo streaming endpoint for testing"""
    
    async def demo_stream():
        # Simulate AI processing steps
        steps = [
            {"step": "safety_check", "message": "Checking content safety..."},
            {"step": "intent_router", "message": "Analyzing user intent..."},
            {"step": "retrieve_context", "message": "Retrieving relevant context..."},
            {"step": "generate_response", "message": "Generating AI response..."},
            {"step": "post_process", "message": "Processing final output..."}
        ]
        
        for i, step in enumerate(steps):
            event = {
                "type": "step",
                "step": step["step"],
                "message": step["message"],
                "progress": (i + 1) / len(steps),
                "timestamp": datetime.now().isoformat()
            }
            
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(1)  # 1 second delay per step
        
        # Final result
        final_event = {
            "type": "complete",
            "result": {
                "success": True,
                "response": "साइबर सुरक्षा के लिए मजबूत पासवर्ड का उपयोग करें और संदिग्ध लिंक पर क्लिक न करें।",
                "intent": "cybersecurity_education",
                "confidence": 0.92
            },
            "timestamp": datetime.now().isoformat()
        }
        
        yield f"data: {json.dumps(final_event)}\n\n"
    
    return StreamingResponse(
        demo_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive", 
            "Content-Type": "text/event-stream"
        }
    )
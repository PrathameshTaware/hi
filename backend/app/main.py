"""
SatyaSetu Backend - FastAPI Entry Point
Voice-first rural cyber-defense system
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
import logging
from datetime import datetime

from app.core.config import settings
from app.core.telemetry import TelemetryManager
from app.services.ai.orchestrator import AIOrchestrator
from app.api.v1 import router as api_v1_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances
telemetry_manager = TelemetryManager()
ai_orchestrator = AIOrchestrator(telemetry_manager)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 SatyaSetu Backend Starting...")
    try:
        await telemetry_manager.initialize()
        await ai_orchestrator.initialize()
        logger.info("✅ All services initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 SatyaSetu Backend Shutting Down...")
    try:
        await telemetry_manager.cleanup()
        await ai_orchestrator.cleanup()
        logger.info("✅ Cleanup completed successfully")
    except Exception as e:
        logger.error(f"❌ Error during cleanup: {e}")


app = FastAPI(
    title="SatyaSetu API",
    description="Voice-first rural cyber-defense system with AI orchestration",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(api_v1_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "message": "SatyaSetu Backend Active",
        "timestamp": datetime.now().isoformat(),
        "status": "ready",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "orchestrator": ai_orchestrator.initialized if hasattr(ai_orchestrator, 'initialized') else False,
            "telemetry": len(telemetry_manager.clients) > 0
        },
        "timestamp": datetime.now().isoformat()
    }


@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    """Real-time telemetry feed for admin dashboard"""
    await websocket.accept()
    client_id = f"client_{datetime.now().timestamp()}"
    
    try:
        # Register client for telemetry updates
        await telemetry_manager.add_client(client_id, websocket)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                # Echo back for heartbeat
                await websocket.send_text(json.dumps({
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat()
                }))
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        await telemetry_manager.remove_client(client_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )

"""Video Editor API Routes"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import asyncio
import uuid

from services_video_editor import (
    VideoProcessingPipeline,
    SceneDetectionService,
    CaptionGenerationService,
    ThumbnailGenerationService,
    ExportService,
    VideoEditorOrchestrator,
    Platform,
)

router = APIRouter()

# Singleton services
orchestrator = VideoEditorOrchestrator()
export_service = ExportService()


class AnalyzeVideoRequest(BaseModel):
    video_id: str
    analyze_scenes: bool = True
    generate_captions: bool = True
    generate_thumbnails: bool = True


class ExportVideoRequest(BaseModel):
    video_id: str
    platforms: List[str]
    include_captions: bool = True
    auto_select_thumbnail: bool = True


# Why: In-memory video storage for demo
VIDEO_STORAGE: Dict[str, Dict] = {}


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload video for processing"""
    
    # Why: Generate unique ID
    video_id = str(uuid.uuid4())
    
    # Why: Mock file processing for demo stability
    video_data = {
        "video_id": video_id,
        "filename": file.filename,
        "size_bytes": 0,  # Would be file.size in production
        "uploaded_at": datetime.utcnow().isoformat(),
        "status": "uploaded",
    }
    
    VIDEO_STORAGE[video_id] = video_data
    
    return {
        "status": "success",
        "video": video_data,
        "message": "Video uploaded successfully",
    }


@router.post("/analyze")
async def analyze_video(request: AnalyzeVideoRequest):
    """Analyze video with AI"""
    
    if request.video_id not in VIDEO_STORAGE:
        raise HTTPException(404, "Video not found")
    
    video_data = VIDEO_STORAGE[request.video_id]
    
    # Why: Mock metadata for demo
    video_metadata = {
        "duration_seconds": 60,
        "resolution": "1920x1080",
        "fps": 30,
        "codec": "h264",
        "bitrate": 5000,
    }
    
    # Why: Run full analysis pipeline
    analysis_result = await orchestrator.process_video(
        video_path=f"/tmp/{video_data['filename']}",
        video_metadata=video_metadata,
        export_platforms=[Platform.INSTAGRAM, Platform.YOUTUBE],
    )
    
    # Why: Store analysis results
    VIDEO_STORAGE[request.video_id]["analysis"] = analysis_result
    
    return {
        "status": "success",
        "analysis": analysis_result.get("processing_result", {}),
        "video_id": request.video_id,
    }


@router.post("/export")
async def export_video(request: ExportVideoRequest):
    """Export video for platforms"""
    
    if request.video_id not in VIDEO_STORAGE:
        raise HTTPException(404, "Video not found")
    
    # Why: Convert platforms to enum
    platform_enums = []
    for p in request.platforms:
        try:
            platform_enums.append(Platform(p.lower()))
        except ValueError:
            continue
    
    if not platform_enums:
        raise HTTPException(400, "No valid platforms specified")
    
    # Why: Batch export
    exports = await export_service.batch_export(
        video_path=f"/tmp/{VIDEO_STORAGE[request.video_id]['filename']}",
        platforms=platform_enums,
    )
    
    return {
        "status": "processing",
        "video_id": request.video_id,
        "exports": exports.get("exports", []),
        "estimated_completion": "2 minutes",
    }


@router.get("/{video_id}/status")
async def get_video_status(video_id: str):
    """Get video processing status"""
    
    if video_id not in VIDEO_STORAGE:
        raise HTTPException(404, "Video not found")
    
    return {
        "status": "success",
        "video": VIDEO_STORAGE[video_id],
    }


@router.get("/templates")
async def get_video_templates():
    """Get available video templates"""
    
    # Why: Mock templates for demo
    templates = [
        {
            "id": "template_1",
            "name": "Quick Intro",
            "duration": 15,
            "style": "modern",
            "thumbnail": "/templates/intro.jpg",
        },
        {
            "id": "template_2",
            "name": "Product Showcase",
            "duration": 30,
            "style": "professional",
            "thumbnail": "/templates/showcase.jpg",
        },
        {
            "id": "template_3",
            "name": "Tutorial",
            "duration": 60,
            "style": "educational",
            "thumbnail": "/templates/tutorial.jpg",
        },
    ]
    
    return {
        "status": "success",
        "templates": templates,
        "count": len(templates),
    }

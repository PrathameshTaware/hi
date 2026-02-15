"""Social Engine API Routes"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import asyncio

from services_social_engine import (
    ContentGenerationService,
    SchedulingService,
    Platform,
)

router = APIRouter()

# Global service instances
content_service = ContentGenerationService()
scheduling_service = SchedulingService()


class GenerateContentRequest(BaseModel):
    brand_id: str
    topic: str
    platforms: List[str]
    tone: str = "professional"
    campaign_goal: str = "engagement"


class PostData(BaseModel):
    id: str
    content: str
    author: str
    timestamp: str
    likes: int = 0
    comments: int = 0
    platform: str


@router.post("/generate-content")
async def generate_content(request: GenerateContentRequest):
    """Generate AI content for platforms"""
    
    # Convert platforms to enum
    platform_enums = []
    for p in request.platforms:
        try:
            platform_enums.append(Platform(p.lower()))
        except ValueError:
            continue
    
    if not platform_enums:
        raise HTTPException(400, "No valid platforms")
    
    # Mock brand data
    brand_keywords = ["innovation", "technology", "future"]
    audience_persona = {"age": "25-45", "interests": ["tech", "business"]}
    
    try:
        # Batch generation
        content_package = await content_service.generate_complete_content(
            brand_name=request.brand_id,
            brand_keywords=brand_keywords,
            tone=request.tone,
            audience_persona=audience_persona,
            platforms=platform_enums,
            topic=request.topic,
            campaign_goal=request.campaign_goal,
        )
        
        return {
            "status": "success",
            "content_package": content_package,
            "generated_at": datetime.utcnow().isoformat(),
        }
    
    except Exception as e:
        raise HTTPException(500, f"Content generation failed: {str(e)}")


@router.get("/feed")
async def get_social_feed(user_id: str = "demo_user", limit: int = 20):
    """Get social feed with AI posts"""
    
    # Mock feed data
    mock_posts = [
        {
            "id": f"post_{i}",
            "content": f"AI-generated post about innovation #{i}",
            "author": "SatyaSetu AI",
            "timestamp": datetime.utcnow().isoformat(),
            "likes": 42 + i * 3,
            "comments": 12 + i,
            "platform": "instagram",
            "engagement_score": 0.85 - (i * 0.02),
        }
        for i in range(limit)
    ]
    
    return {
        "status": "success",
        "feed": mock_posts,
        "user_id": user_id,
        "total": len(mock_posts),
    }


@router.post("/posts")
async def create_post(post: PostData):
    """Create a new social media post"""
    
    # Why: Simulate post creation
    return {
        "status": "success",
        "post": {
            **post.dict(),
            "created_at": datetime.utcnow().isoformat(),
        },
    }


@router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user_id: str = "demo_user"):
    """Like a post"""
    
    return {
        "status": "success",
        "post_id": post_id,
        "liked": True,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/analytics")
async def get_analytics(user_id: str = "demo_user"):
    """Get social media analytics"""
    
    # Why: Mock analytics for demo
    return {
        "status": "success",
        "analytics": {
            "total_posts": 24,
            "avg_engagement_rate": 4.5,
            "total_reach": 45000,
            "best_platform": "instagram",
            "top_performing_post": {
                "id": "post_1",
                "engagement": 8.2,
                "platform": "instagram",
            },
        },
    }

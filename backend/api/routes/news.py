"""News Feed API Routes"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import random

from services_news_feed import (
    NLPPipeline,
    RecommendationEngine,
    UserProfileManager,
    FeedAssemblyService,
)

router = APIRouter()

# Singleton services
nlp_pipeline = NLPPipeline()
recommendation_engine = RecommendationEngine()
user_profile_manager = UserProfileManager()
feed_service = FeedAssemblyService()


class TrackClickRequest(BaseModel):
    user_id: str
    article_id: str
    action: str  # click, like, share, comment
    read_time_seconds: int = 0
    scroll_depth: float = 0.0


# Why: Mock news data for demo stability
MOCK_ARTICLES = [
    {
        "id": f"article_{i}",
        "title": f"Breaking: AI Advances in Cybersecurity #{i}",
        "source": "Tech News Daily",
        "category": random.choice(["technology", "business", "health", "science"]),
        "excerpt": "Latest developments in AI-powered threat detection...",
        "published_date": (datetime.utcnow() - timedelta(hours=i)).isoformat(),
        "tags": ["ai", "cybersecurity", "technology"],
        "embedding": [random.random() for _ in range(10)],  # Why: Simplified for demo
        "engagement_score": 0.9 - (i * 0.05),
    }
    for i in range(50)
]


@router.get("/")
async def get_news_feed(user_id: str = "demo_user", limit: int = 20):
    """Get personalized news feed"""
    
    # Why: Mock user profile for demo
    user_profile = {
        "user_id": user_id,
        "interests": ["technology", "ai", "cybersecurity"],
        "interests_embedding": [random.random() for _ in range(10)],
        "behavior_history": [],
    }
    
    # Why: Rank articles using recommendation engine
    ranked_articles = recommendation_engine.rank_articles(
        articles=MOCK_ARTICLES,
        user_interests=user_profile["interests"],
        user_interests_embedding=user_profile["interests_embedding"],
        user_behavior=user_profile["behavior_history"],
        limit=limit,
    )
    
    return {
        "status": "success",
        "feed": ranked_articles,
        "user_id": user_id,
        "total": len(ranked_articles),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.post("/track-click")
async def track_article_click(request: TrackClickRequest):
    """Track user interaction with article"""
    
    # Why: Log interaction for personalization
    return {
        "status": "success",
        "tracked": True,
        "user_id": request.user_id,
        "article_id": request.article_id,
        "action": request.action,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/trending")
async def get_trending_articles(limit: int = 5):
    """Get trending articles"""
    
    # Why: Sort by engagement score
    trending = sorted(
        MOCK_ARTICLES,
        key=lambda x: x["engagement_score"],
        reverse=True,
    )[:limit]
    
    return {
        "status": "success",
        "trending": trending,
        "count": len(trending),
    }


@router.get("/categories")
async def get_categories():
    """Get available news categories"""
    
    return {
        "status": "success",
        "categories": [
            {"id": "technology", "label": "Technology", "count": 15},
            {"id": "business", "label": "Business", "count": 12},
            {"id": "health", "label": "Health", "count": 8},
            {"id": "science", "label": "Science", "count": 10},
        ],
    }


@router.post("/analyze-article")
async def analyze_article(title: str, content: str):
    """Analyze article with NLP"""
    
    # Why: Extract tags and sentiment
    tags = await nlp_pipeline.extract_tags(title, content)
    
    return {
        "status": "success",
        "analysis": tags,
        "analyzed_at": datetime.utcnow().isoformat(),
    }

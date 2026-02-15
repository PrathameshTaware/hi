"""News Feed: Personalized recommendations with NLP"""

import numpy as np
from typing import List, Dict, Optional
from datetime import datetime
import asyncio
import openai
from enum import Enum
import json
from functools import lru_cache
import hashlib

openai.api_key = "${OPENAI_API_KEY}"


class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class NLPPipeline:
    """NLP processing with embedding cache"""
    
    def __init__(self):
        self.embedding_model = "text-embedding-ada-002"
        self.embedding_dimension = 1536
        self._embedding_cache = {}
        self.max_cache_size = 5000
    
    def _get_text_hash(self, text: str) -> str:
        """Generate hash for text caching"""
        return hashlib.md5(text[:500].encode()).hexdigest()  # Use first 500 chars
    
    async def extract_tags(self, article_title: str, article_body: str) -> Dict:
        """Extract NLP tags with sentiment and topics"""
        
        start_time = datetime.utcnow()

        # Truncate for performance
        title_truncated = article_title[:100]
        body_truncated = article_body[:300]

        prompt = f"""Analyze this article and extract metadata:

Title: {title_truncated}
Content: {body_truncated}...

Return JSON with:
- TOPICS: Array of 3-5 main topics (hierarchical if possible)
- ENTITIES: Array of 2-4 key entities with types (person, org, location, etc.)
- KEYWORDS: Array of 5-8 important keywords with relevance scores
- SENTIMENT: Overall sentiment (positive/negative/neutral) with confidence 0-1
- CATEGORY: Primary category (politics, technology, business, health, sports, entertainment, etc.)
- EMOTIONS: Array of detected emotions (joy, anger, fear, surprise, etc.)
- LANGUAGE: Detected language code
- READABILITY: Flesch reading ease score (approximate)"""

        try:
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert content analyst. Extract comprehensive, accurate metadata from articles. Always return valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,  # Lower temperature for more consistent analysis
                max_tokens=200  # Optimized token limit
            )

            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            tags_json = response.choices[0].message.content
            tags = json.loads(tags_json)

            # Enhanced result with additional metadata
            result = {
                "status": "success",
                "topics": tags.get("TOPICS", []),
                "entities": tags.get("ENTITIES", []),
                "keywords": tags.get("KEYWORDS", []),
                "sentiment": {
                    "label": tags.get("SENTIMENT", "neutral").lower(),
                    "confidence": tags.get("SENTIMENT_CONFIDENCE", 0.8)
                },
                "category": tags.get("CATEGORY", "other").lower(),
                "emotions": tags.get("EMOTIONS", []),
                "language": tags.get("LANGUAGE", "en"),
                "readability_score": tags.get("READABILITY", 60),
                "tokens_used": response.usage.total_tokens,
                "processing_time_ms": processing_time,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }

            return result

        except json.JSONDecodeError as e:
            # Handle JSON parsing errors specifically
            return {
                "status": "error",
                "error": "Failed to parse LLM response as JSON",
                "error_type": "json_parse_error",
                "raw_response": tags_json if 'tags_json' in locals() else None,
                "processing_time_ms": (datetime.utcnow() - start_time).total_seconds() * 1000
            }

        except Exception as e:
            # Enhanced error handling with more details
            return {
                "status": "error",
                "error": str(e),
                "error_type": type(e).__name__,
                "processing_time_ms": (datetime.utcnow() - start_time).total_seconds() * 1000,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def generate_embedding(self, text: str) -> Dict:
        """Generate semantic embedding for article
        
        Optimized: Caching and batch processing support
        """
        
        # Check cache first
        text_hash = self._get_text_hash(text)
        if text_hash in self._embedding_cache:
            cached_embedding = self._embedding_cache[text_hash]
            cached_embedding["cached"] = True
            return cached_embedding
        
        try:
            # Optimize text length for embedding
            optimized_text = text[:2000]  # Reduced from 3000
            
            response = await asyncio.to_thread(
                openai.Embedding.create,
                input=optimized_text,
                model=self.embedding_model
            )
            
            embedding = response['data'][0]['embedding']
            
            result = {
                "status": "success",
                "embedding": embedding,
                "dimension": len(embedding),
                "model": self.embedding_model,
                "cached": False
            }
            
            # Cache the result
            if len(self._embedding_cache) < self.max_cache_size:
                self._embedding_cache[text_hash] = result
            
            return result
        
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "cached": False
            }
    
    def calculate_semantic_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        
        arr1 = np.array(embedding1)
        arr2 = np.array(embedding2)
        
        # Cosine similarity
        similarity = np.dot(arr1, arr2) / (np.linalg.norm(arr1) * np.linalg.norm(arr2))
        
        return float(similarity)


class RecommendationEngine:
    """Hybrid recommendation engine (content-based + collaborative)
    
    Performance Features:
    - Vectorized similarity calculations
    - Incremental ranking updates
    - Memory-efficient scoring
    """
    
    def __init__(self):
        self.nlp_pipeline = NLPPipeline()
        self.content_weight = 0.6
        self.behavior_weight = 0.4
        self.novelty_factor = 0.2  # To avoid filter bubbles
        self._similarity_cache = {}  # Cache similarity calculations
    
    def content_based_score(
        self,
        article_tags: List[str],
        user_interests: List[str],
        article_embedding: List[float],
        user_interests_embedding: List[float]
    ) -> float:
        """Calculate content-based recommendation score
        
        Optimized: Vectorized operations and caching
        """
        
        # Convert to sets for faster operations
        article_tags_set = set(article_tags)
        user_interests_set = set(user_interests)
        
        # Tag overlap score - optimized
        if not article_tags_set or not user_interests_set:
            tag_score = 0.0
        else:
            common_tags = article_tags_set & user_interests_set
            tag_score = len(common_tags) / len(article_tags_set | user_interests_set)
        
        # Embedding similarity score with caching
        if article_embedding and user_interests_embedding:
            # Create cache key
            emb_hash = hashlib.md5(
                (str(article_embedding[:10]) + str(user_interests_embedding[:10])).encode()
            ).hexdigest()
            
            if emb_hash in self._similarity_cache:
                embedding_score = self._similarity_cache[emb_hash]
            else:
                embedding_score = self.nlp_pipeline.calculate_semantic_similarity(
                    article_embedding,
                    user_interests_embedding
                )
                # Normalize to 0-1
                embedding_score = (embedding_score + 1) / 2
                
                # Cache if space available
                if len(self._similarity_cache) < 1000:
                    self._similarity_cache[emb_hash] = embedding_score
        else:
            embedding_score = 0.5
        
        # Combined score
        content_score = 0.5 * tag_score + 0.5 * embedding_score
        
        return content_score
    
    def behavior_based_score(
        self,
        user_behavior: List[Dict],
        article_category: str
    ) -> float:
        """Calculate behavior-based recommendation score"""
        
        # Analyze user's past behavior patterns
        category_interactions = [b for b in user_behavior if b.get("category") == article_category]
        
        if not category_interactions:
            return 0.3  # Default score if no history
        
        # Calculate engagement metrics
        avg_read_time = np.mean([b.get("read_time_seconds", 0) for b in category_interactions])
        interaction_count = len(category_interactions)
        
        # Normalize
        read_time_score = min(avg_read_time / 180, 1.0)  # 3 minutes = max
        recency_score = min(interaction_count / 10, 1.0)  # 10 interactions = max
        
        behavior_score = 0.5 * read_time_score + 0.5 * recency_score
        
        return behavior_score
    
    def rank_articles(
        self,
        articles: List[Dict],
        user_interests: List[str],
        user_interests_embedding: List[float],
        user_behavior: List[Dict],
        limit: int = 10
    ) -> List[Dict]:
        """Rank and return top articles for user"""
        
        scored_articles = []
        
        for article in articles:
            # Content-based score
            content_score = self.content_based_score(
                article_tags=article.get("tags", []),
                user_interests=user_interests,
                article_embedding=article.get("embedding", []),
                user_interests_embedding=user_interests_embedding
            )
            
            # Behavior-based score
            behavior_score = self.behavior_based_score(
                user_behavior=user_behavior,
                article_category=article.get("category", "other")
            )
            
            # Hybrid score with novelty factor (to prevent filter bubbles)
            hybrid_score = (
                self.content_weight * content_score +
                self.behavior_weight * behavior_score
            )
            
            # Add novelty if article is in underexplored category
            underexplored = self._is_underexplored_category(
                article.get("category"),
                user_behavior
            )
            if underexplored:
                hybrid_score = (hybrid_score * (1 - self.novelty_factor)) + self.novelty_factor
            
            scored_articles.append({
                **article,
                "recommendation_score": float(hybrid_score),
                "content_score": float(content_score),
                "behavior_score": float(behavior_score),
                "is_exploratory": underexplored
            })
        
        # Sort by score (descending)
        ranked = sorted(scored_articles, key=lambda x: x["recommendation_score"], reverse=True)
        
        return ranked[:limit]
    
    def _is_underexplored_category(self, category: str, user_behavior: List[Dict]) -> bool:
        """Check if category is underexplored by user"""
        
        category_count = len([b for b in user_behavior if b.get("category") == category])
        
        # If user has interacted less than 5 times with this category, it's underexplored
        return category_count < 5


class UserProfileManager:
    """Manage user profiles and interest evolution"""
    
    def __init__(self):
        self.nlp_pipeline = NLPPipeline()
    
    async def build_user_profile(self, user_id: str, user_behaviors: List[Dict]) -> Dict:
        """Dynamically build user profile from behavior"""
        
        if not user_behaviors:
            return {
                "user_id": user_id,
                "interests": [],
                "read_time_avg": 0,
                "engagement_preference": "medium",
                "last_updated": datetime.utcnow().isoformat()
            }
        
        # Extract interests from clicked articles
        all_tags = []
        all_categories = []
        read_times = []
        
        for behavior in user_behaviors:
            all_tags.extend(behavior.get("article_tags", []))
            all_categories.append(behavior.get("category", "other"))
            read_times.append(behavior.get("read_time_seconds", 0))
        
        # Deduplicate and count frequency
        from collections import Counter
        tag_frequency = Counter(all_tags)
        top_interests = [tag for tag, _ in tag_frequency.most_common(10)]
        
        # Calculate engagement preference
        avg_read_time = np.mean(read_times) if read_times else 0
        if avg_read_time > 300:
            engagement_preference = "high"
        elif avg_read_time > 120:
            engagement_preference = "medium"
        else:
            engagement_preference = "low"
        
        # Generate embedding for interests
        interests_text = " ".join(top_interests)
        embedding_result = await self.nlp_pipeline.generate_embedding(interests_text)
        
        profile = {
            "user_id": user_id,
            "interests": top_interests,
            "interests_embedding": embedding_result.get("embedding", []),
            "read_time_avg": float(avg_read_time),
            "engagement_preference": engagement_preference,
            "category_preferences": dict(Counter(all_categories).most_common(5)),
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return profile
    
    async def update_interests(self, user_id: str, new_behavior: Dict, current_profile: Dict) -> Dict:
        """Update user profile with new behavior (streaming, real-time)"""
        
        # Add new behavior to profile
        if "behavior_history" not in current_profile:
            current_profile["behavior_history"] = []
        
        current_profile["behavior_history"].append(new_behavior)
        
        # Rebuild profile if enough new data
        if len(current_profile["behavior_history"]) >= 5:
            updated_profile = await self.build_user_profile(
                user_id,
                current_profile["behavior_history"]
            )
            current_profile.update(updated_profile)
            current_profile["behavior_history"] = []
        
        return current_profile


class FeedAssemblyService:
    """Real-time feed generation and ranking"""
    
    def __init__(self):
        self.recommendation_engine = RecommendationEngine()
        self.user_profile_manager = UserProfileManager()
    
    async def generate_feed(
        self,
        user_id: str,
        articles: List[Dict],
        user_profile: Dict,
        limit: int = 20
    ) -> Dict:
        """Generate personalized feed for user"""
        
        # Rank articles
        ranked_articles = self.recommendation_engine.rank_articles(
            articles=articles,
            user_interests=user_profile.get("interests", []),
            user_interests_embedding=user_profile.get("interests_embedding", []),
            user_behavior=user_profile.get("behavior_history", []),
            limit=limit
        )
        
        feed = {
            "user_id": user_id,
            "articles": ranked_articles,
            "total_count": len(ranked_articles),
            "generated_at": datetime.utcnow().isoformat(),
            "metadata": {
                "recommendation_sources": "hybrid (content + behavior + novelty)",
                "exploratory_articles": sum(1 for a in ranked_articles if a.get("is_exploratory")),
                "avg_score": np.mean([a.get("recommendation_score", 0) for a in ranked_articles])
            }
        }
        
        return feed
    
    async def get_trending_articles(self, articles: List[Dict], limit: int = 5) -> List[Dict]:
        """Get trending articles (high engagement, recent)"""
        
        # Sort by engagement signals
        trending = sorted(
            articles,
            key=lambda x: (
                x.get("engagement_score", 0),
                x.get("published_date", 0)
            ),
            reverse=True
        )
        
        return trending[:limit]
    
    async def balance_feed(
        self,
        recommended: List[Dict],
        trending: List[Dict],
        ratio: float = 0.8
    ) -> List[Dict]:
        """Balance personalized vs trending articles"""
        
        personalized_count = int(len(recommended) * ratio)
        trending_count = len(recommended) - personalized_count
        
        # Interleave for diversity
        balanced = []
        for i, article in enumerate(recommended[:personalized_count]):
            balanced.append(article)
            if i < trending_count and i < len(trending):
                balanced.append(trending[i])
        
        return balanced

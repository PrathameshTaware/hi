"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Heart, Share2, BookOpen, Loader, Sparkles, TrendingUp, Clock, Eye, MessageCircle } from "lucide-react";
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card";
import { NeonButton } from "@/components/ui/neon-button";
import { CyberParticleBg } from "@/components/ui/cyber-particle-bg";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Article {
  id: string;
  title: string;
  source: string;
  category: string;
  recommendation_score: number;
  is_exploratory: boolean;
  excerpt?: string;
  image?: string;
}

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());

  const categories = ["All", "Technology", "Business", "Health", "Science"];

  // Fetch personalized feed
  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/feed?user_id=demo_user&limit=20`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        const data = await response.json();
        if (data.status === "success") {
          setArticles(data.feed || []);
        }
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  // Track article click
  const trackArticleClick = async (articleId: string, action: string) => {
    try {
      await fetch(`${API_BASE}/feed/track-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "demo_user",
          article_id: articleId,
          action,
          read_time_seconds: 120,
          scroll_depth: 0.8,
        }),
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const handleLike = (articleId: string) => {
    const newLiked = new Set(likedArticles);
    if (newLiked.has(articleId)) {
      newLiked.delete(articleId);
    } else {
      newLiked.add(articleId);
    }
    setLikedArticles(newLiked);
    trackArticleClick(articleId, "like");
  };

  const filteredArticles = selectedCategory
    ? articles.filter(
        (a) =>
          selectedCategory === "All" ||
          a.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    : articles;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CyberParticleBg />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95" />
      
      <div className="relative z-10">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 blur-xl opacity-50" />
              <div className="relative rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-2">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Your News Feed</h1>
              <p className="text-xs text-blue-300">AI-Powered Personalization</p>
            </div>
          </motion.div>

          {/* 3D Category Filter */}
          <div className="flex gap-3 overflow-x-auto pb-3">
            {categories.map((cat, index) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() =>
                  setSelectedCategory(cat === "All" ? null : cat)
                }
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-medium transition-all backdrop-blur-sm ${
                  (selectedCategory === null && cat === "All") ||
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/20"
                }`}
              >
                {cat === "All" ? <Sparkles className="inline w-3 h-3 mr-1" /> : null}
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="mx-auto max-w-3xl px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="mb-4 h-8 w-8 animate-spin text-blue-400" />
            <p className="text-slate-400">Loading your personalized feed...</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article, index) => (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => trackArticleClick(article.id, "click")}
                    className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 transition-all hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Category Badge with glow */}
                        <div className="mb-3 inline-flex items-center gap-2">
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 text-xs font-medium text-blue-300 border border-blue-400/30"
                          >
                            {article.category}
                          </motion.span>
                          {article.is_exploratory && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1 text-xs font-medium text-green-300 border border-green-400/30 flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              New
                            </motion.span>
                          )}
                        </div>

                        {/* Title with hover effect */}
                        <h2 className="mb-3 text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                          {article.title}
                        </h2>

                        {/* Source & Engagement Stats */}
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.source}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-blue-400" />
                            <span className="text-blue-400 font-medium">
                              {(
                                article.recommendation_score * 100
                              ).toFixed(0)}%
                            </span>
                            <span>match</span>
                          </div>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            2h ago
                          </span>
                        </div>
                      </div>

                      {/* 3D Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1, rotateZ: 5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(article.id);
                          }}
                          className={`rounded-lg p-2 transition-all backdrop-blur-sm ${
                            likedArticles.has(article.id)
                              ? "bg-red-500/20 text-red-400 border border-red-400/30"
                              : "bg-white/10 text-white/60 hover:bg-red-500/10 hover:text-red-400 border border-white/20"
                          }`}
                        >
                          <Heart
                            className="h-5 w-5"
                            fill={
                              likedArticles.has(article.id) ? "currentColor" : "none"
                            }
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, rotateZ: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            trackArticleClick(article.id, "share");
                          }}
                          className="rounded-lg bg-white/10 p-2 text-white/60 transition-all hover:bg-blue-500/10 hover:text-blue-400 border border-white/20 backdrop-blur-sm"
                        >
                          <Share2 className="h-5 w-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, rotateZ: 3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            trackArticleClick(article.id, "comment");
                          }}
                          className="rounded-lg bg-white/10 p-2 text-white/60 transition-all hover:bg-purple-500/10 hover:text-purple-400 border border-white/20 backdrop-blur-sm"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${article.recommendation_score * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                          backgroundSize: "200% 100%",
                          animation: "shimmer 2s infinite linear"
                        }}
                      />
                    </div>
                  </motion.article>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-slate-400">
                    No articles found in this category.
                  </p>
                </div>
              )}
            </div>
          </AnimatePresence>
        )}

        {/* Infinite Scroll Trigger */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 flex flex-col items-center justify-center py-8 text-slate-400"
        >
          <Loader className="mb-2 h-5 w-5 animate-spin" />
          <p className="text-sm">Loading more articles...</p>
        </motion.div>
      </main>
      </div>
    </div>
  );
}

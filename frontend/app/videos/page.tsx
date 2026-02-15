"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Play,
  Scissors,
  FileText,
  Image as ImageIcon,
  Download,
  Loader2,
  Check,
  Sparkles,
  Zap,
  Film,
  Palette,
  Wand2,
  ArrowRight,
} from "lucide-react";
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card";
import { NeonButton } from "@/components/ui/neon-button";
import { Floating3DButton } from "@/components/ui/floating-3d-button";
import { CyberParticleBg } from "@/components/ui/cyber-particle-bg";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface VideoData {
  video_id: string;
  filename: string;
  duration: number;
  scenes: Scene[];
  captions: Caption[];
  thumbnails: Thumbnail[];
}

interface Scene {
  id: string;
  start_time: number;
  end_time: number;
  type: string;
  importance: number;
}

interface Caption {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
}

interface Thumbnail {
  variant_id: string;
  style: string;
  ctr_potential: number;
  has_text: boolean;
}

type Step = "upload" | "analyze" | "edit" | "export";

export default function VideoEditor() {
  const [activeStep, setActiveStep] = useState<Step>("upload");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "instagram",
  ]);

  const steps: { id: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "upload", label: "Upload Video", icon: Upload },
    { id: "analyze", label: "Analyze", icon: Play },
    { id: "edit", label: "Edit", icon: Scissors },
    { id: "export", label: "Export", icon: Download },
  ];

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/videos/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({}));
      if (data && data.status === "success" && data.video) {
        setVideoData({
          video_id: String(data.video.video_id ?? ""),
          filename: String(data.video.filename ?? ""),
          duration: 0,
          scenes: Array.isArray(data.video.scenes) ? data.video.scenes : [],
          captions: Array.isArray(data.video.captions) ? data.video.captions : [],
          thumbnails: Array.isArray(data.video.thumbnails) ? data.video.thumbnails : [],
        });
        setActiveStep("analyze");
      } else {
        throw new Error(data.message || "Upload failed: Invalid response");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  // Analyze video
  const handleAnalyzeVideo = async () => {
    if (!videoData) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/videos/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: videoData.video_id,
          analyze_scenes: true,
          generate_captions: true,
          generate_thumbnails: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({}));
      if (data && data.status === "success" && data.analysis) {
        const analysis = data.analysis ?? {};
        setVideoData((prev) =>
          prev
            ? {
                ...prev,
                scenes: Array.isArray(analysis.scenes) ? analysis.scenes : [],
                captions: Array.isArray(analysis.captions) ? analysis.captions : [],
                thumbnails: Array.isArray(analysis.thumbnails) ? analysis.thumbnails : [],
                duration: Number(analysis.duration ?? 0),
              }
            : null
        );
        setActiveStep("edit");
      } else {
        throw new Error(data.message || "Analysis failed: Invalid response");
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  // Export video
  const handleExportVideo = async () => {
    if (!videoData) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/videos/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: videoData.video_id,
          platforms: selectedPlatforms,
          include_captions: true,
          auto_select_thumbnail: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({}));
      if (data && (data.status === "processing" || data.status === "success")) {
        setActiveStep("export");
      } else {
        throw new Error(data.message || "Export failed: Invalid response");
      }
    } catch (error) {
      console.error("Export failed:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred during export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CyberParticleBg />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95" />
      
      <div className="relative z-10">
      {/* Header with glassmorphism */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 blur-xl opacity-50" />
              <div className="relative rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-3">
                <Film className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Video Editor</h1>
              <p className="text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Turn raw footage into platform-ready videos
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="border-b border-red-700 bg-red-900/50">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="rounded-lg bg-red-800/50 p-4 text-red-200">
              <p className="font-medium">Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps Progress */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isCompleted =
                steps.findIndex((s) => s.id === activeStep) >
                steps.findIndex((s) => s.id === step.id);

              return (
                <React.Fragment key={step.id}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => isCompleted && setActiveStep(step.id)}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg p-3 transition ${
                      isActive
                        ? "bg-blue-500/20 text-blue-400"
                        : isCompleted
                          ? "bg-green-500/20 text-green-400"
                          : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`rounded-full p-2 ${
                        isActive
                          ? "bg-blue-500/30"
                          : isCompleted
                            ? "bg-green-500/30"
                            : "bg-slate-700/30"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{step.label}</span>
                  </motion.div>

                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition ${
                        isCompleted ? "bg-green-500" : "bg-slate-700"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* STEP 1: Upload */}
        {activeStep === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-6"
            >
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 blur-xl opacity-50" />
                <div className="relative rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </div>
            </motion.div>
            
            <h2 className="mb-3 text-3xl font-bold text-white">
              Upload Your Video
            </h2>
            <p className="mb-8 text-slate-300">
              Supported formats: MP4, WebM, AVI (Max 2GB)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Floating3DButton
              onClick={() => fileInputRef.current?.click()}
              color="purple"
              size="lg"
            >
              <Upload className="h-6 w-6" />
              Choose Video
            </Floating3DButton>
          </motion.div>
        )}

        {/* STEP 2: Analyze */}
        {activeStep === "analyze" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">
                Video Analysis
              </h2>
              <p className="mb-6 text-slate-400">
                AI is analyzing your video for scenes, audio, and optimal
                thumbnails...
              </p>

              <NeonButton
                onClick={handleAnalyzeVideo}
                disabled={loading}
                color="purple"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6" />
                    Analyze Video
                  </>
                )}
              </NeonButton>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Edit */}
        {activeStep === "edit" && videoData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Scenes */}
            <GlassmorphicCard variant="premium" className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 blur-lg opacity-50" />
                  <div className="relative rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                    <Scissors className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Detected Scenes</h3>
              </div>

              <div className="space-y-4">
                {videoData.scenes.map((scene: Scene, index) => (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 10, scale: 1.02 }}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg p-4"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-white capitalize flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-purple-400" />
                        {scene.type}
                      </p>
                      <p className="text-sm text-slate-400">
                        {Number(scene.start_time ?? 0).toFixed(1)}s -{" "}
                        {Number(scene.end_time ?? 0).toFixed(1)}s
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-400">
                        {Number((scene.importance ?? 0) * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-400">Importance</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassmorphicCard>

            {/* Captions */}
            {videoData.captions.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">
                    Generated Captions
                  </h3>
                </div>

                <div className="space-y-3">
                  {videoData.captions.slice(0, 3).map((caption) => (
                    <div
                      key={caption.id}
                      className="rounded bg-slate-900 p-4"
                    >
                      <p className="text-sm text-slate-400">
                        {Number(caption.start_time ?? 0).toFixed(1)}s -{" "}
                        {Number(caption.end_time ?? 0).toFixed(1)}s
                      </p>
                      <p className="mt-1 text-white">{caption.text}</p>
                      <div className="mt-2 text-xs text-slate-500">
                        Confidence: {Number((caption.confidence ?? 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thumbnails */}
            {videoData.thumbnails.length > 0 && (
              <GlassmorphicCard variant="neon" className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 blur-lg opacity-50" />
                  <div className="relative rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 p-2">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Thumbnail Options</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {videoData.thumbnails.map((thumb, index) => (
                  <motion.div
                    key={thumb.variant_id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10, scale: 1.05, rotateZ: 2 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer rounded-xl border border-white/20 bg-white/5 backdrop-blur-lg p-4 transition-all hover:border-blue-400/50 hover:bg-white/10"
                  >
                    <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 mb-3 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <p className="font-semibold text-white capitalize">
                      {thumb.style}
                    </p>
                    <p className="text-sm text-blue-300 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {Number((thumb.ctr_potential ?? 0) * 100).toFixed(0)}% CTR
                    </p>
                  </motion.div>
                ))}
              </div>
            </GlassmorphicCard>
            )}

            {/* Proceed to Export */}
            <Floating3DButton
              onClick={() => setActiveStep("export")}
              color="green"
              size="lg"
              className="w-full"
            >
              Proceed to Export <ArrowRight className="h-5 w-5 ml-2" />
            </Floating3DButton>
          </motion.div>
        )}

        {/* STEP 4: Export */}
        {activeStep === "export" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-slate-700 bg-slate-800 p-6"
          >
            <h2 className="mb-6 text-xl font-bold text-white">
              Export for Platforms
            </h2>

            {/* Platform Selection */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              {[
                { id: "instagram", label: "Instagram Reels" },
                { id: "youtube", label: "YouTube Shorts" },
                { id: "tiktok", label: "TikTok" },
                { id: "linkedin", label: "LinkedIn" },
              ].map((platform) => (
                <motion.button
                  key={platform.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    const updated = selectedPlatforms.includes(platform.id)
                      ? selectedPlatforms.filter((p) => p !== platform.id)
                      : [...selectedPlatforms, platform.id];
                    setSelectedPlatforms(updated);
                  }}
                  className={`rounded-lg border-2 px-4 py-3 font-medium transition ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {platform.label}
                </motion.button>
              ))}
            </div>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportVideo}
              disabled={loading || selectedPlatforms.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Export to {selectedPlatforms.length} Platform
                  {selectedPlatforms.length !== 1 ? "s" : ""}
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </main>
      </div>
    </div>
  );
}
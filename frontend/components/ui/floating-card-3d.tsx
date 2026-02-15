"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// CSS-only 3D card with mouse tracking
interface FloatingCard3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export function FloatingCard3D({
  children,
  className = "",
  glowColor = "cyan",
  intensity = 15,
}: FloatingCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Smooth spring animations
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]));
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]));

  // Track mouse for tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`
        relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg
        transition-shadow duration-300
        hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]
        ${className}
      `}
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        style={{
          background: `radial-gradient(circle at center, ${glowColor}20, transparent 70%)`,
        }}
      />
      
      {/* Content with depth */}
      <div style={{ transform: "translateZ(20px)" }} className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

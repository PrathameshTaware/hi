"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { LucideIcon } from "lucide-react";

// Lightweight 3D button using CSS transforms only
interface CyberButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  glowColor?: string;
}

export function CyberButton({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  glowColor,
  className = "",
  ...props
}: CyberButtonProps) {
  // Color mapping
  const colors = {
    primary: { bg: "from-cyan-500 to-blue-600", glow: "cyan-500", text: "white" },
    secondary: { bg: "from-purple-500 to-pink-600", glow: "purple-500", text: "white" },
    danger: { bg: "from-red-500 to-orange-600", glow: "red-500", text: "white" },
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const color = colors[variant];
  const finalGlow = glowColor || color.glow;

  return (
    <motion.button
      // 3D effect using perspective
      whileHover={{
        scale: 1.05,
        rotateX: 5,
        rotateY: 5,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative overflow-hidden rounded-lg font-semibold
        bg-gradient-to-r ${color.bg} text-${color.text}
        ${sizes[size]}
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: `0 0 20px rgba(var(--${finalGlow}-rgb, 0, 240, 255), 0.4)`,
      }}
      {...props}
    >
      {/* Animated glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Content with icon */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        {children}
      </span>
    </motion.button>
  );
}

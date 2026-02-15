"use client";

import React from "react";
import { motion } from "framer-motion";

interface Floating3DButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "purple" | "green";
  variant?: "floating" | "glass" | "neon" | "particle" | "holographic" | "morphing";
}

// Enhanced 3D button variants with premium effects
const buttonVariants = {
  floating: {
    // Original floating effect with enhanced depth
    scale: 1.05,
    rotateX: 15,
    rotateY: -15,
    z: 50,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  glass: {
    // Glassmorphism with blur and transparency
    scale: 1.02,
    filter: "blur(0px)",
    transition: { duration: 0.3 }
  },
  neon: {
    // Neon glow effect with pulsing
    scale: 1.08,
    textShadow: "0 0 20px currentColor",
    boxShadow: "0 0 30px currentColor",
    transition: { duration: 0.2 }
  },
  particle: {
    // Particle system effect
    scale: 1.06,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  holographic: {
    // Holographic projection effect
    scale: 1.04,
    rotateX: 10,
    rotateY: 10,
    transition: { type: "spring", stiffness: 200, damping: 15 }
  },
  morphing: {
    // Shape morphing effect
    scale: 1.1,
    borderRadius: "50%",
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

export const Floating3DButton: React.FC<Floating3DButtonProps> = ({
  children,
  className = "",
  size = "md",
  color = "blue",
  variant = "floating",
  ...props
}) => {
  // Enhanced size configurations with better touch targets
  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[44px]", // iOS touch target minimum
    md: "px-6 py-3 text-base min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[52px]"
  };

  // Premium color schemes with gradients and effects
  const colors = {
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-pink-500",
    green: "from-green-500 to-emerald-500"
  };

  // Variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case "glass":
        return "backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl";
      case "neon":
        return "shadow-2xl border-2 border-current";
      case "particle":
        return "relative overflow-hidden";
      case "holographic":
        return "bg-gradient-to-br from-transparent via-white/5 to-transparent border border-white/30";
      case "morphing":
        return "transition-all duration-500";
      default:
        return "shadow-lg hover:shadow-xl";
    }
  };

  return (
    <motion.button
      whileHover={buttonVariants[variant]}
      whileTap={{ scale: 0.95 }}
      className={`
        relative rounded-xl font-semibold text-white
        bg-gradient-to-r ${colors[color]}
        ${getVariantStyles()}
        transition-all duration-300
        transform-gpu
        ${sizes[size]}
        ${className}
      `}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      {...props}
    >
      {/* Enhanced 3D depth layers */}
      <div className="absolute inset-0 rounded-xl bg-black/20 transform translate-z-[-20px]" />
      <div className="absolute inset-0 rounded-xl bg-white/10 transform translate-z-[-10px]" />

      {/* Variant-specific effects */}
      {variant === "floating" && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-30"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: `linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)`,
          }}
        />
      )}

      {variant === "neon" && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{
            boxShadow: [
              "0 0 20px currentColor",
              "0 0 40px currentColor",
              "0 0 20px currentColor"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {variant === "particle" && (
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)"
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      {variant === "holographic" && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-50"
          animate={{
            background: [
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)"
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Content with enhanced z-indexing */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

// Additional premium button variants as separate components
export const Glass3DButton: React.FC<Floating3DButtonProps> = (props) => (
  <Floating3DButton {...props} variant="glass" />
);

export const Neon3DButton: React.FC<Floating3DButtonProps> = (props) => (
  <Floating3DButton {...props} variant="neon" />
);

export const Particle3DButton: React.FC<Floating3DButtonProps> = (props) => (
  <Floating3DButton {...props} variant="particle" />
);

export const Holographic3DButton: React.FC<Floating3DButtonProps> = (props) => (
  <Floating3DButton {...props} variant="holographic" />
);

export const Morphing3DButton: React.FC<Floating3DButtonProps> = (props) => (
  <Floating3DButton {...props} variant="morphing" />
);

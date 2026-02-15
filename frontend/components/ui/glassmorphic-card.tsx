"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassmorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "neon" | "premium";
  hover?: boolean;
}

export const GlassmorphicCard = React.forwardRef<HTMLDivElement, GlassmorphicCardProps>(
  ({ children, className, variant = "default", hover = true, ...props }, ref) => {
    const variants = {
      default: "bg-white/5 backdrop-blur-lg border-white/10",
      neon: "bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border-blue-400/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]",
      premium: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { y: -5, scale: 1.02 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "rounded-xl border p-6 transition-all duration-300",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassmorphicCard.displayName = "GlassmorphicCard";

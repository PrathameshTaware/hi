"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "blue" | "purple" | "green" | "orange";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ children, className, variant = "blue", size = "md", glow = true, ...props }, ref) => {
    const variants = {
      blue: "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]",
      purple: "bg-gradient-to-r from-purple-600 to-purple-700 border-purple-400 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)]",
      green: "bg-gradient-to-r from-green-600 to-green-700 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]",
      orange: "bg-gradient-to-r from-orange-600 to-orange-700 border-orange-400 text-white shadow-[0_0_20px_rgba(251,146,60,0.5)]"
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative rounded-lg border font-semibold transition-all duration-300 overflow-hidden group",
          variants[variant],
          sizes[size],
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {/* Animated glow effect */}
        {glow && (
          <motion.div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)`,
            }}
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        
        {/* Neon border glow */}
        <div className="absolute inset-0 rounded-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-lg animate-pulse" 
            style={{
              boxShadow: variant === "blue" ? "0 0 20px rgba(59,130,246,0.5)" :
                       variant === "purple" ? "0 0 20px rgba(147,51,234,0.5)" :
                       variant === "green" ? "0 0 20px rgba(34,197,94,0.5)" :
                       "0 0 20px rgba(251,146,60,0.5)"
            }}
          />
        </div>

        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);

NeonButton.displayName = "NeonButton";

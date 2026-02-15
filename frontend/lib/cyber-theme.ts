// Centralized cyberpunk design system

export const cyberColors = {
  // Primary
  black: "#0A0A0F",
  darkGray: "#1A1A24",
  cyan: "#00F0FF",
  purple: "#B026FF",
  pink: "#FF006E",
  orange: "#FF6B35",
  yellow: "#FFD23F",
  
  // Glow
  glow: {
    cyan: "rgba(0, 240, 255, 0.5)",
    purple: "rgba(176, 38, 255, 0.5)",
    pink: "rgba(255, 0, 110, 0.5)",
  },
  
  // Threat levels
  threat: {
    critical: "#FF006E",
    high: "#FF6B35",
    medium: "#FFD23F",
    low: "#00F0FF",
  },
};

// Animation timings
export const cyberAnimations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.6,
  
  // Framer Motion variants
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  glitchIn: {
    initial: { opacity: 0, x: -10, skewX: -5 },
    animate: { opacity: 1, x: 0, skewX: 0 },
  },
  
  float: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
};

// Typography
export const cyberTypography = {
  fonts: {
    heading: "'Orbitron', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'Space Mono', monospace",
  },
  
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
};

// Spacing
export const cyberSpacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
};

// Glassmorphism
export const cyberGlass = {
  light: "bg-white/5 backdrop-blur-lg border border-white/10",
  medium: "bg-white/10 backdrop-blur-xl border border-white/20",
  heavy: "bg-white/20 backdrop-blur-2xl border border-white/30",
};

// Shadows
export const cyberShadows = {
  glow: (color: string) => `0 0 20px ${color}`,
  depth: "0 10px 30px rgba(0, 0, 0, 0.5)",
  float: "0 20px 60px rgba(0, 0, 0, 0.3)",
};

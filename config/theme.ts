export const theme = {
  colors: {
    // Primary gradient colors - blue to purple
    primary: "#6366f1", // Indigo
    secondary: "#8b5cf6", // Violet
    tertiary: "#3b82f6", // Blue
    accent: "#a855f7", // Purple
    accentAlt: "#06b6d4", // Cyan accent
    background: "#ffffff",
    foreground: "#1e1b4b", // Deep indigo
    muted: "#64748b",
  },
  fonts: {
    heading: "Geist",
    body: "Geist",
  },
  spacing: {
    section: "6rem",
    container: "1280px",
  },
} as const

export type Theme = typeof theme

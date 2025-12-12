export const theme = {
  colors: {
    // Primary gradient colors - blue to cyan neon
    primary: "#0ea5e9", // Sky blue
    secondary: "#06b6d4", // Cyan
    tertiary: "#3b82f6", // Blue
    accent: "#00d9ff", // Neon cyan
    accentAlt: "#0891b2", // Dark cyan
    background: "#ffffff",
    foreground: "#0c4a6e", // Deep blue
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

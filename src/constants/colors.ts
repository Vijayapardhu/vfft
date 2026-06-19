/**
 * Brand palette (PRD §11 / UID §3) as raw hex — for JS contexts only
 * (Recharts, canvas, confetti). For styling, always use the Tailwind tokens
 * generated from globals.css: bg-cream, text-ink, bg-vred, border-vyellow, etc.
 */
export const BRAND_COLORS = {
  cream: "#FFFDF5",
  ink: "#000000",
  red: "#FF6B6B",
  yellow: "#FFD93D",
  purple: "#C4B5FD",
  green: "#4ADE80",
  blue: "#60A5FA",
} as const;

/** Ordered palette for multi-series charts. */
export const CHART_COLORS = [
  BRAND_COLORS.red,
  BRAND_COLORS.blue,
  BRAND_COLORS.green,
  BRAND_COLORS.yellow,
  BRAND_COLORS.purple,
] as const;

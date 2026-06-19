"use client";

import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#FF6B6B", "#FFD93D", "#C4B5FD", "#4ADE80", "#60A5FA"];

/** Lightweight SOLD-moment confetti burst (respects reduced motion). */
export function Confetti() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ y: -24, opacity: 1, rotate: 0 }}
          animate={{ y: 520, opacity: 0, rotate: 540 }}
          transition={{ duration: 1.8, delay: (i % 7) * 0.05, ease: "easeIn" }}
          className="absolute h-3 w-3 rounded-sm border-2 border-ink"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
          }}
        />
      ))}
    </div>
  );
}

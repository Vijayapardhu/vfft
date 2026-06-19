"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * 3D tilt-on-hover wrapper with a moving glare. Pure transform — works for team
 * cards, player cards, anything that should feel elevated and reactive.
 */
export function TiltCard({
  children,
  className,
  max = 12,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  const glareX = useTransform(px, [0, 1], ["0%", "100%"]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={cn("relative [perspective:900px]", className)}
    >
      {children}
      {glare && (
        <motion.span
          aria-hidden
          style={{ left: glareX }}
          className="pointer-events-none absolute top-0 h-full w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-300 [transform:translateZ(40px)] hover:opacity-100"
        />
      )}
    </motion.div>
  );
}

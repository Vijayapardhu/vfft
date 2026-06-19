"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle magnetic button — drifts gently toward the cursor (no bounce, no tilt).
 * Premium pill styling: solid fill or hairline glass, soft shadow, slow lift.
 */
export function MagneticButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 150, damping: 22 });
  const y = useSpring(my, { stiffness: 150, damping: 22 });

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.25);
  }
  function reset() {
    mx.set(0);
    my.set(0);
  }

  const styles =
    variant === "primary"
      ? "bg-ink text-cream shadow-[0_10px_30px_-10px_rgba(17,17,17,0.5)] hover:shadow-[0_18px_40px_-12px_rgba(17,17,17,0.55)]"
      : "border border-ink/15 bg-white/40 text-ink backdrop-blur hover:bg-white/70";

  return (
    <motion.div style={{ x, y }} className="inline-block">
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={cn(
          "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-wide transition-all duration-300",
          styles,
          className,
        )}
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </Link>
    </motion.div>
  );
}

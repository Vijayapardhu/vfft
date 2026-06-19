"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Neo-brutalist button that drifts gently toward the cursor (magnetic), keeping
 * the game-theme thick border + hard shadow + push-on-press feel.
 */
export function MagneticButton({
  href,
  children,
  variant = "yellow",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "yellow" | "red" | "cream" | "ink";
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

  const palette = {
    yellow: "bg-vyellow text-ink",
    red: "bg-vred text-ink",
    cream: "bg-cream text-ink",
    ink: "bg-ink text-cream",
  }[variant];

  return (
    <motion.div style={{ x, y }} className="inline-block">
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={cn(
          "inline-flex min-h-12 items-center gap-2 rounded-2xl border-4 border-ink px-7 py-3 text-lg font-bold uppercase tracking-wide shadow-brutal-md transition-transform duration-100 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-brutal-sm",
          palette,
          className,
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

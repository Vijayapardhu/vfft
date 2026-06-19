"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Slim animated progress bar pinned to the top of the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[55] h-1 w-full origin-left bg-gradient-to-r from-vred via-vyellow to-vblue"
      aria-hidden
    />
  );
}

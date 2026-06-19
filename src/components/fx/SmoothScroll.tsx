"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Headless Lenis smooth-scroll for the public site (game-launcher feel).
 * Disabled when the user prefers reduced motion. Only smooths the main window —
 * inner scroll containers (dialogs, tables) keep native scrolling.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}

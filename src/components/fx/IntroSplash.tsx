"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const SEEN_KEY = "vfft-intro-seen";

/**
 * Premium SaaS-style opening sequence (Arc / Linear / Apple Vision Pro vibe).
 * Plays once per session: black screen → stroked "VELANGI" slides in from the
 * right → solid "FREE FIRE" rises with a blur dissolve → "SEASON ONE" + tagline
 * fade in → the whole block scales up and dissolves into the site. ~3.6s total.
 * Skipped for reduced-motion and on repeat visits within the session.
 */
export function IntroSplash() {
  const [phase, setPhase] = useState<"pending" | "playing" | "done">("pending");
  const overlay = useRef<HTMLDivElement | null>(null);
  const block = useRef<HTMLDivElement | null>(null);
  const velangi = useRef<HTMLDivElement | null>(null);
  const freefire = useRef<HTMLDivElement | null>(null);
  const season = useRef<HTMLDivElement | null>(null);
  const tagline = useRef<HTMLDivElement | null>(null);

  // Decide whether to play (client-only — avoids hydration mismatch).
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SEEN_KEY);
    if (reduced || seen) {
      setPhase("done");
      return;
    }
    setPhase("playing");
    sessionStorage.setItem(SEEN_KEY, "1");
  }, []);

  // Run the GSAP timeline once the overlay is in the DOM.
  useEffect(() => {
    if (phase !== "playing") return;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      gsap.set(velangi.current, { xPercent: 110, autoAlpha: 0 });
      gsap.set(freefire.current, { yPercent: 60, autoAlpha: 0, filter: "blur(20px)" });
      gsap.set([season.current, tagline.current], { autoAlpha: 0, y: 14 });

      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        onComplete: () => setPhase("done"),
      });
      tl.to(velangi.current, { xPercent: 0, autoAlpha: 1, duration: 1.2 }, 0.4)
        .to(
          freefire.current,
          { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.0, ease: "power3.out" },
          1.2,
        )
        .to(season.current, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.9)
        .to(tagline.current, { autoAlpha: 1, y: 0, duration: 0.7 }, 2.2)
        .to(
          block.current,
          { scale: 18, autoAlpha: 0, duration: 1.0, ease: "power3.in" },
          3.0,
        )
        .to(overlay.current, { autoAlpha: 0, duration: 0.4 }, 3.5);
    }, overlay);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [phase]);

  if (phase !== "playing") return null;

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-[100] grid place-items-center bg-[#0A0A0A] px-6"
      aria-hidden
    >
      <div ref={block} className="text-center will-change-transform">
        <div
          ref={velangi}
          className="text-[14vw] font-black uppercase leading-none tracking-tight sm:text-[9rem] lg:text-[11rem]"
          style={{ WebkitTextStroke: "1.5px #f8f6f0", color: "transparent" }}
        >
          Velangi
        </div>
        <div
          ref={freefire}
          className="-mt-1 whitespace-nowrap text-[15vw] font-black uppercase leading-none tracking-tight text-cream sm:text-[10rem] lg:text-[12rem]"
        >
          Free Fire
        </div>
        <div
          ref={season}
          className="mt-5 text-[10px] font-semibold uppercase tracking-[0.5em] text-cream/55 sm:text-sm"
        >
          Season One
        </div>
        <div
          ref={tagline}
          className="mt-2 text-[9px] font-light uppercase tracking-[0.35em] text-cream/35 sm:text-xs"
        >
          Where Village Legends Rise
        </div>
      </div>
    </div>
  );
}

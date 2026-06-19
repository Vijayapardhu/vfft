"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const SEEN_KEY = "vfft-intro-seen";

/* -------- Web Audio synth (no asset files; graceful if autoplay-blocked) -- */
type ACtx = AudioContext;

function whoosh(ac: ACtx) {
  const dur = 0.7;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(280, ac.currentTime);
  lp.frequency.exponentialRampToValueAtTime(4200, ac.currentTime + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.22, ac.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start();
}

function blip(ac: ACtx, freq = 620) {
  const o = ac.createOscillator();
  o.type = "triangle";
  o.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.1, ac.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.18);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + 0.2);
}

function impact(ac: ACtx) {
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(150, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(38, ac.currentTime + 0.5);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.4, ac.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.6);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + 0.65);
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

/**
 * Premium opening sequence (Arc / Linear / Apple vibe) with synthesized sound
 * FX + haptics. Plays once per session, skippable, and fully skipped for
 * reduced-motion. Black screen → stroked "VELANGI" whooshes in → "FREE FIRE"
 * blur-rises → "SEASON ONE" + tagline → impact zoom into the site.
 */
export function IntroSplash() {
  const [phase, setPhase] = useState<"pending" | "playing" | "done">("pending");
  const overlay = useRef<HTMLDivElement | null>(null);
  const block = useRef<HTMLDivElement | null>(null);
  const velangi = useRef<HTMLDivElement | null>(null);
  const freefire = useRef<HTMLDivElement | null>(null);
  const season = useRef<HTMLDivElement | null>(null);
  const tagline = useRef<HTMLDivElement | null>(null);
  const line = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const acRef = useRef<ACtx | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem(SEEN_KEY)) {
      setPhase("done");
      return;
    }
    setPhase("playing");
    sessionStorage.setItem(SEEN_KEY, "1");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    document.body.style.overflow = "hidden";

    // Best-effort audio (browsers may block until a gesture — fails silently).
    let ac: ACtx | null = null;
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        ac = new Ctor();
        acRef.current = ac;
        if (ac.state === "suspended") void ac.resume();
      }
    } catch {
      ac = null;
    }
    const sfx = (fn: (ac: ACtx) => void) => () => {
      if (ac && ac.state === "running") fn(ac);
    };

    const ctx = gsap.context(() => {
      gsap.set(velangi.current, { xPercent: 115, autoAlpha: 0 });
      gsap.set(freefire.current, { yPercent: 60, autoAlpha: 0, filter: "blur(22px)" });
      gsap.set([season.current, tagline.current], { autoAlpha: 0, y: 14 });
      gsap.set(line.current, { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        onComplete: () => setPhase("done"),
      });
      tlRef.current = tl;

      tl.call(sfx(whoosh), undefined, 0.35)
        .call(() => vibrate(35), undefined, 0.4)
        .to(velangi.current, { xPercent: 0, autoAlpha: 1, duration: 1.2 }, 0.4)
        .to(line.current, { scaleX: 1, duration: 0.8, ease: "power3.inOut" }, 0.7)
        .call(sfx((a) => blip(a, 520)), undefined, 1.2)
        .to(freefire.current, { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.0, ease: "power3.out" }, 1.2)
        .call(() => vibrate(20), undefined, 1.25)
        .to(season.current, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.95)
        .call(sfx((a) => blip(a, 720)), undefined, 1.95)
        .to(tagline.current, { autoAlpha: 1, y: 0, duration: 0.7 }, 2.25)
        .call(sfx(impact), undefined, 3.0)
        .call(() => vibrate([50, 30, 120]), undefined, 3.0)
        .to(block.current, { scale: 18, autoAlpha: 0, duration: 1.0, ease: "power3.in" }, 3.0)
        .to(overlay.current, { autoAlpha: 0, duration: 0.45 }, 3.5);
    }, overlay);

    return () => {
      ctx.revert();
      tlRef.current = null;
      document.body.style.overflow = "";
      if (acRef.current) {
        void acRef.current.close().catch(() => {});
        acRef.current = null;
      }
    };
  }, [phase]);

  function skip() {
    tlRef.current?.kill();
    setPhase("done");
  }

  if (phase !== "playing") return null;

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#0A0A0A] px-6"
      aria-hidden
    >
      {/* faint grid + vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 100% at 50% 45%, transparent 50%, rgba(0,0,0,0.7) 100%)" }}
      />

      <div ref={block} className="relative text-center will-change-transform">
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
        <div ref={line} className="mx-auto mt-4 h-[3px] w-40 bg-vred sm:w-64" />
        <div ref={season} className="mt-4 text-[10px] font-bold uppercase tracking-[0.5em] text-vyellow sm:text-sm">
          Season One
        </div>
        <div ref={tagline} className="mt-2 text-[9px] font-light uppercase tracking-[0.35em] text-cream/40 sm:text-xs">
          Where Village Legends Rise
        </div>
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-6 right-6 rounded-full border border-cream/25 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/60 transition-colors hover:border-cream/60 hover:text-cream"
      >
        Skip ▸
      </button>
    </div>
  );
}

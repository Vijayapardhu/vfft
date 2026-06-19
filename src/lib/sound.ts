"use client";

let ctx: AudioContext | null = null;
let muted = false;

/** Decode + cache audio buffers for MP3 files played via AudioContext. */
const mp3Cache: Record<string, AudioBuffer> = {};

async function playMp3(url: string) {
  if (muted || typeof window === "undefined") return;
  const audio = getCtx();
  if (!audio) return;
  try {
    let buffer = mp3Cache[url];
    if (!buffer) {
      const resp = await fetch(url);
      const arr = await resp.arrayBuffer();
      buffer = await audio.decodeAudioData(arr);
      mp3Cache[url] = buffer;
    }
    const src = audio.createBufferSource();
    src.buffer = buffer;
    src.connect(audio.destination);
    src.start();
  } catch {
    // ignore – autoplay blocked or file missing
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Simple tone with optional frequency sweep. */
function tone(
  freq: number,
  durationMs: number,
  volume = 0.2,
  type: OscillatorType = "square",
  endFreq?: number,
) {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (endFreq !== undefined) {
    osc.frequency.linearRampToValueAtTime(endFreq, audio.currentTime + durationMs / 1000);
  }
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + durationMs / 1000);
}

/** Layer two oscillators for a richer sound. */
function chord(
  freq1: number,
  freq2: number,
  durationMs: number,
  volume = 0.2,
  type: OscillatorType = "sawtooth",
) {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const createLayer = (freq: number) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume * 0.6, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + durationMs / 1000);
  };
  createLayer(freq1);
  createLayer(freq2);
}

/** Haptic vibration feedback (mobile only, ignored if unsupported). */
function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}

/** Quick impact click for bid press feedback. */
function click() {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.15, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.04);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.05);
}

export const sound = {
  /** Impact click when you press a bid button. */
  click,

  /** Rising swoosh — your bid was placed successfully. */
  placedBid: () => {
    tone(400, 200, 0.18, "sine", 1200);
    vibrate(20);
  },

  /** Two-tone alert — someone outbid you. */
  outbid: () => {
    tone(880, 90, 0.15, "square");
    setTimeout(() => tone(660, 90, 0.15, "square"), 120);
    vibrate([30, 50, 30]);
  },

  /** Descending 3-2-1 countdown ticks (different pitch per second). */
  tick: (s: number) => {
    const freq = s === 3 ? 660 : s === 2 ? 495 : 330;
    const dur = s === 3 ? 250 : s === 2 ? 300 : 350;
    tone(freq, dur, 0.2, "square");
    vibrate(35);
  },

  /** Dramatic gavel — auction sold. */
  hammer: () => {
    chord(150, 310, 1400, 0.35, "sawtooth");
    setTimeout(() => tone(180, 600, 0.2, "triangle"), 80);
    vibrate([100, 80, 100, 80, 300]);
  },

  /** Trumpet fanfare — new player enters the auction block. */
  fanfare: () => { void playMp3("/sounds/fanfare.mp3"); },

  /** Descending disappointment — auction unsold. */
  unsold: () => {
    void playMp3("/sounds/fail-trumpet.mp3");
    vibrate([50, 100, 60]);
  },

  /** Subtle tick for the last 10 seconds warning (intensifies as time runs out). */
  warn: (s: number) => {
    tone(1000, 50, 0.08);
    const intensity = Math.max(1, s - 2); // 10→8, 9→7, ... 4→2
    vibrate([intensity * 8, intensity * 6]);
  },

  /** High-intensity haptic only (used for every second 10→1). */
  thump: (s: number) => {
    const ms = s <= 3 ? 60 + (3 - s) * 30 : 30 + (10 - s) * 5;
    vibrate([ms, ms * 0.6, ms]);
  },

  setMuted: (m: boolean) => {
    muted = m;
  },
  isMuted: () => muted,
  unlock: () => {
    getCtx();
  },
};

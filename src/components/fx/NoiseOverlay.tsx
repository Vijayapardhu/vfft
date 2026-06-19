/** Subtle film-grain overlay across the whole viewport (cinematic texture). */
export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="noise-overlay pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-multiply"
    />
  );
}

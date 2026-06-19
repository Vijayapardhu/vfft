"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Live countdown to an epoch-ms deadline (UID §15 auction timer). */
export function CountdownTimer({
  endsAt,
  className,
}: {
  endsAt: number;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const urgent = totalSeconds <= 10 && totalSeconds > 0;

  return (
    <span
      className={cn(
        "font-bold tabular-nums",
        urgent && "animate-pulse text-vred motion-reduce:animate-none",
        className,
      )}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

import { cn } from "@/lib/utils";

/** Loading placeholder (UID §27 — never blank screens). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border-2 border-ink/10 bg-ink/10 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

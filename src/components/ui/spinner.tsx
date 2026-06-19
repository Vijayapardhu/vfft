import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-6 w-6 animate-spin motion-reduce:animate-none", className)}
      aria-label="Loading"
    />
  );
}

/** Full-viewport centered loader, used while auth/route state resolves. */
export function FullScreenLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3 rounded-3xl border-4 border-ink bg-cream px-8 py-6 shadow-brutal-md">
        <Spinner className="h-8 w-8" />
        <span className="text-sm font-bold uppercase tracking-wide text-ink/60">
          Loading…
        </span>
      </div>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatVariant = "red" | "yellow" | "purple" | "green" | "blue" | "cream";

const VARIANT_BG: Record<StatVariant, string> = {
  red: "bg-vred",
  yellow: "bg-vyellow",
  purple: "bg-vpurple",
  green: "bg-vgreen",
  blue: "bg-vblue",
  cream: "bg-cream",
};

/** Compact metric tile (UID §23). */
export function StatCard({
  label,
  value,
  icon: Icon,
  variant = "yellow",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: StatVariant;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-4 border-ink p-4 shadow-brutal",
        VARIANT_BG[variant],
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold">{value}</span>
        {Icon && <Icon className="h-6 w-6 opacity-60" />}
      </div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-ink/60">
        {label}
      </div>
    </div>
  );
}

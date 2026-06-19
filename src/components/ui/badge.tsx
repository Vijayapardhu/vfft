import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Sticker-style badge (UID §2). Pair with `.sticker-l` / `.sticker-r` for tilt. */
export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        red: "bg-vred text-ink",
        yellow: "bg-vyellow text-ink",
        purple: "bg-vpurple text-ink",
        green: "bg-vgreen text-ink",
        blue: "bg-vblue text-ink",
        cream: "bg-cream text-ink",
        ink: "bg-ink text-cream",
      },
    },
    defaultVariants: { variant: "yellow" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

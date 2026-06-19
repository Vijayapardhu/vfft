import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Neo-brutalist button (ADB §11/§14): thick border, hard shadow, "push" on
 * press (translate toward the shadow). `md`/`lg` meet the 44px touch target.
 * For links styled as buttons, spread `buttonVariants(...)` onto `<Link>`.
 */
export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-2xl border-4 border-ink font-bold uppercase tracking-wide transition-transform duration-100 ease-out disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
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
      size: {
        sm: "min-h-9 px-3 py-1.5 text-sm shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal active:translate-x-0 active:translate-y-0 active:shadow-brutal-xs",
        md: "min-h-11 px-5 py-2.5 text-base shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-md active:translate-x-0 active:translate-y-0 active:shadow-brutal-sm",
        lg: "min-h-12 px-7 py-3 text-lg shadow-brutal-md hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-brutal-sm",
        icon: "h-11 w-11 shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0",
      },
    },
    defaultVariants: { variant: "yellow", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

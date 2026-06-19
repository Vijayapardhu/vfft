import { forwardRef, type ForwardedRef } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-2 font-medium shadow-brutal-xs outline-none transition-shadow placeholder:text-ink/40 focus:shadow-brutal disabled:opacity-50";

export const Input = forwardRef(function Input(
  { className, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
  ref: ForwardedRef<HTMLInputElement>,
) {
  return <input ref={ref} className={cn(fieldClass, className)} {...props} />;
});

export const Select = forwardRef(function Select(
  { className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>,
  ref: ForwardedRef<HTMLSelectElement>,
) {
  return <select ref={ref} className={cn(fieldClass, "appearance-none", className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea(
  { className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  ref: ForwardedRef<HTMLTextAreaElement>,
) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldClass, "min-h-24 resize-y py-3", className)}
      {...props}
    />
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-sm font-bold uppercase tracking-wide", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-sm font-bold text-vred">{children}</p>;
}

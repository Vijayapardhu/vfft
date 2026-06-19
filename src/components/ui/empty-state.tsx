import { Construction, type LucideIcon } from "lucide-react";

/**
 * Branded empty / coming-soon state (UID §29). The docs forbid blank screens —
 * every not-yet-built route renders this instead of a 404 or empty page.
 */
export function EmptyState({
  title,
  message,
  icon: Icon = Construction,
  children,
}: {
  title: string;
  message: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-5 py-16 text-center">
      <div className="sticker-l grid h-20 w-20 place-items-center rounded-3xl border-4 border-ink bg-vyellow shadow-brutal-md">
        <Icon className="h-9 w-9" />
      </div>
      <h1 className="text-3xl">{title}</h1>
      <p className="font-medium text-ink/60">{message}</p>
      {children}
    </div>
  );
}

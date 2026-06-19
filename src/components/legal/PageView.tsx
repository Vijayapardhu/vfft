"use client";

import { Spinner } from "@/components/ui/spinner";
import { usePage } from "@/hooks/usePage";
import { formatMatchTime } from "@/lib/format";

/**
 * Renders an admin-editable page (Firestore `pages/{slug}`). If no document
 * exists yet, the provided `fallback` is shown (e.g. the original static copy),
 * so launching before the admin writes content never yields a blank page.
 */
export function PageView({
  slug,
  title,
  fallback,
}: {
  slug: string;
  title: string;
  fallback?: React.ReactNode;
}) {
  const { data, loading } = usePage(slug);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!data || !data.body?.trim()) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-4xl">{title}</h1>
        <p className="mt-4 font-medium text-ink/50">
          This page hasn&apos;t been published yet — check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl">{data.title || title}</h1>
      {data.updatedAt && (
        <p className="mb-6 mt-1 text-sm font-bold uppercase tracking-wide text-ink/50">
          Last updated: {formatMatchTime(data.updatedAt)}
        </p>
      )}
      <div className="space-y-4 whitespace-pre-line text-base font-medium leading-relaxed text-ink/80">
        {data.body}
      </div>
    </div>
  );
}

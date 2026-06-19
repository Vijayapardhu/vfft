"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { useNewsArticle } from "@/hooks/useNews";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const categoryBadge: Record<string, "red" | "yellow" | "purple" | "green" | "blue" | "cream"> = {
  match: "red",
  announcement: "yellow",
  update: "blue",
  highlight: "purple",
  general: "cream",
};

export default function NewsArticlePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: article, loading, error } = useNewsArticle(params.slug ?? null);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="mb-4 h-64 w-full rounded-3xl" />
        <Skeleton className="mb-2 h-10 w-3/4" />
        <Skeleton className="mb-6 h-4 w-40" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error) return <ErrorState message="Failed to load article." />;
  if (!article) {
    return (
      <EmptyState
        icon={ArrowLeft}
        title="Article not found"
        message="This article may have been removed or does not exist."
      >
        <Button variant="yellow" onClick={() => router.push("/news")}>
          Back to News
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="bg-grid min-h-dvh px-5 py-12">
      <article className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/news")}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border-4 border-ink bg-cream px-4 py-2 text-sm font-bold uppercase shadow-brutal-sm transition-transform hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </button>

        {article.coverImage && (
          <div className="mb-6 overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md">
            <img
              src={article.coverImage}
              alt={article.title}
              className="h-64 w-full object-cover sm:h-80"
            />
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge variant={categoryBadge[article.category] ?? "cream"}>
            <Tag className="h-3 w-3" />
            {article.category}
          </Badge>
          {article.publishedAt && (
            <span className="flex items-center gap-1 text-sm font-bold text-ink/50">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt.toMillis()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        <h1 className="mb-6 text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl">
          {article.title}
        </h1>

        <div
          className="prose prose-lg max-w-none font-medium leading-relaxed [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:uppercase [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-vred [&_a]:underline [&_a]:font-bold"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}

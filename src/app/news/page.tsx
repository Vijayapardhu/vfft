"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, Calendar, Tag } from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useState } from "react";
import type { NewsArticle, WithId } from "@/types";

const categories = [
  { label: "All", value: null },
  { label: "Match", value: "match" },
  { label: "Announcement", value: "announcement" },
  { label: "Update", value: "update" },
  { label: "Highlight", value: "highlight" },
  { label: "General", value: "general" },
];

const categoryBadge: Record<string, "red" | "yellow" | "purple" | "green" | "blue" | "cream"> = {
  match: "red",
  announcement: "yellow",
  update: "blue",
  highlight: "purple",
  general: "cream",
};

function NewsCard({ article }: { article: WithId<NewsArticle> }) {
  return (
    <Link href={`/news/${article.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-md transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
      >
        {article.coverImage && (
          <div className="h-48 overflow-hidden border-b-4 border-ink">
            <img
              src={article.coverImage}
              alt={article.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={categoryBadge[article.category] ?? "cream"}>
              <Tag className="h-3 w-3" />
              {article.category}
            </Badge>
            {article.publishedAt && (
              <span className="flex items-center gap-1 text-xs font-bold text-ink/50">
                <Calendar className="h-3 w-3" />
                {new Date(article.publishedAt.toMillis()).toLocaleDateString()}
              </span>
            )}
          </div>
          <h3 className="mb-2 text-xl font-bold uppercase tracking-tight group-hover:text-vred">
            {article.title}
          </h3>
          <p className="text-sm font-medium text-ink/60">{article.excerpt}</p>
        </div>
      </motion.div>
    </Link>
  );
}

export default function NewsPage() {
  const { data: articles, loading, error } = useNews();
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? articles.filter((a) => a.category === filter)
    : articles;

  return (
    <div className="bg-grid min-h-dvh px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold uppercase tracking-tight sm:text-5xl">
            <Newspaper className="mr-3 inline h-8 w-8" />
            News
          </h1>
          <p className="text-base font-medium text-ink/60">
            Latest updates, match reports and announcements
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setFilter(cat.value)}
              className={`rounded-xl border-2 border-ink px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                filter === cat.value
                  ? "bg-ink text-cream"
                  : "bg-cream hover:bg-vyellow"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border-4 border-ink p-5">
                <Skeleton className="mb-3 h-48 w-full" />
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="mb-2 h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message="Failed to load news." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No news yet"
            message="Check back later for updates."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

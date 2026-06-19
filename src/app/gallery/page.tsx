"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Image, X } from "lucide-react";
import { useGalleryItems } from "@/hooks/useGallery";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { GalleryType } from "@/types";

const galleryTypes: { label: string; value: GalleryType | null }[] = [
  { label: "All", value: null },
  { label: "Match", value: "match" },
  { label: "Winners", value: "winners" },
  { label: "Posters", value: "posters" },
  { label: "Teams", value: "teams" },
];

export default function GalleryPage() {
  const [filter, setFilter] = useState<GalleryType | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { data: items, loading, error } = useGalleryItems(filter);

  return (
    <div className="bg-grid min-h-dvh px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold uppercase tracking-tight sm:text-5xl">
            <Image className="mr-3 inline h-8 w-8" />
            Gallery
          </h1>
          <p className="text-base font-medium text-ink/60">
            Moments from the arena
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {galleryTypes.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setFilter(t.value)}
              className={`rounded-xl border-2 border-ink px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                filter === t.value
                  ? "bg-ink text-cream"
                  : "bg-cream hover:bg-vyellow"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message="Failed to load gallery." />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Image}
            title="No images yet"
            message="Gallery images will appear here once uploaded."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                onClick={() => setLightbox(item.imageUrl)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3">
                  <p className="text-sm font-bold text-cream">{item.title}</p>
                  <Badge variant="cream">{item.type}</Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-2xl border-4 border-ink bg-cream shadow-brutal-sm"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="Gallery preview"
            className="max-h-[90vh] max-w-full rounded-3xl border-4 border-ink shadow-brutal-xl"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useGalleryItems } from "@/hooks/useGallery";
import { cn } from "@/lib/utils";

/**
 * Cinematic auto-playing banner carousel driven by admin-managed `gallery`
 * items of type "banner" (Admin → Banners). Crossfade + Ken Burns zoom, swipe,
 * dots, arrows. Renders nothing when there are no banners.
 */
export function BannerCarousel({ className }: { className?: string }) {
  const { data: banners } = useGalleryItems("banner");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = banners.length;
  const go = useCallback(
    (next: number) => setIndex((i) => (count ? (next + count) % count : 0)),
    [count],
  );

  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5500);
    return () => clearInterval(t);
  }, [paused, count]);

  if (count === 0) return null;
  const banner = banners[index];
  if (!banner) return null;

  const Slide = (
    <>
      <AnimatePresence mode="popLayout">
        <motion.img
          key={banner.id}
          src={banner.imageUrl}
          alt={banner.title}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
      {(banner.title || banner.description) && (
        <motion.div
          key={`cap-${banner.id}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 p-4 sm:p-6"
        >
          {banner.title && (
            <h3 className="text-2xl font-bold uppercase text-cream drop-shadow-lg sm:text-4xl">
              {banner.title}
            </h3>
          )}
          {banner.description && (
            <p className="mt-1 max-w-2xl text-sm font-medium text-cream/80 sm:text-base">
              {banner.description}
            </p>
          )}
        </motion.div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "group relative aspect-[16/9] w-full overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md sm:aspect-[21/8]",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="absolute inset-0"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) go(index + 1);
          else if (info.offset.x > 60) go(index - 1);
        }}
      >
        {banner.link ? (
          <Link href={banner.link} className="block h-full w-full">
            {Slide}
          </Link>
        ) : (
          Slide
        )}
      </motion.div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl border-2 border-ink bg-cream/90 opacity-0 transition-opacity hover:bg-vyellow group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next banner"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl border-2 border-ink bg-cream/90 opacity-0 transition-opacity hover:bg-vyellow group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full border border-ink transition-all",
                  i === index ? "w-6 bg-vyellow" : "w-2 bg-cream/70",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { GalleryUploader } from "@/components/admin/GalleryUploader";
import { useGalleryItems } from "@/hooks/useGallery";
import { toast } from "@/hooks/useToast";
import { Plus, Trash2, X } from "lucide-react";
import type { GalleryType } from "@/types";

const galleryTypes: { label: string; value: GalleryType | null }[] = [
  { label: "All", value: null },
  { label: "Match", value: "match" },
  { label: "Winners", value: "winners" },
  { label: "Posters", value: "posters" },
  { label: "Teams", value: "teams" },
];

export default function AdminGalleryPage() {
  const [filter, setFilter] = useState<GalleryType | null>(null);
  // `showUploader` = panel open; `saving` = a write is in progress. These were
  // previously one flag, which left the "Upload All" button permanently disabled.
  const [showUploader, setShowUploader] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: items, loading, error } = useGalleryItems(filter);

  async function handleUpload(
    items: { title: string; imageUrl: string; type: GalleryType; description?: string }[],
  ): Promise<boolean> {
    setSaving(true);
    try {
      const batch = items.map((item) =>
        addDoc(collection(db, COLLECTIONS.gallery), {
          ...item,
          description: item.description ?? "",
          seasonId: null,
          uploadedAt: serverTimestamp(),
        }),
      );
      await Promise.all(batch);
      toast({ type: "success", message: `${items.length} image${items.length === 1 ? "" : "s"} added.` });
      return true;
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to upload images." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this image?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.gallery, id));
      toast({ type: "success", message: "Image deleted." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to delete image." });
    }
  }

  return (
    <div>
      <AdminHeader
        title="Gallery"
        subtitle="Manage gallery images"
        action={
          <Button variant="yellow" size="sm" onClick={() => setShowUploader(true)}>
            <Plus className="h-4 w-4" />
            Upload Images
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {galleryTypes.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setFilter(t.value)}
            className={`rounded-xl border-2 border-ink px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors ${
              filter === t.value ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showUploader && (
        <div className="mb-6">
          <GalleryUploader
            onSave={async (items) => {
              if (await handleUpload(items)) setShowUploader(false);
            }}
            saving={saving}
          />
          <Button variant="cream" size="sm" onClick={() => setShowUploader(false)} className="mt-3">
            Cancel
          </Button>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="font-bold text-vred">Failed to load gallery.</p>
      ) : items.length === 0 ? (
        <p className="text-sm font-medium text-ink/60">No gallery items yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-sm"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-48 w-full cursor-pointer object-cover transition-transform hover:scale-105"
                onClick={() => setLightbox(item.imageUrl)}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3">
                <p className="text-sm font-bold text-cream">{item.title}</p>
                <Badge variant="cream">{item.type}</Badge>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-vred text-ink opacity-0 shadow-brutal-xs transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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

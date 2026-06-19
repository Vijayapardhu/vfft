"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGalleryItems } from "@/hooks/useGallery";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";
import {
  Plus,
  Trash2,
  Image,
} from "lucide-react";
import type { GalleryItem, WithId } from "@/types";

export default function AdminBannersPage() {
  const { data: banners, loading } = useGalleryItems("banner");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WithId<GalleryItem> | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  function resetForm() {
    setTitle("");
    setImageUrl("");
    setLink("");
    setDescription("");
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(banner: WithId<GalleryItem>) {
    setEditing(banner);
    setTitle(banner.title);
    setImageUrl(banner.imageUrl);
    setLink(banner.link ?? "");
    setDescription(banner.description);
    setShowForm(true);
  }

  async function handleSave() {
    if (!imageUrl) {
      toast({ type: "error", message: "Please upload a banner image" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "gallery", editing.id), {
          title,
          imageUrl,
          link: link.trim(),
          description,
          updatedAt: serverTimestamp(),
        });
        toast({ type: "success", message: "Banner updated" });
      } else {
        await addDoc(collection(db, "gallery"), {
          title: title || "Banner",
          imageUrl,
          type: "banner",
          link: link.trim(),
          description,
          uploadedAt: serverTimestamp(),
          seasonId: null,
        });
        toast({ type: "success", message: "Banner added" });
      }
      resetForm();
    } catch {
      toast({ type: "error", message: "Failed to save banner" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return;
    try {
      await deleteDoc(doc(db, "gallery", id));
      toast({ type: "success", message: "Banner deleted" });
    } catch {
      toast({ type: "error", message: "Failed to delete" });
    }
  }

  return (
    <div>
      <AdminHeader
        title="Banners"
        subtitle="Manage homepage banner slides"
        action={
          <Button
            variant="yellow"
            size="sm"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Banner
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Edit Banner" : "New Banner"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Banner title"
                />
              </div>
              <div>
                <Label>Link (optional)</Label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <Label>Banner Image</Label>
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                folder="banners"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Alt text or description"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="cream" type="button" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                variant="yellow"
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : editing ? "Update" : "Add Banner"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Image className="h-12 w-12 text-ink/20" />
            <p className="text-lg font-bold text-ink/40">No banners yet</p>
            <p className="text-sm text-ink/40">
              Add your first banner to display on the homepage
            </p>
            <Button
              variant="yellow"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="group relative overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-lg font-bold text-cream drop-shadow-md">
                    {banner.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t-4 border-ink p-3">
                <div className="flex items-center gap-2">
                  {banner.description && (
                    <span className="text-xs font-medium text-ink/50 truncate max-w-[120px]">
                      {banner.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(banner)}
                    className="grid h-8 w-8 place-items-center rounded-xl border-2 border-ink bg-vyellow text-xs font-bold uppercase transition-colors hover:bg-vyellow/70"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    className="grid h-8 w-8 place-items-center rounded-xl border-2 border-ink bg-vred text-xs font-bold uppercase transition-colors hover:bg-vred/70"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

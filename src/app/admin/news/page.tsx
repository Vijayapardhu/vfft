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
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, type ColumnDef } from "@/components/admin/DataTable";
import { NewsEditor, type NewsFormData } from "@/components/admin/NewsEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllNews } from "@/hooks/useNews";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { NewsArticle, WithId } from "@/types";

const columns: ColumnDef<WithId<NewsArticle>>[] = [
  { key: "title", header: "Title", sortable: true },
  {
    key: "category",
    header: "Category",
    sortable: true,
    render: (item) => <Badge variant="purple">{item.category}</Badge>,
  },
  {
    key: "isPublished",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isPublished ? "green" : "red"}>
        {item.isPublished ? "Published" : "Draft"}
      </Badge>
    ),
  },
  {
    key: "publishedAt",
    header: "Date",
    sortable: true,
    render: (item) =>
      item.publishedAt
        ? new Date(item.publishedAt.toMillis()).toLocaleDateString()
        : "—",
  },
];

export default function AdminNewsPage() {
  const { data: news, loading, error } = useAllNews();
  const [editing, setEditing] = useState<WithId<NewsArticle> | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCreate(data: NewsFormData) {
    setSaving(true);
    try {
      await addDoc(collection(db, COLLECTIONS.news), {
        ...data,
        publishedAt: data.isPublished ? serverTimestamp() : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: NewsFormData) {
    if (!editing) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.news, editing.id), {
        ...data,
        publishedAt: data.isPublished
          ? editing.publishedAt ?? serverTimestamp()
          : null,
        updatedAt: serverTimestamp(),
      });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this article?")) return;
    await deleteDoc(doc(db, COLLECTIONS.news, id));
  }

  if (creating) {
    return (
      <div>
        <AdminHeader title="Create News Article" subtitle="Fill in the details below" />
        <NewsEditor onSave={handleCreate} saving={saving} />
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <AdminHeader title="Edit News Article" />
        <NewsEditor
          defaultValues={editing}
          onSave={handleUpdate}
          saving={saving}
        />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="News"
        subtitle="Manage news articles"
        action={
          <Button variant="yellow" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Create News
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={news}
        loading={loading}
        error={!!error}
        searchable
        searchKeys={["title", "category"]}
        actions={(item) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(item)}
              className="text-vblue hover:text-vblue/80"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="text-vred hover:text-vred/80"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}

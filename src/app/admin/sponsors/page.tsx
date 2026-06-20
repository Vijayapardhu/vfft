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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, FieldError } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllSponsors } from "@/hooks/useSponsors";
import { toast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Sponsor, WithId } from "@/types";

interface FormData {
  name: string;
  website: string;
  logoUrl: string;
  priority: number;
  isActive: boolean;
}

const columns: ColumnDef<WithId<Sponsor>>[] = [
  {
    key: "logoUrl",
    header: "Logo",
    render: (item) => (
      <img src={item.logoUrl} alt={item.name} className="h-8 w-8 rounded-lg border-2 border-ink object-cover" />
    ),
  },
  { key: "name", header: "Name", sortable: true },
  {
    key: "isActive",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isActive ? "green" : "red"}>
        {item.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  { key: "priority", header: "Priority", sortable: true },
];

export default function AdminSponsorsPage() {
  const { data: sponsors, loading, error } = useAllSponsors();
  const [editing, setEditing] = useState<WithId<Sponsor> | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormData>({
      defaultValues: { name: "", website: "", logoUrl: "", priority: 0, isActive: true },
    });

  async function handleCreate(data: FormData) {
    setSaving(true);
    try {
      await addDoc(collection(db, COLLECTIONS.sponsors), {
        ...(data as unknown as Record<string, unknown>),
        // valueAsNumber yields NaN for an empty field — Firestore rejects NaN.
        priority: Number.isFinite(data.priority) ? data.priority : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: "Sponsor added." });
      setCreating(false);
      reset();
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to add sponsor." });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: FormData) {
    if (!editing) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.sponsors, editing.id), {
        ...(data as unknown as Record<string, unknown>),
        priority: Number.isFinite(data.priority) ? data.priority : 0,
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: "Sponsor updated." });
      setEditing(null);
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to update sponsor." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sponsor?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.sponsors, id));
      toast({ type: "success", message: "Sponsor deleted." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to delete sponsor." });
    }
  }

  function startEdit(item: WithId<Sponsor>) {
    setEditing(item);
    reset({
      name: item.name,
      website: item.website,
      logoUrl: item.logoUrl,
      priority: item.priority,
      isActive: item.isActive,
    });
  }

  const form = (
    <form
      onSubmit={handleSubmit(editing ? handleUpdate : handleCreate)}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Sponsor Name</Label>
          <Input {...register("name", { required: "Required" })} placeholder="Sponsor name" />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label>Website URL</Label>
          <Input {...register("website")} placeholder="https://..." />
          <FieldError>{errors.website?.message}</FieldError>
        </div>
        <div>
          <Label>Priority (lower = first)</Label>
          <Input type="number" {...register("priority", { valueAsNumber: true })} />
        </div>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("isActive")} className="h-5 w-5 accent-vyellow" />
            <span className="text-sm font-bold uppercase">Active</span>
          </label>
        </div>
      </div>
      <div>
        <Label>Logo</Label>
        <ImageUploader
          value={watch("logoUrl")}
          onChange={(url) => setValue("logoUrl", url)}
          folder="banners"
        />
        <FieldError>{errors.logoUrl?.message}</FieldError>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="cream" type="button" onClick={() => { setCreating(false); setEditing(null); reset(); }}>
          Cancel
        </Button>
        <Button variant="yellow" type="submit" disabled={saving}>
          {saving ? "Saving..." : editing ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );

  return (
    <div>
      <AdminHeader
        title="Sponsors"
        subtitle="Manage sponsors"
        action={
          <Button variant="yellow" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Add Sponsor
          </Button>
        }
      />

      {(creating || editing) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Edit Sponsor" : "New Sponsor"}</CardTitle>
          </CardHeader>
          <CardContent>{form}</CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={sponsors}
        loading={loading}
        error={!!error}
        searchable
        searchKeys={["name"]}
        actions={(item) => (
          <div className="flex gap-2">
            <button type="button" onClick={() => startEdit(item)} className="text-vblue hover:text-vblue/80">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => handleDelete(item.id)} className="text-vred hover:text-vred/80">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}

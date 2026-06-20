"use client";

import { useState } from "react";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Plus, Pencil, Trash2, CloudUpload } from "lucide-react";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, type ColumnDef } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { FF_WEAPONS, FF_WEAPON_CATEGORIES } from "@/constants/weapons";
import { useForm } from "react-hook-form";
import { useWeapons } from "@/hooks/useWeapons";
import { toast } from "@/hooks/useToast";
import type { Weapon, WithId } from "@/types";

interface FormData {
  id: string;
  name: string;
  category: string;
  imageURL: string;
}

const columns: ColumnDef<WithId<Weapon>>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "category", header: "Category", sortable: true },
  {
    key: "imageURL",
    header: "Image",
    render: (item) =>
      item.imageURL ? (
        <img src={item.imageURL} alt={item.name} className="h-8 w-8 rounded-lg border-2 border-ink object-cover" />
      ) : (
        <span className="text-xs text-ink/40">—</span>
      ),
  },
];

export default function AdminWeaponsPage() {
  const { weapons, loading } = useWeapons();
  const [editing, setEditing] = useState<WithId<Weapon> | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormData>({
      defaultValues: { id: "", name: "", category: "", imageURL: "" },
    });

  async function handleCreate(data: FormData) {
    const id = data.id.trim();
    if (!id) return;
    setSaving(true);
    try {
      // Use the weapon code as the document id so edit/delete (and the mastery
      // map keyed by weapon id) all resolve to the same record.
      const ref = doc(db, COLLECTIONS.weapons, id);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        toast({ type: "error", message: `A weapon with id "${id}" already exists.` });
        return;
      }
      await setDoc(ref, {
        ...(data as unknown as Record<string, unknown>),
        id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: `Weapon "${id}" created.` });
      setCreating(false);
      reset();
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to create weapon." });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: FormData) {
    if (!editing) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.weapons, editing.id), {
        name: data.name,
        category: data.category,
        imageURL: data.imageURL ?? "",
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: "Weapon updated." });
      setEditing(null);
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to update weapon." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this weapon?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.weapons, id));
      toast({ type: "success", message: `Weapon "${id}" deleted.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to delete weapon." });
    }
  }

  function startEdit(item: WithId<Weapon>) {
    setEditing(item);
    reset({
      id: item.id,
      name: item.name,
      category: item.category,
      imageURL: item.imageURL ?? "",
    });
  }

  async function handleSeed() {
    if (!confirm(`Seed ${FF_WEAPONS.length} weapons from constants? Duplicate IDs will be skipped.`)) return;
    setSeeding(true);
    try {
      let added = 0;
      for (const w of FF_WEAPONS) {
        // Skip codes that already exist; write the rest keyed by weapon code.
        const existing = weapons.find((x) => x.id === w.id);
        if (!existing) {
          await setDoc(doc(db, COLLECTIONS.weapons, w.id), {
            ...(w as unknown as Record<string, unknown>),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          added++;
        }
      }
      toast({ type: "success", message: `Seeded ${added} new weapon${added === 1 ? "" : "s"} (${FF_WEAPONS.length - added} already existed).` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to seed weapons." });
    } finally {
      setSeeding(false);
    }
  }

  const form = (
    <form
      onSubmit={handleSubmit(editing ? handleUpdate : handleCreate)}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Weapon ID *</Label>
          <Input
            {...register("id", { required: "Required" })}
            placeholder="e.g. AK"
            disabled={!!editing}
          />
          <FieldError>{errors.id?.message}</FieldError>
        </div>
        <div>
          <Label>Weapon Name *</Label>
          <Input {...register("name", { required: "Required" })} placeholder="e.g. AK" />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label>Category *</Label>
          <select
            {...register("category", { required: "Required" })}
            className="w-full rounded-2xl border-4 border-ink bg-cream px-4 py-3 text-sm font-bold uppercase placeholder:text-ink/30"
          >
            <option value="">Select category</option>
            {FF_WEAPON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <FieldError>{errors.category?.message}</FieldError>
        </div>
      </div>
      <div>
        <Label>Weapon Image (optional)</Label>
        <ImageUploader
          value={watch("imageURL")}
          onChange={(url) => setValue("imageURL", url)}
          folder="weapons"
        />
        <FieldError>{errors.imageURL?.message}</FieldError>
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
        title="Weapons"
        subtitle="Manage Free Fire weapon definitions"
        action={
          <div className="flex gap-2">
            <Button variant="cream" size="sm" onClick={handleSeed} disabled={seeding}>
              <CloudUpload className="h-4 w-4" />
              {seeding ? "Seeding..." : "Seed from Defaults"}
            </Button>
            <Button variant="yellow" size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Add Weapon
            </Button>
          </div>
        }
      />

      {(creating || editing) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Edit Weapon" : "New Weapon"}</CardTitle>
          </CardHeader>
          <CardContent>{form}</CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={weapons}
        loading={loading}
        searchable
        searchKeys={["name", "id", "category"]}
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

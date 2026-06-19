"use client";

import { useState } from "react";
import { addDoc, collection, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useCollectionData } from "@/hooks/useFirestore";
import { seasonsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { useForm } from "react-hook-form";
import { Plus, Play, Archive, Copy, Trash2 } from "lucide-react";
import type { Season, WithId, SeasonStatus } from "@/types";

interface FormData {
  number: number;
  name: string;
  prizePool: string;
  startDate: string;
  endDate: string;
}

const defaultForm: FormData = { number: 1, name: "", prizePool: "", startDate: "", endDate: "" };

const statusBadge: Record<string, "yellow" | "green" | "red" | "blue"> = {
  upcoming: "yellow",
  active: "green",
  completed: "red",
};

export default function AdminSeasonsPage() {
  const { data: seasons, loading } = useCollectionData<Season>(
    isFirebaseConfigured ? seasonsCol() : null,
    [],
  );
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: defaultForm,
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      await addDoc(collection(db, COLLECTIONS.seasons), {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: "upcoming" as SeasonStatus,
        isActive: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCreating(false);
      reset(defaultForm);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(season: WithId<Season>, status: SeasonStatus) {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      // Activating: only the PREVIOUSLY active season is completed — upcoming
      // seasons keep their status. One active season at a time, atomically.
      if (status === "active") {
        for (const s of seasons) {
          if (s.id === season.id) continue;
          if (s.isActive || s.status === "active") {
            batch.update(doc(db, COLLECTIONS.seasons, s.id), {
              isActive: false,
              status: "completed",
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
      batch.update(doc(db, COLLECTIONS.seasons, season.id), {
        status,
        isActive: status === "active",
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(season: WithId<Season>) {
    if (!confirm(`Delete ${season.name}?`)) return;
    await deleteDoc(doc(db, COLLECTIONS.seasons, season.id));
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader
        title="Seasons"
        subtitle="Manage competitive seasons"
        action={
          <Button variant="yellow" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Create Season
          </Button>
        }
      />

      {creating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Season</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Season Number</Label>
                  <Input type="number" {...register("number", { valueAsNumber: true, required: "Required" })} />
                  <FieldError>{errors.number?.message}</FieldError>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input {...register("name", { required: "Required" })} placeholder="e.g. Season 5" />
                  <FieldError>{errors.name?.message}</FieldError>
                </div>
                <div>
                  <Label>Prize Pool</Label>
                  <Input {...register("prizePool")} placeholder="e.g. ₹50,000" />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" {...register("startDate")} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" {...register("endDate")} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="cream" type="button" onClick={() => setCreating(false)}>Cancel</Button>
                <Button variant="yellow" type="submit" disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((season) => (
          <Card key={season.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="truncate text-lg font-bold">{season.name}</h3>
                  <p className="text-xs font-medium text-ink/60">Season #{season.number}</p>
                </div>
                <Badge variant={statusBadge[season.status]}>{season.status}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm font-medium text-ink/60">
                <p>Prize: {season.prizePool ?? "—"}</p>
                <p>Start: {season.startDate ? new Date(season.startDate.toMillis()).toLocaleDateString() : "—"}</p>
                <p>End: {season.endDate ? new Date(season.endDate.toMillis()).toLocaleDateString() : "—"}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t-2 border-ink/10 pt-3">
                {(season.status === "upcoming" || season.status === "active") && (
                  <Button variant="green" size="sm" onClick={() => updateStatus(season, "active")} disabled={saving}>
                    <Play className="h-3 w-3" /> Activate
                  </Button>
                )}
                {season.status !== "completed" && (
                  <Button variant="red" size="sm" onClick={() => updateStatus(season, "completed")} disabled={saving}>
                    <Archive className="h-3 w-3" /> Archive
                  </Button>
                )}
                <Button variant="cream" size="sm" disabled>
                  <Copy className="h-3 w-3" /> Duplicate
                </Button>
                <Button variant="red" size="sm" onClick={() => handleDelete(season)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

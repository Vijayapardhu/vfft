"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { useForm } from "react-hook-form";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHallOfFame } from "@/hooks/useHallOfFame";
import { useTeams } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";
import { useSeasons } from "@/hooks/useSeasons";
import { toast } from "@/hooks/useToast";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, Pencil } from "lucide-react";

interface FormData {
  seasonId: string;
  seasonName: string;
  championTeamId: string | null;
  mvpPlayerId: string | null;
  bestTeamId: string | null;
  highestKillsPlayerId: string | null;
  highestKills: number | null;
}

export default function AdminHallOfFamePage() {
  const { data: entries, loading } = useHallOfFame();
  const { data: teams } = useTeams();
  const { data: players } = usePlayers();
  const { data: seasons } = useSeasons();
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  function editEntry(entry: typeof entries[number]) {
    reset({
      seasonId: entry.id,
      seasonName: entry.seasonName,
      championTeamId: entry.championTeamId ?? "",
      mvpPlayerId: entry.mvpPlayerId ?? "",
      bestTeamId: entry.bestTeamId ?? "",
      highestKillsPlayerId: entry.highestKillsPlayerId ?? "",
      highestKills: entry.highestKills,
    });
    setCreating(true);
  }

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<FormData>({
      defaultValues: {
        seasonId: "",
        seasonName: "",
        championTeamId: "",
        mvpPlayerId: "",
        bestTeamId: "",
        highestKillsPlayerId: "",
        highestKills: null,
      },
    });

  async function onSubmit(data: FormData) {
    if (!data.seasonId) return;
    setSaving(true);
    try {
      // Coalesce optional ids to null (never write "" or undefined) so the
      // user-facing Hall of Fame lookups resolve cleanly.
      await setDoc(
        doc(db, COLLECTIONS.hallOfFame, data.seasonId),
        {
          seasonId: data.seasonId,
          seasonName: data.seasonName,
          championTeamId: data.championTeamId || null,
          mvpPlayerId: data.mvpPlayerId || null,
          bestTeamId: data.bestTeamId || null,
          highestKillsPlayerId: data.highestKillsPlayerId || null,
          highestKills: data.highestKills ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast({ type: "success", message: "Hall of Fame entry saved." });
      reset();
      setCreating(false);
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to save entry." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(seasonId: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.hallOfFame, seasonId));
      toast({ type: "success", message: "Entry deleted." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to delete entry." });
    }
  }

  const selectedSeasonId = watch("seasonId");
  const seasonTeams = teams.filter((t) => t.seasonId === selectedSeasonId);
  const seasonPlayers = players.filter((p) => p.seasonId === selectedSeasonId);

  const selectClass =
    "min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-2 font-medium shadow-brutal-xs outline-none";

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader
        title="Hall of Fame"
        subtitle="Manage season honours"
        action={
          <Button variant="yellow" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Add Season
          </Button>
        }
      />

      {creating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Season Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Season</Label>
                <select
                  {...register("seasonId", {
                    required: "Select a season",
                    onChange: (e) => {
                      const s = seasons.find((s) => s.id === e.target.value);
                      if (s) setValue("seasonName", s.name ?? s.id);
                    },
                  })}
                  className={selectClass}
                >
                  <option value="">Select a season</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name ?? s.id}</option>
                  ))}
                </select>
                <FieldError>{errors.seasonId?.message}</FieldError>
                <input type="hidden" {...register("seasonName")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Champion Team</Label>
                  <select {...register("championTeamId")} className={selectClass}>
                    {!selectedSeasonId ? (
                      <option value="" disabled>Select a season first</option>
                    ) : seasonTeams.length === 0 ? (
                      <option value="" disabled>No teams registered</option>
                    ) : (
                      <>
                        <option value="">None</option>
                        {seasonTeams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <Label>MVP Player</Label>
                  <select {...register("mvpPlayerId")} className={selectClass}>
                    {!selectedSeasonId ? (
                      <option value="" disabled>Select a season first</option>
                    ) : seasonPlayers.length === 0 ? (
                      <option value="" disabled>No players registered</option>
                    ) : (
                      <>
                        <option value="">None</option>
                        {seasonPlayers.map((p) => (
                          <option key={p.id} value={p.id}>{p.ign}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <Label>Best Team</Label>
                  <select {...register("bestTeamId")} className={selectClass}>
                    {!selectedSeasonId ? (
                      <option value="" disabled>Select a season first</option>
                    ) : seasonTeams.length === 0 ? (
                      <option value="" disabled>No teams registered</option>
                    ) : (
                      <>
                        <option value="">None</option>
                        {seasonTeams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <Label>Highest Kills Player</Label>
                  <select {...register("highestKillsPlayerId")} className={selectClass}>
                    {!selectedSeasonId ? (
                      <option value="" disabled>Select a season first</option>
                    ) : seasonPlayers.length === 0 ? (
                      <option value="" disabled>No players registered</option>
                    ) : (
                      <>
                        <option value="">None</option>
                        {seasonPlayers.map((p) => (
                          <option key={p.id} value={p.id}>{p.ign}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <Label>Highest Kills Count</Label>
                <Input
                  type="number"
                  {...register("highestKills", {
                    setValueAs: (v) =>
                      v === "" || v == null ? null : Number(v),
                  })}
                  placeholder="e.g. 15"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="cream" type="button" onClick={() => setCreating(false)}>Cancel</Button>
                <Button variant="yellow" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && !creating ? (
        <p className="text-sm font-medium text-ink/60">No hall of fame entries yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => {
            const champion = teams.find((t) => t.id === entry.championTeamId);
            const mvp = players.find((p) => p.id === entry.mvpPlayerId);
            return (
              <Card key={entry.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {entry.seasonName}
                    <span className="flex gap-2">
                      <button type="button" onClick={() => editEntry(entry)} className="text-vblue">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(entry.id)} className="text-vred">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm font-medium">
                  <p className="truncate">Champion: {champion?.name ?? "—"}</p>
                  <p className="truncate">MVP: {mvp?.ign ?? "—"}</p>
                  <p>Highest Kills: {entry.highestKills ?? "—"}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

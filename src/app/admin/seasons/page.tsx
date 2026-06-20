"use client";

import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  Archive,
  Calendar,
  Check,
  Crown,
  Pencil,
  Play,
  Plus,
  Shield,
  Star,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { COLLECTIONS, seasonsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, FieldError, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollectionData } from "@/hooks/useFirestore";
import { useTeams } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";
import { toast } from "@/hooks/useToast";
import { MAX_SQUAD_SIZE } from "@/constants/app";
import { cn } from "@/lib/utils";
import type { Season, SeasonStatus, WithId } from "@/types";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface FormData {
  number: number;
  name: string;
  prizePool: string;
  squadSize: number;
  startDate: string;
  endDate: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(ts: Season["startDate"]): string {
  if (!ts) return "—";
  try {
    return new Date(ts.toMillis()).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return "—";
  }
}

function toTimestamp(dateStr: string): Timestamp | null {
  if (!dateStr) return null;
  // Parse as noon local time to avoid midnight-UTC timezone shifts
  const d = new Date(`${dateStr}T12:00:00`);
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

/* ── Season form (create / edit) ─────────────────────────────────────────── */

function SeasonForm({
  defaultValues,
  nextNumber,
  onSave,
  onCancel,
  saving,
}: {
  defaultValues?: Partial<FormData>;
  nextNumber: number;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      number: nextNumber,
      name: `Season ${nextNumber}`,
      prizePool: "",
      squadSize: MAX_SQUAD_SIZE,
      startDate: "",
      endDate: "",
      ...defaultValues,
    },
  });

  const start = watch("startDate");

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Season Number</Label>
          <Input
            type="number"
            min={1}
            {...register("number", { valueAsNumber: true, required: "Required", min: { value: 1, message: "Must be ≥ 1" } })}
          />
          <FieldError>{errors.number?.message}</FieldError>
        </div>
        <div>
          <Label>Name</Label>
          <Input
            {...register("name", { required: "Required" })}
            placeholder="e.g. Season 5"
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label>Prize Pool</Label>
          <Input {...register("prizePool")} placeholder="e.g. ₹50,000" />
        </div>
        <div>
          <Label>Squad Size (players per team)</Label>
          <Input
            type="number"
            min={1}
            max={10}
            {...register("squadSize", { valueAsNumber: true, min: { value: 1, message: "Min 1" }, max: { value: 10, message: "Max 10" } })}
          />
          <FieldError>{errors.squadSize?.message}</FieldError>
        </div>
        <div>
          <Label>Start Date</Label>
          <Input type="date" {...register("startDate")} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            {...register("endDate", {
              validate: (val) =>
                !val || !start || val >= start || "End date must be after start date",
            })}
            min={start || undefined}
          />
          <FieldError>{errors.endDate?.message}</FieldError>
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t-2 border-ink/10 pt-4">
        <Button variant="cream" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="yellow" type="submit" disabled={saving}>
          {saving ? "Saving…" : defaultValues?.name ? "Save Changes" : "Create Season"}
        </Button>
      </div>
    </form>
  );
}

/* ── Champion / MVP picker ───────────────────────────────────────────────── */

function ChampionMvpPicker({ season }: { season: WithId<Season> }) {
  const { data: teams } = useTeams();
  const { data: players } = usePlayers();
  const [saving, setSaving] = useState(false);
  const [champion, setChampion] = useState(season.championTeamId ?? "");
  const [mvp, setMvp] = useState(season.mvpPlayerId ?? "");

  const isDirty =
    champion !== (season.championTeamId ?? "") ||
    mvp !== (season.mvpPlayerId ?? "");

  async function save() {
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.seasons, season.id), {
        championTeamId: champion || null,
        mvpPlayerId: mvp || null,
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: "Champion & MVP saved." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  const championTeam = teams.find((t) => t.id === champion);
  const mvpPlayer = players.find((p) => p.id === mvp);

  return (
    <div className="mt-3 space-y-3 rounded-2xl border-2 border-ink/10 bg-ink/[0.03] p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
        Season Awards
      </p>

      {/* Champion */}
      <div className="space-y-1">
        <Label className="flex items-center gap-1.5 text-[11px]">
          <Crown className="h-3 w-3 text-vyellow" /> Champion Team
        </Label>
        <Select
          value={champion}
          onChange={(e) => setChampion(e.target.value)}
          className="text-sm"
        >
          <option value="">— Not set —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        {championTeam && (
          <p className="flex items-center gap-1 text-[11px] font-bold text-vgreen">
            <Check className="h-3 w-3" /> {championTeam.name}
          </p>
        )}
      </div>

      {/* MVP */}
      <div className="space-y-1">
        <Label className="flex items-center gap-1.5 text-[11px]">
          <Star className="h-3 w-3 text-vpurple" /> Season MVP
        </Label>
        <Select
          value={mvp}
          onChange={(e) => setMvp(e.target.value)}
          className="text-sm"
        >
          <option value="">— Not set —</option>
          {players
            .filter((p) => p.status === "approved")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.ign} {p.teamId ? "" : "(free agent)"}
              </option>
            ))}
        </Select>
        {mvpPlayer && (
          <p className="flex items-center gap-1 text-[11px] font-bold text-vpurple">
            <Check className="h-3 w-3" /> {mvpPlayer.ign}
          </p>
        )}
      </div>

      {isDirty && (
        <Button
          variant="yellow"
          size="sm"
          onClick={save}
          disabled={saving}
          className="w-full"
        >
          {saving ? "Saving…" : "Save Awards"}
        </Button>
      )}
    </div>
  );
}

/* ── Season card ─────────────────────────────────────────────────────────── */

const STATUS_HEADER: Record<SeasonStatus, string> = {
  upcoming: "bg-vyellow",
  active: "bg-vgreen",
  completed: "bg-ink",
};

const STATUS_BADGE: Record<SeasonStatus, "yellow" | "green" | "blue"> = {
  upcoming: "yellow",
  active: "green",
  completed: "blue",
};

function SeasonCard({
  season,
  allSeasons,
  onEdit,
}: {
  season: WithId<Season>;
  allSeasons: WithId<Season>[];
  onEdit: (s: WithId<Season>) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function updateStatus(status: SeasonStatus) {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      if (status === "active") {
        for (const s of allSeasons) {
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
      toast({ type: "success", message: `${season.name} is now ${status}.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to update status." });
    } finally {
      setSaving(false);
    }
  }

  async function duplicate() {
    setSaving(true);
    try {
      const nextNum = Math.max(...allSeasons.map((s) => s.number), 0) + 1;
      await addDoc(collection(db, COLLECTIONS.seasons), {
        number: nextNum,
        name: `Season ${nextNum}`,
        prizePool: season.prizePool ?? "",
        status: "upcoming" as SeasonStatus,
        isActive: false,
        startDate: null,
        endDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: `Created Season ${nextNum} from "${season.name}".` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to duplicate season." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (season.isActive) {
      toast({ type: "error", message: "Cannot delete the active season. Archive it first." });
      return;
    }
    if (!confirm(`Permanently delete "${season.name}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.seasons, season.id));
      toast({ type: "success", message: `${season.name} deleted.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to delete season." });
    }
  }

  const headerBg = STATUS_HEADER[season.status];
  const isActive = season.isActive;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border-4 border-ink transition-shadow",
        isActive ? "shadow-brutal-lg ring-4 ring-vgreen ring-offset-2" : "shadow-brutal-md",
      )}
    >
      {/* Header */}
      <div className={cn("relative border-b-4 border-ink px-5 py-4", headerBg)}>
        {/* Season number watermark */}
        <span
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-[72px] font-bold leading-none opacity-[0.08]",
            season.status === "completed" ? "text-white" : "text-ink",
          )}
        >
          {String(season.number).padStart(2, "0")}
        </span>

        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                season.status === "completed" ? "text-white/50" : "text-ink/50",
              )}
            >
              Season #{season.number}
            </p>
            <h3
              className={cn(
                "truncate text-xl font-bold",
                season.status === "completed" ? "text-white" : "text-ink",
              )}
            >
              {season.name}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant={STATUS_BADGE[season.status]}>{season.status}</Badge>
            {isActive && (
              <span className="rounded-full bg-vgreen px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-ink">
                ● Live
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 bg-cream p-5">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              icon: Trophy,
              label: "Prize",
              value: season.prizePool || "—",
            },
            {
              icon: Calendar,
              label: "Start",
              value: fmtDate(season.startDate),
            },
            {
              icon: Calendar,
              label: "End",
              value: fmtDate(season.endDate),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl border-2 border-ink/10 bg-ink/[0.03] px-2 py-2 text-center"
            >
              <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-ink/40" />
              <p className="truncate text-xs font-bold">{value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-ink/40">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Champion & MVP (completed seasons) */}
        {season.status === "completed" && (
          <ChampionMvpPicker season={season} />
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 border-t-2 border-ink/10 pt-3">
          {/* Edit */}
          <Button
            variant="cream"
            size="sm"
            onClick={() => onEdit(season)}
            disabled={saving}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>

          {/* Activate — only for non-active seasons */}
          {!isActive && season.status !== "completed" && (
            <Button
              variant="green"
              size="sm"
              onClick={() => updateStatus("active")}
              disabled={saving}
            >
              <Play className="h-3 w-3" />
              Activate
            </Button>
          )}

          {/* Complete / Archive */}
          {season.status !== "completed" && (
            <Button
              variant="red"
              size="sm"
              onClick={async () => {
                if (!confirm(`Archive "${season.name}"? This will mark it as completed.`)) return;
                await updateStatus("completed");
              }}
              disabled={saving}
            >
              <Archive className="h-3 w-3" />
              Archive
            </Button>
          )}

          {/* Reopen archived season */}
          {season.status === "completed" && (
            <Button
              variant="yellow"
              size="sm"
              onClick={() => updateStatus("upcoming")}
              disabled={saving}
            >
              <Play className="h-3 w-3" />
              Reopen
            </Button>
          )}

          {/* Duplicate */}
          <Button
            variant="cream"
            size="sm"
            onClick={duplicate}
            disabled={saving}
          >
            <Shield className="h-3 w-3" />
            Duplicate
          </Button>

          {/* Delete */}
          <Button
            variant="red"
            size="sm"
            onClick={handleDelete}
            disabled={saving || isActive}
            title={isActive ? "Cannot delete active season" : "Delete season"}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function AdminSeasonsPage() {
  const { data: rawSeasons, loading } = useCollectionData<Season>(
    isFirebaseConfigured ? seasonsCol() : null,
    [],
  );
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WithId<Season> | null>(null);
  const [saving, setSaving] = useState(false);

  const seasons = useMemo(
    () => [...rawSeasons].sort((a, b) => b.number - a.number),
    [rawSeasons],
  );

  const activeSeason = seasons.find((s) => s.isActive) ?? null;
  const nextNumber = useMemo(
    () => Math.max(...seasons.map((s) => s.number), 0) + 1,
    [seasons],
  );

  /* ─ Create ─ */
  async function handleCreate(data: FormData) {
    setSaving(true);
    try {
      await addDoc(collection(db, COLLECTIONS.seasons), {
        number: data.number,
        name: data.name,
        prizePool: data.prizePool,
        squadSize: Number.isFinite(data.squadSize) && data.squadSize > 0 ? data.squadSize : MAX_SQUAD_SIZE,
        startDate: toTimestamp(data.startDate),
        endDate: toTimestamp(data.endDate),
        status: "upcoming" as SeasonStatus,
        isActive: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: `${data.name} created.` });
      setCreating(false);
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to create season." });
    } finally {
      setSaving(false);
    }
  }

  /* ─ Edit ─ */
  async function handleEdit(data: FormData) {
    if (!editing) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.seasons, editing.id), {
        number: data.number,
        name: data.name,
        prizePool: data.prizePool,
        squadSize: Number.isFinite(data.squadSize) && data.squadSize > 0 ? data.squadSize : MAX_SQUAD_SIZE,
        startDate: toTimestamp(data.startDate),
        endDate: toTimestamp(data.endDate),
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: `${data.name} updated.` });
      setEditing(null);
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to update season." });
    } finally {
      setSaving(false);
    }
  }

  function toFormDefaults(s: WithId<Season>): Partial<FormData> {
    function tsToInput(ts: Season["startDate"]): string {
      if (!ts) return "";
      try {
        const d = new Date(ts.toMillis());
        return d.toISOString().split("T")[0] ?? "";
      } catch { return ""; }
    }
    return {
      number: s.number,
      name: s.name,
      prizePool: s.prizePool ?? "",
      squadSize: s.squadSize ?? MAX_SQUAD_SIZE,
      startDate: tsToInput(s.startDate),
      endDate: tsToInput(s.endDate),
    };
  }

  return (
    <div>
      <AdminHeader
        title="Seasons"
        subtitle="Manage competitive seasons"
        action={
          !creating && !editing ? (
            <Button variant="yellow" size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New Season
            </Button>
          ) : undefined
        }
      />

      {/* Active season banner */}
      {activeSeason && !creating && !editing && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border-4 border-vgreen bg-vgreen/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-vgreen bg-vgreen">
              <Play className="h-4 w-4 text-ink" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">
                Currently active
              </p>
              <p className="font-bold">{activeSeason.name}</p>
            </div>
          </div>
          <Badge variant="green">Live</Badge>
        </div>
      )}

      {/* Create / Edit form panel */}
      {(creating || editing) && (
        <div className="mb-8 overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md">
          <div className="flex items-center justify-between border-b-4 border-ink bg-vyellow px-5 py-3">
            <h2 className="font-bold uppercase">
              {creating ? "New Season" : `Editing — ${editing?.name}`}
            </h2>
            <button
              type="button"
              onClick={() => { setCreating(false); setEditing(null); }}
              className="rounded-lg border-2 border-ink bg-cream/60 p-1 hover:bg-cream"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-cream p-5">
            <SeasonForm
              key={editing?.id ?? "create"}
              defaultValues={editing ? toFormDefaults(editing) : undefined}
              nextNumber={nextNumber}
              onSave={editing ? handleEdit : handleCreate}
              onCancel={() => { setCreating(false); setEditing(null); }}
              saving={saving}
            />
          </div>
        </div>
      )}

      {/* Season cards */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border-4 border-ink">
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No seasons yet"
          message="Create your first season to get started."
        >
          <Button variant="yellow" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Create Season
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <SeasonCard
              key={season.id}
              season={season}
              allSeasons={seasons}
              onEdit={(s) => { setEditing(s); setCreating(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

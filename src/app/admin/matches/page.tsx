"use client";

import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useForm } from "react-hook-form";
import { generateFixtures, setMatchLiveState } from "@/services/adminService";
import { remindLineup } from "@/services/lineupService";
import { toast } from "@/hooks/useToast";
import { Plus, Pencil, Trash2, Play, CheckCircle, XCircle, BellRing } from "lucide-react";
import type { Match, WithId, MatchStatus, MatchStage } from "@/types";

interface FormData {
  name: string;
  team1Id: string;
  team2Id: string;
  scheduledAt: string;
  map: string;
  stage: MatchStage;
  teamSize: number;
}

const defaultForm: FormData = {
  name: "", team1Id: "", team2Id: "", scheduledAt: "", map: "", stage: "league", teamSize: 4,
};

/** Players per side options for a match room (Free Fire squad sizes). */
const TEAM_SIZE_OPTIONS = [1, 2, 3, 4, 5, 6];

const stageOptions: MatchStage[] = ["league", "qualifier1", "eliminator", "qualifier2", "final"];

const statusBadge: Record<string, "yellow" | "green" | "red" | "blue"> = {
  upcoming: "yellow",
  live: "red",
  completed: "green",
};

export default function AdminMatchesPage() {
  const { data: matches, loading, error } = useMatches();
  const { data: teams } = useTeams();
  const { seasonId } = useActiveSeason();
  const [editing, setEditing] = useState<WithId<Match> | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genFormat, setGenFormat] = useState<"single" | "double">("single");
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  async function handleGenerate() {
    if (!seasonId) {
      setGenMsg("No active season — create one first.");
      return;
    }
    if (
      !confirm(
        `Generate ${genFormat} round-robin fixtures for every team in the season?`,
      )
    )
      return;
    setGenBusy(true);
    setGenMsg(null);
    try {
      const res = await generateFixtures({ seasonId, format: genFormat });
      setGenMsg(`Generated ${res.count} matches.`);
    } catch (e) {
      setGenMsg(e instanceof Error ? e.message : "Failed to generate fixtures.");
    } finally {
      setGenBusy(false);
    }
  }

  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: defaultForm,
  });

  function startCreate() {
    setCreating(true);
    setEditing(null);
    reset(defaultForm);
  }

  function startEdit(match: WithId<Match>) {
    setEditing(match);
    setCreating(false);
    reset({
      name: match.name ?? "",
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      scheduledAt: match.scheduledAt ? new Date(match.scheduledAt.toMillis()).toISOString().slice(0, 16) : "",
      map: match.map,
      stage: match.stage,
      teamSize: match.teamSize ?? 4,
    });
  }

  async function onSubmit(data: FormData) {
    if (!editing && !seasonId) {
      setGenMsg("No active season — create one first.");
      return;
    }
    setSaving(true);
    try {
      // Common, edit-safe fields (editable at ANY status, incl. completed).
      // Never overwrite status / matchNumber / seasonId on edit (those are
      // owned by the live-state route + creation).
      const base = {
        name: data.name.trim(),
        team1Id: data.team1Id,
        team2Id: data.team2Id,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        map: data.map,
        stage: data.stage,
        teamSize: Number.isFinite(data.teamSize) ? data.teamSize : 4,
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(doc(db, COLLECTIONS.matches, editing.id), base);
      } else {
        await addDoc(collection(db, COLLECTIONS.matches), {
          ...base,
          matchNumber: matches.length + 1,
          status: "upcoming" as MatchStatus,
          seasonId,
          createdAt: serverTimestamp(),
        });
      }
      setCreating(false);
      setEditing(null);
      reset(defaultForm);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this match?")) return;
    await deleteDoc(doc(db, COLLECTIONS.matches, id));
  }

  async function updateMatchStatus(match: WithId<Match>, status: MatchStatus) {
    setSaving(true);
    try {
      // Routes through the server so it also broadcasts live state to RTDB.
      await setMatchLiveState(match.id, status);
    } finally {
      setSaving(false);
    }
  }

  async function notifyLineups(match: WithId<Match>) {
    setSaving(true);
    try {
      const res = await remindLineup(match.id);
      toast({ type: "success", message: `Lineup reminder sent to ${res.notified} leader(s).` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to notify." });
    } finally {
      setSaving(false);
    }
  }

  function renderMatchCard(match: WithId<Match>) {
    const team1 = teams.find((t) => t.id === match.team1Id);
    const team2 = teams.find((t) => t.id === match.team2Id);
    return (
      <Card key={match.id}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <img src={team1?.logoUrl || "/placeholder-team.svg"} alt={team1?.name} className="mx-auto mb-1 h-10 w-10 rounded-xl border-2 border-ink object-cover" />
                <p className="truncate text-xs font-bold">{team1?.name ?? "TBD"}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">VS</p>
                <Badge variant={statusBadge[match.status]}>{match.status}</Badge>
              </div>
              <div className="text-center">
                <img src={team2?.logoUrl || "/placeholder-team.svg"} alt={team2?.name} className="mx-auto mb-1 h-10 w-10 rounded-xl border-2 border-ink object-cover" />
                <p className="truncate text-xs font-bold">{team2?.name ?? "TBD"}</p>
              </div>
            </div>
            <div className="text-right text-xs font-medium text-ink/60">
              <p className="font-bold text-ink">{match.name || `Match #${match.matchNumber}`}</p>
              <p>{match.scheduledAt ? new Date(match.scheduledAt.toMillis()).toLocaleDateString() : "—"}</p>
              <div className="flex justify-end gap-1">
                <Badge variant="cream">{match.map || "Map TBD"}</Badge>
                <Badge variant="blue">{match.teamSize ?? 4}v{match.teamSize ?? 4}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t-2 border-ink/10 pt-3">
            <Button variant="cream" size="sm" onClick={() => startEdit(match)}><Pencil className="h-3 w-3" /> Edit</Button>
            <Button variant="red" size="sm" onClick={() => handleDelete(match.id)}><Trash2 className="h-3 w-3" /></Button>
            {match.status === "upcoming" && (
              <Button variant="cream" size="sm" disabled={saving} onClick={() => notifyLineups(match)}><BellRing className="h-3 w-3" /> Notify Lineup</Button>
            )}
            {match.status === "upcoming" && (
              <Button variant="blue" size="sm" onClick={() => updateMatchStatus(match, "live")}><Play className="h-3 w-3" /> Go Live</Button>
            )}
            {match.status === "live" && (
              <Button variant="green" size="sm" onClick={() => updateMatchStatus(match, "completed")}><CheckCircle className="h-3 w-3" /> Complete</Button>
            )}
            {match.status === "completed" && (
              <Button variant="yellow" size="sm" onClick={() => updateMatchStatus(match, "upcoming")}><XCircle className="h-3 w-3" /> Reopen</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filterByStatus = (status: MatchStatus) => matches.filter((m) => m.status === status);

  const tabs = [
    { id: "upcoming", label: `Upcoming (${filterByStatus("upcoming").length})`, content: <div className="grid gap-3 sm:grid-cols-2">{filterByStatus("upcoming").map(renderMatchCard)}</div> },
    { id: "live", label: `Live (${filterByStatus("live").length})`, content: <div className="grid gap-3 sm:grid-cols-2">{filterByStatus("live").map(renderMatchCard)}</div> },
    { id: "completed", label: `Completed (${filterByStatus("completed").length})`, content: <div className="grid gap-3 sm:grid-cols-2">{filterByStatus("completed").map(renderMatchCard)}</div> },
  ];

  return (
    <div>
      <AdminHeader
        title="Matches"
        subtitle="Manage fixtures"
        action={
          <Button variant="yellow" size="sm" onClick={startCreate}>
            <Plus className="h-4 w-4" /> Create Match
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-bold uppercase">⚡ Auto Fixtures</span>
          <Select
            value={genFormat}
            onChange={(e) => setGenFormat(e.target.value as "single" | "double")}
            className="max-w-[200px]"
          >
            <option value="single">Single round robin</option>
            <option value="double">Double round robin</option>
          </Select>
          <Button variant="blue" size="sm" onClick={handleGenerate} disabled={genBusy || !seasonId}>
            {genBusy ? "Generating…" : "Generate Fixtures"}
          </Button>
          {genMsg && <span className="text-sm font-bold text-ink/60">{genMsg}</span>}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Edit Match" : "Create Match"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Match Name (optional)</Label>
                <Input {...register("name")} placeholder='e.g. "Grand Final" — defaults to "Match #N"' />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Team 1</Label>
                  <Select {...register("team1Id", { required: "Required" })}>
                    <option value="">Select team</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Team 2</Label>
                  <Select {...register("team2Id", { required: "Required" })}>
                    <option value="">Select team</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Scheduled At</Label>
                  <Input type="datetime-local" {...register("scheduledAt")} />
                </div>
                <div>
                  <Label>Map</Label>
                  <Input {...register("map")} placeholder="e.g. Bermuda" />
                </div>
                <div>
                  <Label>Players per side (room size)</Label>
                  <Select {...register("teamSize", { valueAsNumber: true })}>
                    {TEAM_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n} v {n}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select {...register("stage")}>
                    {stageOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="cream" type="button" onClick={() => { setCreating(false); setEditing(null); reset(defaultForm); }}>Cancel</Button>
                <Button variant="yellow" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <Spinner /> : error ? <p className="font-bold text-vred">Failed to load matches.</p> : <Tabs tabs={tabs} />}
    </div>
  );
}

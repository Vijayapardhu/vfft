"use client";

import { useState } from "react";
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, FieldError } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SquadManager } from "@/components/admin/SquadManager";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useTeams } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, DollarSign, Users } from "lucide-react";
import { toast } from "@/hooks/useToast";
import type { Team, WithId } from "@/types";

interface FormData {
  name: string;
  logoUrl: string;
  bannerUrl: string;
  ownerUid: string;
  teamLeaderUid: string;
  primaryColor: string;
  secondaryColor: string;
  purse: number;
}

const defaultForm: FormData = {
  name: "", logoUrl: "", bannerUrl: "", ownerUid: "", teamLeaderUid: "",
  primaryColor: "#FFD93D", secondaryColor: "#FF6B6B", purse: 10000,
};

export default function AdminTeamsPage() {
  const { data: teams, loading, error } = useTeams();
  const { data: players } = usePlayers();
  const { seasonId, season } = useActiveSeason();
  const [editing, setEditing] = useState<WithId<Team> | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [managingSquadId, setManagingSquadId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: defaultForm,
  });

  function startCreate() {
    setCreating(true);
    setEditing(null);
    reset(defaultForm);
  }

  function startEdit(team: WithId<Team>) {
    setEditing(team);
    setCreating(false);
    reset({
      name: team.name,
      logoUrl: team.logoUrl ?? "",
      bannerUrl: team.bannerUrl ?? "",
      ownerUid: team.ownerUid,
      teamLeaderUid: team.teamLeaderUid,
      primaryColor: team.primaryColor ?? "#FFD93D",
      secondaryColor: team.secondaryColor ?? "#FF6B6B",
      purse: team.purse,
    });
  }

  async function syncUserRole(uid: string, teamId: string | null, role: string) {
    if (!uid) return;
    const ref = doc(db, COLLECTIONS.users, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data() as { role?: string };
    await updateDoc(ref, {
      teamId,
      role: current.role === "admin" ? current.role : role,
    });
  }

  /**
   * Put a team member (owner or leader) on their own roster — and out of the
   * auction pool — if they're a registered player. Only auto-signs a free agent
   * at price 0; a player already bought onto another team is left alone (use
   * Manage Squad for purse-sensitive moves).
   */
  async function linkMemberToSquad(uid: string, teamId: string) {
    if (!uid) return;
    const player = players.find((p) => p.uid === uid);
    if (!player) return; // member has no player profile — nothing to roster
    if (player.teamId) return; // already on a team (this one or another) — leave it
    const batch = writeBatch(db);
    batch.update(doc(db, COLLECTIONS.players, player.id), {
      teamId,
      soldPrice: 0,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, COLLECTIONS.teams, teamId), {
      squad: arrayUnion(player.id),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  }

  /** Release a former member who was auto-signed (price 0) back to the pool. */
  async function unlinkMemberFromSquad(uid: string, teamId: string) {
    if (!uid) return;
    const player = players.find((p) => p.uid === uid);
    if (!player || player.teamId !== teamId) return;
    if (player.soldPrice && player.soldPrice > 0) return; // purchased — keep on roster
    const batch = writeBatch(db);
    batch.update(doc(db, COLLECTIONS.players, player.id), {
      teamId: null,
      soldPrice: deleteField(),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, COLLECTIONS.teams, teamId), {
      squad: arrayRemove(player.id),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  }

  async function onSubmit(data: FormData) {
    if (!editing && !seasonId) {
      toast({ type: "error", message: "No active season — create one in the Seasons page first." });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const old = editing;
        await updateDoc(doc(db, COLLECTIONS.teams, editing.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        const newOwner = data.ownerUid;
        const newLeader = data.teamLeaderUid;
        const same = newOwner && newOwner === newLeader;
        // Clear previous owner/leader if changed
        if (newOwner && newOwner !== old.ownerUid) {
          await syncUserRole(old.ownerUid, null, "player");
        }
        if (newLeader && newLeader !== old.teamLeaderUid && !same) {
          await syncUserRole(old.teamLeaderUid, null, "player");
        }
        // Set new roles
        if (same) {
          await syncUserRole(newOwner, editing.id, "franchiseOwner");
        } else {
          if (newOwner) await syncUserRole(newOwner, editing.id, "franchiseOwner");
          if (newLeader) await syncUserRole(newLeader, editing.id, "teamLeader");
        }
        // Keep the owner + captain on the roster (and out of the auction pool).
        // Release any member no longer attached, then roster the current ones.
        const oldMembers = [old.ownerUid, old.teamLeaderUid].filter(Boolean) as string[];
        const newMembers = [newOwner, newLeader].filter(Boolean) as string[];
        for (const uid of oldMembers) {
          if (!newMembers.includes(uid)) await unlinkMemberFromSquad(uid, editing.id);
        }
        for (const uid of newMembers) {
          await linkMemberToSquad(uid, editing.id);
        }
      } else {
        const ref = await addDoc(collection(db, COLLECTIONS.teams), {
          ...data,
          seasonId,
          squad: [],
          remainingPurse: data.purse,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const same = data.ownerUid && data.ownerUid === data.teamLeaderUid;
        const leaderRole = same ? "franchiseOwner" : "teamLeader";
        await Promise.all([
          data.ownerUid ? syncUserRole(data.ownerUid, ref.id, "franchiseOwner") : Promise.resolve(),
          data.teamLeaderUid ? syncUserRole(data.teamLeaderUid, ref.id, leaderRole) : Promise.resolve(),
        ]);
        // Auto-roster the owner + captain so they're not put up for auction.
        for (const uid of [data.ownerUid, data.teamLeaderUid].filter(Boolean) as string[]) {
          await linkMemberToSquad(uid, ref.id);
        }
      }
      toast({ type: "success", message: editing ? "Team updated." : "Team created." });
      setCreating(false);
      setEditing(null);
      reset(defaultForm);
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to save team." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(team: WithId<Team>) {
    if (!confirm(`Delete ${team.name}? Its players are released back to the pool.`)) return;
    setSaving(true);
    try {
      await Promise.all([
        team.ownerUid ? syncUserRole(team.ownerUid, null, "player") : Promise.resolve(),
        team.teamLeaderUid ? syncUserRole(team.teamLeaderUid, null, "player") : Promise.resolve(),
      ]);
      // Release every signed player so they don't point at a deleted team.
      const squadPlayers = players.filter((p) => p.teamId === team.id);
      if (squadPlayers.length > 0) {
        const batch = writeBatch(db);
        for (const p of squadPlayers) {
          batch.update(doc(db, COLLECTIONS.players, p.id), {
            teamId: null,
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }
      await deleteDoc(doc(db, COLLECTIONS.teams, team.id));
      toast({ type: "success", message: `${team.name} deleted.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to delete team." });
    } finally {
      setSaving(false);
    }
  }

  async function resetPurse(team: WithId<Team>) {
    if (!confirm(`Reset purse for ${team.name}?`)) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.teams, team.id), {
        remainingPurse: team.purse,
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: `Purse reset for ${team.name}.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to reset purse." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <p className="font-bold text-vred">Failed to load teams.</p>;

  return (
    <div>
      <AdminHeader
        title="Teams"
        subtitle="Manage franchises"
        action={
          <Button variant="yellow" size="sm" onClick={startCreate}>
            <Plus className="h-4 w-4" /> Create Team
          </Button>
        }
      />

      {(creating || editing) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Edit Team" : "Create Team"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Team Name</Label>
                  <Input {...register("name", { required: "Required" })} placeholder="Team name" />
                  <FieldError>{errors.name?.message}</FieldError>
                </div>
                <div>
                  <Label>Owner</Label>
                  <Select {...register("ownerUid")}>
                    <option value="">Select owner…</option>
                    {players.length === 0 && <option value="" disabled>No players registered</option>}
                    {players.map((p) => (
                      <option key={p.id} value={p.uid}>{p.ign} ({p.role})</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Team Leader</Label>
                  <Select {...register("teamLeaderUid")}>
                    <option value="">Select team leader…</option>
                    {players.length === 0 && <option value="" disabled>No players registered</option>}
                    {players.map((p) => (
                      <option key={p.id} value={p.uid}>{p.ign} ({p.role})</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Purse (Budget)</Label>
                  <Input type="number" {...register("purse", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>Primary Color</Label>
                  <Input {...register("primaryColor")} placeholder="#FFD93D" />
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <Input {...register("secondaryColor")} placeholder="#FF6B6B" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Logo</Label>
                  <ImageUploader value={watch("logoUrl")} onChange={(url) => setValue("logoUrl", url)} folder="teams" />
                </div>
                <div>
                  <Label>Banner</Label>
                  <ImageUploader value={watch("bannerUrl")} onChange={(url) => setValue("bannerUrl", url)} folder="teams" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="cream" type="button" onClick={() => { setCreating(false); setEditing(null); reset(defaultForm); }}>
                  Cancel
                </Button>
                <Button variant="yellow" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const owner = players.find((p) => p.uid === team.ownerUid);
          const leader = players.find((p) => p.uid === team.teamLeaderUid);
          return (
          <Card key={team.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={team.logoUrl || "/placeholder-team.svg"}
                  alt={team.name}
                  className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold">{team.name}</h3>
                  <p className="text-xs font-medium text-ink/60">Owner: {owner?.ign ?? "—"}</p>
                  <p className="text-xs font-medium text-ink/60">Leader: {leader?.ign ?? "—"}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="blue">{team.squad?.length ?? 0} Players</Badge>
                    <Badge variant="yellow"><DollarSign className="h-3 w-3" /> {team.purse}</Badge>
                    <Badge variant="green"><DollarSign className="h-3 w-3" /> {team.remainingPurse}</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t-2 border-ink/10 pt-3">
                <Button variant="blue" size="sm" onClick={() => setManagingSquadId(team.id)} disabled={saving}>
                  <Users className="h-3 w-3" /> Manage Squad
                </Button>
                <Button variant="cream" size="sm" onClick={() => startEdit(team)} disabled={saving}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button variant="red" size="sm" onClick={() => handleDelete(team)} disabled={saving}>
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
                <Button variant="yellow" size="sm" onClick={() => resetPurse(team)} disabled={saving}>
                  <DollarSign className="h-3 w-3" /> Reset Purse
                </Button>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {managingSquadId && (
        <SquadManager
          teamId={managingSquadId}
          teams={teams}
          players={players}
          maxSquad={season?.squadSize}
          onClose={() => setManagingSquadId(null)}
        />
      )}
    </div>
  );
}

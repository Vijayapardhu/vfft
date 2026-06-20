"use client";

import { useState, useMemo } from "react";
import { arrayRemove, doc, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { toast } from "@/hooks/useToast";
import { reviewPlayer } from "@/services/adminService";
import { PlayerDetailDialog } from "@/components/player/PlayerDetailDialog";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserMinus,
  Eye,
} from "lucide-react";
import type { Player, WithId, ApprovalStatus, PlayerStatus } from "@/types";

const statusBadge: Record<string, "yellow" | "green" | "red" | "purple"> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
  suspended: "purple",
};

const roleOptions = ["rusher", "sniper", "support", "igl"];

export default function AdminPlayersPage() {
  const { data: allPlayers, loading, error } = usePlayers();
  const { data: teams } = useTeams();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<WithId<Player> | null>(null);

  const filtered = useMemo(() => {
    let list = allPlayers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.ign.toLowerCase().includes(q) ||
          (p.uid && p.uid.toLowerCase().includes(q)),
      );
    }
    if (roleFilter) list = list.filter((p) => p.role === roleFilter);
    if (teamFilter) list = list.filter((p) => p.teamId === teamFilter);
    return list;
  }, [allPlayers, search, roleFilter, teamFilter]);

  async function updateStatus(playerId: string, status: PlayerStatus) {
    setSaving(true);
    try {
      // Approve/reject go through the server route so the owning user's role
      // is linked atomically; pending/suspended are plain admin writes.
      if (status === "approved") {
        await reviewPlayer(playerId, "approve");
      } else if (status === "rejected") {
        await reviewPlayer(playerId, "reject");
      } else {
        await updateDoc(doc(db, COLLECTIONS.players, playerId), {
          status,
          updatedAt: serverTimestamp(),
        });
      }
      toast({ type: "success", message: `Player marked ${status}.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to update player." });
    } finally {
      setSaving(false);
    }
  }

  async function removeTeam(playerId: string) {
    if (!confirm("Remove this player from their team? Their seat is freed (no purse refund here — use Manage Squad for that).")) return;
    setSaving(true);
    try {
      // Keep both sides in sync: clear the player's teamId AND remove them from
      // the team's squad array (otherwise the seat is never freed).
      const teamId = allPlayers.find((p) => p.id === playerId)?.teamId;
      const batch = writeBatch(db);
      batch.update(doc(db, COLLECTIONS.players, playerId), {
        teamId: null,
        updatedAt: serverTimestamp(),
      });
      if (teamId) {
        batch.update(doc(db, COLLECTIONS.teams, teamId), {
          squad: arrayRemove(playerId),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      toast({ type: "success", message: "Player removed from team." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to remove from team." });
    } finally {
      setSaving(false);
    }
  }

  async function bulkAction(status: ApprovalStatus) {
    setSaving(true);
    try {
      const ids = [...selected];
      await Promise.all(
        ids.map((id) =>
          reviewPlayer(id, status === "approved" ? "approve" : "reject"),
        ),
      );
      setSelected(new Set());
      setSelectMode(false);
      toast({ type: "success", message: `${ids.length} player(s) ${status}.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Bulk action failed." });
    } finally {
      setSaving(false);
    }
  }

  function renderPlayerCard(player: WithId<Player>) {
    const team = teams.find((t) => t.id === player.teamId);
    return (
      <Card key={player.id}>
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => setSelectedPlayer(player)}
            className="w-full text-left"
          >
          <div className="flex items-start gap-3">
            {selectMode && (
              <input
                type="checkbox"
                checked={selected.has(player.id)}
                onChange={() => {
                  const next = new Set(selected);
                  if (next.has(player.id)) next.delete(player.id);
                  else next.add(player.id);
                  setSelected(next);
                }}
                className="mt-1 h-4 w-4 accent-vyellow"
              />
            )}
            <img
              src={player.photoURL ?? "/placeholder-player.svg"}
              alt={player.ign}
              className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover"
            />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-bold">{player.ign}</span>
                  <Badge variant={statusBadge[player.status]}>{player.status}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="blue">{player.role}</Badge>
                  {player.device && <Badge variant="cream">{player.device}</Badge>}
                  {team && <Badge variant="purple">{team.name}</Badge>}
                  {!team && <Badge variant="cream">Free Agent</Badge>}
                </div>
              </div>
          </div>
          </button>

          {!selectMode && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t-2 border-ink/10 pt-3">
              {player.status !== "approved" && (
                <Button variant="green" size="sm" onClick={() => updateStatus(player.id, "approved")} disabled={saving}>
                  <CheckCircle className="h-3 w-3" /> Approve
                </Button>
              )}
              {player.status !== "rejected" && (
                <Button variant="red" size="sm" onClick={() => updateStatus(player.id, "rejected")} disabled={saving}>
                  <XCircle className="h-3 w-3" /> Reject
                </Button>
              )}
              {player.status !== "suspended" && (
                <Button variant="cream" size="sm" onClick={() => updateStatus(player.id, "suspended")} disabled={saving}>
                  <AlertTriangle className="h-3 w-3" /> Suspend
                </Button>
              )}
              {player.status === "suspended" && (
                <Button variant="cream" size="sm" onClick={() => updateStatus(player.id, "pending")} disabled={saving}>
                  <AlertTriangle className="h-3 w-3" /> Unsuspend
                </Button>
              )}
              {player.teamId && (
                <Button variant="cream" size="sm" onClick={() => removeTeam(player.id)} disabled={saving}>
                  <UserMinus className="h-3 w-3" /> Remove Team
                </Button>
              )}
              <Button variant="blue" size="sm" onClick={() => setSelectedPlayer(player)}>
                <Eye className="h-3 w-3" /> Stats
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    {
      id: "pending",
      label: `Pending (${filtered.filter((p) => p.status === "pending").length})`,
      content: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.filter((p) => p.status === "pending").map(renderPlayerCard)}
        </div>
      ),
    },
    {
      id: "approved",
      label: `Approved (${filtered.filter((p) => p.status === "approved").length})`,
      content: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.filter((p) => p.status === "approved").map(renderPlayerCard)}
        </div>
      ),
    },
    {
      id: "rejected",
      label: `Rejected (${filtered.filter((p) => p.status === "rejected").length})`,
      content: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.filter((p) => p.status === "rejected").map(renderPlayerCard)}
        </div>
      ),
    },
    {
      id: "suspended",
      label: `Suspended (${filtered.filter((p) => !["pending", "approved", "rejected"].includes(p.status)).length})`,
      content: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.filter((p) => !["pending", "approved", "rejected"].includes(p.status)).map(renderPlayerCard)}
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Players"
        subtitle="Manage player registrations"
        action={
          <div className="flex gap-2">
            {selectMode && (
              <>
                <Button variant="green" size="sm" onClick={() => bulkAction("approved")} disabled={saving || selected.size === 0}>
                  Approve ({selected.size})
                </Button>
                <Button variant="red" size="sm" onClick={() => bulkAction("rejected")} disabled={saving || selected.size === 0}>
                  Reject ({selected.size})
                </Button>
              </>
            )}
            <Button
              variant={selectMode ? "red" : "cream"}
              size="sm"
              onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            >
              {selectMode ? "Cancel" : "Bulk"}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, IGN, UID..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="min-h-11 rounded-2xl border-4 border-ink bg-cream px-3 py-2 text-sm font-bold"
          >
            <option value="">All Roles</option>
            {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="min-h-11 rounded-2xl border-4 border-ink bg-cream px-3 py-2 text-sm font-bold"
          >
            <option value="">All Teams</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="font-bold text-vred">Failed to load players.</p>
      ) : (
        <Tabs tabs={tabs} />
      )}

      {selectedPlayer && (
        <PlayerDetailDialog
          player={selectedPlayer}
          teamName={teams.find((t) => t.id === selectedPlayer.teamId)?.name}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

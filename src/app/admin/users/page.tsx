"use client";

import { useState, useMemo } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useCollectionData } from "@/hooks/useFirestore";
import { usersCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { Search } from "lucide-react";
import type { User, WithId, UserRole } from "@/types";

const roleBadge: Record<string, "yellow" | "blue" | "green" | "purple" | "cream" | "red"> = {
  admin: "red",
  franchiseOwner: "purple",
  teamLeader: "blue",
  player: "green",
  guest: "cream",
};

const roleOptions: UserRole[] = ["admin", "franchiseOwner", "teamLeader", "player", "guest"];

export default function AdminUsersPage() {
  const { data: users, loading } = useCollectionData<User>(
    isFirebaseConfigured ? usersCol() : null,
    [],
  );
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users],
  );

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q),
    );
  }, [users, search]);

  async function updateRole(user: WithId<User>, role: UserRole) {
    if (user.role === role) return;
    // Safety: don't let an admin lock themselves (or the platform) out.
    if (user.id === me?.uid) {
      toast({ type: "error", message: "You can't change your own role." });
      return;
    }
    if (user.role === "admin" && role !== "admin" && adminCount <= 1) {
      toast({ type: "error", message: "Can't remove the last remaining admin." });
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.users, user.id), { role, updatedAt: serverTimestamp() });
      toast({ type: "success", message: `Role updated to ${role}.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to update role." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Users" subtitle="Manage user roles and access" />

      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or name..." className="pl-9" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={user.photoURL ?? "/placeholder-player.svg"}
                  alt={user.displayName ?? "User"}
                  className="h-10 w-10 shrink-0 rounded-xl border-2 border-ink object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{user.displayName ?? "Unnamed"}</p>
                  <p className="text-xs font-medium text-ink/60 truncate">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={roleBadge[user.role] ?? "cream"}>{user.role}</Badge>
                    {user.playerId && <Badge variant="blue">Player</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t-2 border-ink/10 pt-3">
                <Select
                  value={user.role}
                  onChange={(e) => updateRole(user, e.target.value as UserRole)}
                  className="min-h-9 text-xs"
                  disabled={saving || user.id === me?.uid}
                >
                  {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
                {user.id === me?.uid && (
                  <span className="text-xs font-medium text-ink/50">(you)</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

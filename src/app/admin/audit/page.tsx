"use client";

import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useCollectionData } from "@/hooks/useFirestore";
import { auditLogsCol, usersCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { Search } from "lucide-react";
import type { AuditLog, User, WithId } from "@/types";

export default function AdminAuditPage() {
  const { data: logs, loading } = useCollectionData<AuditLog>(
    isFirebaseConfigured ? auditLogsCol() : null,
    [],
  );
  const { data: users } = useCollectionData<User>(
    isFirebaseConfigured ? usersCol() : null,
    [],
  );
  const [search, setSearch] = useState("");

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      map.set(u.uid, u.displayName ?? u.email ?? u.uid);
    }
    return map;
  }, [users]);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        (l.action ?? "").toLowerCase().includes(q) ||
        (l.entityType ?? "").toLowerCase().includes(q) ||
        (l.entityId ?? "").toLowerCase().includes(q) ||
        (l.performedBy ?? "").toLowerCase().includes(q) ||
        (userMap.get(l.performedBy) ?? l.performedBy ?? "").toLowerCase().includes(q),
    );
  }, [logs, search, userMap]);

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Audit Logs" subtitle="Read-only record of sensitive changes" />

      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9" />
      </div>

      <div className="overflow-x-auto rounded-3xl border-4 border-ink shadow-brutal-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-4 border-ink bg-vyellow">
              {["Timestamp", "Action", "Entity", "Entity ID", "Performed By"].map((h) => (
                <th key={h} className="px-4 py-3 text-sm font-bold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-b-2 border-ink/10 last:border-0">
                <td className="px-4 py-3 text-sm font-medium">
                  {log.timestamp ? new Date(log.timestamp.toMillis()).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="cream">{log.action}</Badge>
                </td>
                <td className="px-4 py-3 text-sm font-medium">{log.entityType}</td>
                <td className="px-4 py-3 text-xs font-medium text-ink/60">{log.entityId.length > 20 ? `${log.entityId.slice(0, 20)}...` : log.entityId}</td>
                <td className="px-4 py-3 text-sm font-medium">{userMap.get(log.performedBy) ?? log.performedBy.slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useCollectionData } from "@/hooks/useFirestore";
import { disputesCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { auth } from "@/firebase/auth";
import type { Dispute, WithId, DisputeStatus } from "@/types";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";

const statusBadge: Record<string, "yellow" | "blue" | "green" | "red"> = {
  open: "yellow",
  underReview: "blue",
  resolved: "green",
  closed: "red",
};

export default function AdminDisputesPage() {
  const { data: disputes, loading, error } = useCollectionData<Dispute>(
    isFirebaseConfigured ? disputesCol() : null,
    [],
  );
  const { data: players } = usePlayers();
  const { data: matches } = useMatches();
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);

  async function updateStatus(dispute: WithId<Dispute>, status: DisputeStatus) {
    setSaving(true);
    try {
      const update: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
      if (status === "resolved" || status === "closed") {
        update.resolvedBy = auth.currentUser?.uid ?? "admin";
        update.resolvedAt = serverTimestamp();
      }
      await updateDoc(doc(db, COLLECTIONS.disputes, dispute.id), update);
    } finally {
      setSaving(false);
    }
  }

  async function handleRespond(dispute: WithId<Dispute>) {
    if (!responseText.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.disputes, dispute.id), {
        resolutionNotes: responseText,
        status: "underReview",
        updatedAt: serverTimestamp(),
      });
      setResponding(null);
      setResponseText("");
    } finally {
      setSaving(false);
    }
  }

  function renderCard(dispute: WithId<Dispute>) {
    const raiser = players.find((p) => p.uid === dispute.raisedBy);
    const match = matches.find((m) => m.id === dispute.matchId);
    return (
      <Card key={dispute.id}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Dispute #{dispute.id.slice(0, 8)}</span>
                <Badge variant={statusBadge[dispute.status]}>{dispute.status}</Badge>
              </div>
              <p className="mt-1 text-sm font-medium">Raised by: {raiser?.ign ?? "Unknown"}</p>
              <p className="mt-1 text-sm">Match: {match?.matchNumber ?? dispute.matchId.slice(0, 8)}</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border-2 border-ink/10 bg-cream p-3">
            <p className="text-sm font-medium">{dispute.reason}</p>
          </div>
          {dispute.resolutionNotes && (
            <div className="mt-2 rounded-2xl border-2 border-vgreen/30 bg-vgreen/10 p-3">
              <p className="text-xs font-bold uppercase text-vgreen">Resolution</p>
              <p className="text-sm">{dispute.resolutionNotes}</p>
            </div>
          )}
          {responding === dispute.id ? (
            <div className="mt-3 space-y-2">
              <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Write response..." />
              <div className="flex gap-2">
                <Button variant="yellow" size="sm" onClick={() => handleRespond(dispute)} disabled={saving}>Submit</Button>
                <Button variant="cream" size="sm" onClick={() => setResponding(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            (dispute.status === "open" || dispute.status === "underReview") && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button variant="blue" size="sm" onClick={() => setResponding(dispute.id)}>
                  <MessageSquare className="h-3 w-3" /> Respond
                </Button>
                <Button variant="green" size="sm" onClick={() => updateStatus(dispute, "resolved")} disabled={saving}>
                  <CheckCircle className="h-3 w-3" /> Resolve
                </Button>
                <Button variant="red" size="sm" onClick={() => updateStatus(dispute, "closed")} disabled={saving}>
                  <XCircle className="h-3 w-3" /> Close
                </Button>
              </div>
            )
          )}
        </CardContent>
      </Card>
    );
  }

  const filterStatus = (status: DisputeStatus) => disputes.filter((d) => d.status === status);

  const tabs = [
    { id: "open", label: `Open (${filterStatus("open").length})`, content: <div className="grid gap-3">{filterStatus("open").map(renderCard)}</div> },
    { id: "underReview", label: `Under Review (${filterStatus("underReview").length})`, content: <div className="grid gap-3">{filterStatus("underReview").map(renderCard)}</div> },
    { id: "resolved", label: `Resolved (${filterStatus("resolved").length})`, content: <div className="grid gap-3">{filterStatus("resolved").map(renderCard)}</div> },
    { id: "closed", label: `Closed (${filterStatus("closed").length})`, content: <div className="grid gap-3">{filterStatus("closed").map(renderCard)}</div> },
  ];

  return (
    <div>
      <AdminHeader title="Disputes" subtitle="Manage raised disputes" />
      {loading ? <Spinner /> : error ? <p className="font-bold text-vred">Failed to load disputes.</p> : <Tabs tabs={tabs} />}
    </div>
  );
}

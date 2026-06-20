"use client";

import { useMemo, useState } from "react";
import { collection, limit, orderBy, query, where } from "firebase/firestore";
import Image from "next/image";
import { CheckCircle, XCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { useCollectionData } from "@/hooks/useFirestore";
import { toast } from "@/hooks/useToast";
import { auth } from "@/firebase/auth";
import { cn } from "@/lib/utils";
import type { WithId } from "@/types";

interface FranchiseApplicationDoc {
  applicantUid: string;
  fullName: string;
  ign: string;
  phone: string;
  email: string;
  city: string;
  desiredTeamName: string;
  slogan: string;
  shortName: string;
  teamColor: string;
  motivation: string;
  previousExperience?: string;
  instagram?: string;
  logoUrl?: string;
  bannerIdea?: string;
  screenshotUrl: string;
  feeAmount: number;
  status: string;
  rejectedReason?: string;
  correctionNote?: string;
  teamId?: string;
}

const STATUS_TABS = ["pending", "approved", "rejected", "correction"] as const;
type Tab = typeof STATUS_TABS[number];

const statusBadge: Record<Tab, "yellow" | "green" | "red" | "blue"> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
  correction: "blue",
};

export default function FranchiseApplicationsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showReasonFor, setShowReasonFor] = useState<string | null>(null);

  const q = useMemo(
    () =>
      query(
        collection(db, COLLECTIONS.franchiseApplications),
        where("status", "==", tab),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
    [tab],
  );
  const { data: rawApps } = useCollectionData(q, [tab]);
  const applications = rawApps as WithId<FranchiseApplicationDoc>[];

  async function callApi(path: string, body: object) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Action failed.");
    }
    return res.json();
  }

  async function approve(applicationId: string) {
    if (!confirm("Approve this franchise application? This creates the team.")) return;
    setActionBusy(applicationId);
    try {
      await callApi("/api/admin/franchise/approve", { applicationId });
      toast({ type: "success", message: "Application approved — team created." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to approve." });
    } finally {
      setActionBusy(null);
    }
  }

  async function reject(applicationId: string, action: "reject" | "correction") {
    const reason = rejectReason[applicationId] ?? "";
    if (!reason.trim()) { toast({ type: "error", message: "Please enter a reason." }); return; }
    setActionBusy(applicationId);
    try {
      await callApi("/api/admin/franchise/reject", { applicationId, reason, action });
      setShowReasonFor(null);
      toast({
        type: "success",
        message: action === "correction" ? "Sent back for correction." : "Application rejected.",
      });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed." });
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div>
      <AdminHeader title="Franchise Applications" subtitle="Review, approve, or reject franchise applications" />

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={cn(
              "min-h-9 rounded-xl border-2 border-ink px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
              tab === s ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow",
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-ink/50 font-medium">
            No {tab} applications.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              busy={actionBusy === app.id}
              showReason={showReasonFor === app.id}
              reason={rejectReason[app.id] ?? ""}
              onReasonChange={(v) => setRejectReason((r) => ({ ...r, [app.id]: v }))}
              onToggleReason={() => setShowReasonFor(showReasonFor === app.id ? null : app.id)}
              onApprove={() => approve(app.id)}
              onReject={() => reject(app.id, "reject")}
              onCorrection={() => reject(app.id, "correction")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  app, busy, showReason, reason, onReasonChange,
  onToggleReason, onApprove, onReject, onCorrection,
}: {
  app: WithId<FranchiseApplicationDoc>;
  busy: boolean;
  showReason: boolean;
  reason: string;
  onReasonChange: (v: string) => void;
  onToggleReason: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCorrection: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">
            <span
              className="mr-2 inline-block h-3 w-3 rounded-full border border-ink"
              style={{ background: app.teamColor }}
            />
            {app.desiredTeamName}
            <span className="ml-2 text-sm font-bold text-ink/50">{app.shortName}</span>
          </CardTitle>
          <Badge variant={statusBadge[app.status as Tab] ?? "yellow"}>{app.status}</Badge>
        </div>
        <p className="text-sm font-medium text-ink/60 italic">&ldquo;{app.slogan}&rdquo;</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Info label="Owner" value={app.fullName} />
          <Info label="IGN" value={app.ign} />
          <Info label="Phone" value={app.phone} />
          <Info label="Email" value={app.email} />
          <Info label="City" value={app.city} />
          {app.instagram && <Info label="Instagram" value={app.instagram} />}
        </div>

        <div className="rounded-xl border-2 border-ink/10 bg-cream p-3">
          <p className="text-xs font-bold uppercase text-ink/50 mb-1">Motivation</p>
          <p className="text-sm font-medium line-clamp-3">{app.motivation}</p>
        </div>

        {app.previousExperience && (
          <div className="rounded-xl border-2 border-ink/10 bg-cream p-3">
            <p className="text-xs font-bold uppercase text-ink/50 mb-1">Previous Experience</p>
            <p className="text-sm font-medium line-clamp-2">{app.previousExperience}</p>
          </div>
        )}

        {app.logoUrl && (
          <div className="flex items-center gap-3">
            <Image src={app.logoUrl} alt="Logo" width={56} height={56} className="rounded-xl border-2 border-ink object-cover" />
            <span className="text-sm font-medium text-ink/60">Team Logo</span>
          </div>
        )}

        {app.screenshotUrl && (
          <div>
            <p className="text-xs font-bold uppercase text-ink/50 mb-1">Payment Screenshot</p>
            <a href={app.screenshotUrl} target="_blank" rel="noopener noreferrer">
              <Image
                src={app.screenshotUrl}
                alt="Payment screenshot"
                width={300}
                height={200}
                className="rounded-xl border-2 border-ink object-cover w-full max-h-48"
              />
            </a>
          </div>
        )}

        {app.status === "rejected" && app.rejectedReason && (
          <p className="text-sm font-bold text-vred">Rejected: {app.rejectedReason}</p>
        )}
        {app.status === "correction" && app.correctionNote && (
          <p className="text-sm font-bold text-ink">Correction needed: {app.correctionNote}</p>
        )}

        {(app.status === "pending" || app.status === "correction") && (
          <div className="space-y-2 pt-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="green" size="sm" disabled={busy} onClick={onApprove}>
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
              <Button variant="cream" size="sm" disabled={busy} onClick={onToggleReason}>
                <MessageSquare className="h-4 w-4" /> Ask Correction
              </Button>
              <Button variant="red" size="sm" disabled={busy} onClick={onToggleReason}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
            {showReason && (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded-2xl border-4 border-ink bg-cream px-3 py-2 text-sm font-medium focus:outline-none"
                  rows={2}
                  placeholder="Reason / correction instructions…"
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="yellow" size="sm" disabled={busy} onClick={onCorrection}>
                    <AlertTriangle className="h-4 w-4" /> Send Correction
                  </Button>
                  <Button variant="red" size="sm" disabled={busy} onClick={onReject}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-cream px-2 py-1.5">
      <p className="text-xs font-bold uppercase text-ink/40">{label}</p>
      <p className="text-sm font-bold truncate">{value}</p>
    </div>
  );
}

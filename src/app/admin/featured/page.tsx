"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useHomeContent } from "@/hooks/useHomeContent";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";
import { Eye, Save, Users, User, Swords } from "lucide-react";

export default function AdminFeaturedPage() {
  const { data: home, loading } = useHomeContent();
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();
  const { data: players } = usePlayers();
  const { user: authUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const [heroImage, setHeroImage] = useState("");
  const [featuredMatchId, setFeaturedMatchId] = useState<string | null>(null);
  const [featuredTeamIds, setFeaturedTeamIds] = useState<string[]>([]);
  const [featuredPlayerIds, setFeaturedPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    if (home) {
      setHeroImage(home.heroImage ?? "");
      setFeaturedMatchId(home.featuredMatchId ?? null);
      setFeaturedTeamIds(home.featuredTeamIds ?? []);
      setFeaturedPlayerIds(home.featuredPlayerIds ?? []);
    }
  }, [home]);

  async function handleSave() {
    setSaving(true);
    try {
      // Merge only the fields this page owns — never spread the read-hook object
      // (it carries an injected `id`) or overwrite hero text from Home page.
      await setDoc(
        doc(db, COLLECTIONS.homeContent, "site"),
        {
          heroImage,
          featuredMatchId,
          featuredTeamIds,
          featuredPlayerIds,
          updatedAt: serverTimestamp(),
          updatedBy: authUser?.uid ?? null,
        },
        { merge: true },
      );
      toast({ type: "success", message: "Featured content saved" });
    } catch {
      toast({ type: "error", message: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  function toggleTeam(id: string) {
    setFeaturedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function togglePlayer(id: string) {
    setFeaturedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  const featuredMatch = matches.find((m) => m.id === featuredMatchId);
  const featuredTeams = teams.filter((t) => featuredTeamIds.includes(t.id));
  const featuredPlayers = players.filter((p) => featuredPlayerIds.includes(p.id));

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader
        title="Featured Content"
        subtitle="Select what appears in the featured section on the homepage"
        action={
          <Button variant="yellow" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5" /> Hero Banner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Hero Background Image</Label>
              <ImageUploader value={heroImage} onChange={setHeroImage} folder="banners" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5" /> Featured Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={featuredMatchId ?? ""}
                onChange={(e) => setFeaturedMatchId(e.target.value || null)}
                className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-2 font-bold uppercase shadow-brutal-xs outline-none"
              >
                <option value="">None</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    Match #{m.matchNumber} — {m.map ?? "TBD"}
                  </option>
                ))}
              </select>
              {featuredMatch && (
                <Link
                  href={`/matches/${featuredMatchId}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-vblue underline"
                >
                  <Eye className="h-3 w-3" /> View match
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Featured Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-2xl border-4 border-ink bg-cream p-2">
                {teams.length === 0 && (
                  <p className="p-2 text-sm font-medium text-ink/40">No teams yet</p>
                )}
                {teams.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-vyellow/40"
                  >
                    <input
                      type="checkbox"
                      checked={featuredTeamIds.includes(t.id)}
                      onChange={() => toggleTeam(t.id)}
                      className="h-5 w-5 accent-vyellow"
                    />
                    <span className="text-sm font-bold">{t.name}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs font-medium text-ink/40">
                {featuredTeamIds.length} selected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Featured Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-2xl border-4 border-ink bg-cream p-2">
                {players.length === 0 && (
                  <p className="p-2 text-sm font-medium text-ink/40">No players yet</p>
                )}
                {players.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-vyellow/40"
                  >
                    <input
                      type="checkbox"
                      checked={featuredPlayerIds.includes(p.id)}
                      onChange={() => togglePlayer(p.id)}
                      className="h-5 w-5 accent-vyellow"
                    />
                    <div className="flex items-center gap-2">
                      {p.photoURL && (
                        <img
                          src={p.photoURL}
                          alt=""
                          className="h-6 w-6 rounded-full border-2 border-ink object-cover"
                        />
                      )}
                      <span className="text-sm font-bold">{p.ign}</span>
                      <span className="text-xs font-medium text-ink/40">{p.role}</span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs font-medium text-ink/40">
                {featuredPlayerIds.length} selected
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {heroImage && (
                <div className="overflow-hidden rounded-2xl border-4 border-ink">
                  <img
                    src={heroImage}
                    alt="Hero banner"
                    className="h-40 w-full object-cover"
                  />
                </div>
              )}

              <div className="rounded-2xl border-4 border-ink bg-vyellow p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/60">
                  Featured Match
                </p>
                <p className="text-lg font-bold">
                  {featuredMatch
                    ? `Match #${featuredMatch.matchNumber}`
                    : "No match selected"}
                </p>
              </div>

              <div className="rounded-2xl border-4 border-ink bg-vblue p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/60">
                  Featured Teams ({featuredTeams.length})
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {featuredTeams.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-xl border-2 border-ink bg-cream px-2 py-0.5 text-xs font-bold"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border-4 border-ink bg-vgreen p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/60">
                  Featured Players ({featuredPlayers.length})
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {featuredPlayers.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-xl border-2 border-ink bg-cream px-2 py-0.5 text-xs font-bold"
                    >
                      {p.ign}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Palette } from "lucide-react";
import { useFranchiseTeam } from "@/components/franchise/FranchiseShell";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { toast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

export default function FranchiseBrandPage() {
  const team = useFranchiseTeam();
  const { role } = useAuth();
  const canEdit = role === "franchiseOwner" || role === "admin";

  const [name, setName] = useState(team.name);
  const [slogan, setSlogan] = useState(team.slogan ?? "");
  const [shortName, setShortName] = useState(team.shortName ?? "");
  const [description, setDescription] = useState(team.description ?? "");
  const [primaryColor, setPrimaryColor] = useState(team.primaryColor ?? "#6366f1");
  const [secondaryColor, setSecondaryColor] = useState(team.secondaryColor ?? "#f59e0b");
  const [accentColor, setAccentColor] = useState(team.accentColor ?? "#ec4899");
  const [logoUrl, setLogoUrl] = useState(team.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(team.bannerUrl ?? "");
  const [instagram, setInstagram] = useState(team.socialLinks?.instagram ?? "");
  const [youtube, setYoutube] = useState(team.socialLinks?.youtube ?? "");
  const [discord, setDiscord] = useState(team.socialLinks?.discord ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.teams, team.id), {
        name: name.trim() || team.name,
        slogan: slogan.trim() || null,
        shortName: shortName.trim() || null,
        description: description.trim() || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        accentColor: accentColor || null,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
        socialLinks: {
          instagram: instagram.trim() || null,
          youtube: youtube.trim() || null,
          discord: discord.trim() || null,
        },
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: "Brand updated!" });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Brand Management</h1>
      </div>

      {/* Identity */}
      <Card>
        <CardHeader><CardTitle>Team Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Team Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Short Name</Label>
              <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="VWR" maxLength={5} disabled={!canEdit} />
            </div>
            <div>
              <Label>Slogan</Label>
              <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Born To Dominate" disabled={!canEdit} />
            </div>
            <div className="col-span-2">
              <Label>About the Franchise</Label>
              <textarea
                className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-ink/40 disabled:opacity-50"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the world about your franchise…"
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader><CardTitle>Team Colors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Primary", value: primaryColor, set: setPrimaryColor },
              { label: "Secondary", value: secondaryColor, set: setSecondaryColor },
              { label: "Accent", value: accentColor, set: setAccentColor },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    disabled={!canEdit}
                    className="h-11 w-11 cursor-pointer rounded-xl border-2 border-ink disabled:opacity-50"
                  />
                  <Input value={value} onChange={(e) => set(e.target.value)} disabled={!canEdit} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <div className="h-10 flex-1 rounded-xl border-2 border-ink" style={{ background: primaryColor }} />
            <div className="h-10 flex-1 rounded-xl border-2 border-ink" style={{ background: secondaryColor }} />
            <div className="h-10 flex-1 rounded-xl border-2 border-ink" style={{ background: accentColor }} />
          </div>
        </CardContent>
      </Card>

      {/* Logo & Banner */}
      <Card>
        <CardHeader><CardTitle>Logo & Banner</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Team Logo</Label>
            {canEdit ? (
              <ImageUploader value={logoUrl} onChange={setLogoUrl} folder="teams" />
            ) : (
              logoUrl && <img src={logoUrl} alt="Logo" className="h-20 rounded-2xl border-4 border-ink object-cover" />
            )}
          </div>
          <div>
            <Label>Team Banner (wide cover image)</Label>
            {canEdit ? (
              <ImageUploader value={bannerUrl} onChange={setBannerUrl} folder="banners" />
            ) : (
              bannerUrl && <img src={bannerUrl} alt="Banner" className="w-full max-h-40 rounded-2xl border-4 border-ink object-cover" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Instagram", value: instagram, set: setInstagram, placeholder: "@teamwarriors" },
            { label: "YouTube", value: youtube, set: setYoutube, placeholder: "youtube.com/@team" },
            { label: "Discord", value: discord, set: setDiscord, placeholder: "discord.gg/invite" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <Label>{label}</Label>
              <Input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} disabled={!canEdit} />
            </div>
          ))}
        </CardContent>
      </Card>

      {canEdit && (
        <Button variant="yellow" size="lg" className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Brand Changes"}
        </Button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ColorPicker } from "@/components/admin/ColorPicker";
import { SocialLinksForm } from "@/components/admin/SocialLinksForm";
import { SeasonSettingsForm } from "@/components/admin/SeasonSettingsForm";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

const defaultColors = {
  primary: "#FFD93D",
  secondary: "#FF6B6B",
  accent: "#C4B5FD",
  background: "#FFFDF5",
  text: "#000000",
};

export default function AdminSettingsPage() {
  const { data: settings, loading } = useSettings();
  const { user: authUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const [websiteLogo, setWebsiteLogo] = useState("");
  const [favicon, setFavicon] = useState("");
  const [themeColors, setThemeColors] = useState(defaultColors);
  const [seasonName, setSeasonName] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [socialLinks, setSocialLinks] = useState<{
    instagram: string;
    whatsapp: string;
    youtube: string;
    discord?: string;
    website?: string;
  }>({
    instagram: "",
    whatsapp: "",
    youtube: "",
    discord: "",
    website: "",
  });

  useEffect(() => {
    if (settings) {
      setWebsiteLogo(settings.websiteLogo ?? "");
      setFavicon(settings.favicon ?? "");
      setThemeColors(settings.themeColors ?? defaultColors);
      setSeasonName(settings.seasonName ?? "");
      setPrizePool(settings.prizePool ?? "");
      setStartDate(settings.startDate ?? "");
      setEndDate(settings.endDate ?? "");
      setSocialLinks({
        instagram: settings.socialLinks?.instagram ?? "",
        whatsapp: settings.socialLinks?.whatsapp ?? "",
        youtube: settings.socialLinks?.youtube ?? "",
        discord: settings.socialLinks?.discord ?? "",
        website: settings.socialLinks?.website ?? "",
      });
    }
  }, [settings]);

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.settings, "site"),
        {
          websiteLogo,
          favicon,
          themeColors,
          seasonName,
          prizePool,
          startDate,
          endDate,
          socialLinks,
          updatedAt: serverTimestamp(),
          updatedBy: authUser?.uid ?? null,
        },
        { merge: true },
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Settings" subtitle="Website configuration" />

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Website Logo</Label>
              <ImageUploader value={websiteLogo} onChange={setWebsiteLogo} folder="banners" />
            </div>
            <div>
              <Label>Favicon</Label>
              <ImageUploader value={favicon} onChange={setFavicon} folder="banners" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Colors</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ColorPicker value={themeColors.primary} onChange={(c) => setThemeColors((p) => ({ ...p, primary: c }))} label="Primary" />
            <ColorPicker value={themeColors.secondary} onChange={(c) => setThemeColors((p) => ({ ...p, secondary: c }))} label="Secondary" />
            <ColorPicker value={themeColors.accent} onChange={(c) => setThemeColors((p) => ({ ...p, accent: c }))} label="Accent" />
            <ColorPicker value={themeColors.background} onChange={(c) => setThemeColors((p) => ({ ...p, background: c }))} label="Background" />
            <ColorPicker value={themeColors.text} onChange={(c) => setThemeColors((p) => ({ ...p, text: c }))} label="Text" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Season</CardTitle>
          </CardHeader>
          <CardContent>
            <SeasonSettingsForm
              value={{ seasonName, prizePool, startDate, endDate }}
              onChange={(v) => {
                setSeasonName(v.seasonName);
                setPrizePool(v.prizePool);
                setStartDate(v.startDate);
                setEndDate(v.endDate);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent>
            <SocialLinksForm value={socialLinks} onChange={setSocialLinks} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="yellow" size="lg" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

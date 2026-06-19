"use client";

import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Label, Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";
import { Save, Camera, Tv, MessageCircle, Headphones, Globe } from "lucide-react";

interface SocialLinks {
  instagram: string;
  whatsapp: string;
  youtube: string;
  discord?: string;
  website?: string;
}

export default function AdminSocialLinksPage() {
  const { data: settings, loading } = useSettings();
  const { user: authUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: "",
    whatsapp: "",
    youtube: "",
    discord: "",
    website: "",
  });

  useEffect(() => {
    if (settings?.socialLinks) {
      setSocialLinks({
        instagram: settings.socialLinks.instagram ?? "",
        whatsapp: settings.socialLinks.whatsapp ?? "",
        youtube: settings.socialLinks.youtube ?? "",
        discord: settings.socialLinks.discord ?? "",
        website: settings.socialLinks.website ?? "",
      });
    }
  }, [settings]);

  async function handleSave() {
    setSaving(true);
    try {
      // merge:true keeps the rest of the settings doc; never spread the
      // read-hook object (it carries an injected `id`).
      await setDoc(
        doc(db, COLLECTIONS.settings, "site"),
        {
          socialLinks,
          updatedAt: serverTimestamp(),
          updatedBy: authUser?.uid ?? null,
        },
        { merge: true },
      );
      toast({ type: "success", message: "Social links saved" });
    } catch {
      toast({ type: "error", message: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  const platforms = [
    { key: "instagram" as const, icon: Camera, label: "Instagram", color: "bg-gradient-to-br from-pink-500 to-purple-600", placeholder: "https://instagram.com/vfft" },
    { key: "whatsapp" as const, icon: MessageCircle, label: "WhatsApp", color: "bg-green-500", placeholder: "https://wa.me/91XXXXXXXXXX" },
    { key: "youtube" as const, icon: Tv, label: "YouTube", color: "bg-red-600", placeholder: "https://youtube.com/@vfft" },
    { key: "discord" as const, icon: Headphones, label: "Discord", color: "bg-indigo-600", placeholder: "https://discord.gg/vfft" },
    { key: "website" as const, icon: Globe, label: "Website", color: "bg-ink", placeholder: "https://vfft.com" },
  ];

  return (
    <div>
      <AdminHeader
        title="Social Links"
        subtitle="Manage your social media presence"
        action={
          <Button variant="yellow" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {platforms.map(({ key, icon: Icon, label, color, placeholder }) => (
            <Card key={key}>
              <CardContent className="flex items-center gap-4 pt-5">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-4 border-ink ${color}`}
                >
                  <Icon className="h-5 w-5 text-cream" />
                </div>
                <div className="flex-1">
                  <Label>{label}</Label>
                  <Input
                    value={socialLinks[key] ?? ""}
                    onChange={(e) =>
                      setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {platforms.map(({ key, icon: Icon, label, color }) => {
                const url = socialLinks[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 border-ink ${color}`}
                    >
                      <Icon className="h-4 w-4 text-cream" />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
                      <p className="truncate text-sm font-medium text-ink/60">
                        {url || "Not set"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="cream"
                className="w-full"
                onClick={() => {
                  setSocialLinks({
                    instagram: "",
                    whatsapp: "",
                    youtube: "",
                    discord: "",
                    website: "",
                  });
                }}
              >
                Clear All
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useHomeContent } from "@/hooks/useHomeContent";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  heroTitle: z.string().min(1, "Required"),
  heroSubtitle: z.string().min(1, "Required"),
  heroImage: z.string().min(1, "Required"),
  featuredMatchId: z.string().nullable(),
  featuredPlayerIds: z.array(z.string()),
  featuredTeamIds: z.array(z.string()),
  announcements: z.array(z.string()),
  sponsorsLogo: z.array(z.string()),
  marqueeText: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function AdminHomePage() {
  const { data: home, loading } = useHomeContent();
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();
  const { data: players } = usePlayers();
  const { user: authUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        heroTitle: "",
        heroSubtitle: "",
        heroImage: "",
        featuredMatchId: null,
        featuredPlayerIds: [],
        featuredTeamIds: [],
        announcements: [""],
        sponsorsLogo: [],
        marqueeText: "",
      },
    });

  useEffect(() => {
    if (home) {
      reset({
        heroTitle: home.heroTitle ?? "",
        heroSubtitle: home.heroSubtitle ?? "",
        heroImage: home.heroImage ?? "",
        featuredMatchId: home.featuredMatchId ?? null,
        featuredPlayerIds: home.featuredPlayerIds ?? [],
        featuredTeamIds: home.featuredTeamIds ?? [],
        announcements: home.announcements?.length ? home.announcements : [""],
        sponsorsLogo: home.sponsorsLogo ?? [],
        marqueeText: home.marqueeText ?? "",
      });
    }
  }, [home, reset]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.homeContent, "site"),
        {
          ...data,
          announcements: data.announcements.filter(Boolean),
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
      <AdminHeader title="Home Content" subtitle="Manage hero section and featured content" />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Hero Title</Label>
            <Input {...register("heroTitle")} />
            <FieldError>{errors.heroTitle?.message}</FieldError>
          </div>
          <div>
            <Label>Hero Subtitle</Label>
            <Input {...register("heroSubtitle")} />
            <FieldError>{errors.heroSubtitle?.message}</FieldError>
          </div>
        </div>

        <div>
          <Label>Hero Background Image</Label>
          <ImageUploader
            value={watch("heroImage")}
            onChange={(url) => setValue("heroImage", url)}
            folder="banners"
          />
          <FieldError>{errors.heroImage?.message}</FieldError>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Featured Match</Label>
            <select
              {...register("featuredMatchId")}
              className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-2 font-medium shadow-brutal-xs outline-none"
            >
              <option value="">None</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  Match #{m.matchNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Featured Teams</Label>
            <div className="max-h-32 overflow-y-auto rounded-2xl border-4 border-ink bg-cream p-2">
              {teams.map((t) => (
                <label key={t.id} className="flex items-center gap-2 px-2 py-1 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={watch("featuredTeamIds").includes(t.id)}
                    onChange={(e) => {
                      const current = watch("featuredTeamIds");
                      setValue(
                        "featuredTeamIds",
                        e.target.checked
                          ? [...current, t.id]
                          : current.filter((id) => id !== t.id),
                      );
                    }}
                    className="h-4 w-4 accent-vyellow"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Featured Players</Label>
            <div className="max-h-32 overflow-y-auto rounded-2xl border-4 border-ink bg-cream p-2">
              {players.map((p) => (
                <label key={p.id} className="flex items-center gap-2 px-2 py-1 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={watch("featuredPlayerIds").includes(p.id)}
                    onChange={(e) => {
                      const current = watch("featuredPlayerIds");
                      setValue(
                        "featuredPlayerIds",
                        e.target.checked
                          ? [...current, p.id]
                          : current.filter((id) => id !== p.id),
                      );
                    }}
                    className="h-4 w-4 accent-vyellow"
                  />
                  {p.ign}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>Marquee Text</Label>
          <Textarea {...register("marqueeText")} placeholder="Scrolling marquee text" />
        </div>

        <div>
          <Label>Announcements</Label>
          {watch("announcements").map((_, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <Input {...register(`announcements.${i}`)} placeholder="Announcement text" />
              <Button
                variant="cream"
                size="sm"
                type="button"
                onClick={() => {
                  const current = watch("announcements");
                  setValue(
                    "announcements",
                    current.filter((_, idx) => idx !== i),
                  );
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="cream"
            size="sm"
            type="button"
            onClick={() => setValue("announcements", [...watch("announcements"), ""])}
          >
            Add Announcement
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="yellow" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { FullScreenLoader } from "@/components/ui/spinner";
import { SelfieCapture } from "@/components/player/SelfieCapture";
import { PLAYER_ROLE_LABELS, PLAYER_ROLES } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useAuth } from "@/hooks/useAuth";
import { useMyPlayer } from "@/hooks/usePlayers";
import {
  isCloudinaryConfigured,
  uploadImage,
} from "@/services/cloudinaryService";
import { createPlayerRegistration } from "@/services/playerService";

const schema = z.object({
  realName: z.string().trim().min(2, "Enter your real name").max(60),
  ign: z.string().trim().min(2, "Enter your in-game name").max(30),
  freeFireUid: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, "Enter a valid Free Fire UID (digits only)"),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, "Enter a valid WhatsApp number"),
  role: z.enum(["rusher", "sniper", "support", "igl"]),
  device: z.string().trim().min(2, "Enter your device").max(40),
});

type FormValues = z.infer<typeof schema>;

export function RegistrationForm() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { seasonId, loading: seasonLoading } = useActiveSeason();
  const { player, loading: playerLoading } = useMyPlayer();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "rusher" },
  });

  if (seasonLoading || playerLoading) return <FullScreenLoader />;

  // Already registered → show status instead of the form.
  if (player) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-3xl border-4 border-ink bg-cream p-7 shadow-brutal-md">
          <CheckCircle2 className="mx-auto h-12 w-12 text-vgreen" />
          <h1 className="mt-3 text-2xl">You&apos;re registered</h1>
          <p className="mt-2 font-medium text-ink/60">
            Your profile <strong>{player.ign}</strong> is{" "}
            <Badge variant={player.status === "approved" ? "green" : "yellow"}>
              {player.status}
            </Badge>
          </p>
          <Link
            href={ROUTES.dashboard}
            className="mt-5 inline-block font-bold underline"
          >
            Go to your dashboard
          </Link>
        </div>
      </div>
    );
  }

  function onSelfie(file: File, previewUrl: string) {
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setFormError(null);
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    if (!firebaseUser) {
      setFormError("You must be signed in to register.");
      return;
    }
    if (!seasonId) {
      setFormError("Registration opens when a season is active.");
      return;
    }
    if (!photoFile) {
      setFormError("A live selfie is required to register.");
      return;
    }
    if (!isCloudinaryConfigured) {
      setFormError("Photo upload isn't configured yet — contact the admin.");
      return;
    }
    try {
      const photoURL = await uploadImage(photoFile, "players");
      await createPlayerRegistration({
        uid: firebaseUser.uid,
        seasonId,
        photoURL,
        ...values,
      });
      router.replace(ROUTES.dashboard);
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "Registration failed. Please try again.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader
        title="Player Registration"
        subtitle="Join the auction pool. An admin reviews every registration."
      />

      {!seasonId && (
        <div className="mb-5 rounded-2xl border-4 border-ink bg-vyellow p-3 text-sm font-bold">
          No season is active yet — you can fill this in, but submission opens
          once an admin starts a season.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Selfie — live camera only (no gallery uploads). */}
        <div>
          <Label>Live Selfie (required)</Label>
          <p className="mb-2 text-xs font-medium text-ink/50">
            Take a clear selfie with your front camera. Gallery uploads aren&apos;t
            allowed — this verifies it&apos;s really you.
          </p>
          <SelfieCapture value={photoPreview} onCapture={onSelfie} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="ign">In-Game Name (IGN)</Label>
            <Input id="ign" placeholder="e.g. NightFury" {...register("ign")} />
            <FieldError>{errors.ign?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="realName">Real Name</Label>
            <Input id="realName" placeholder="Your full name" {...register("realName")} />
            <FieldError>{errors.realName?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="freeFireUid">Free Fire UID</Label>
            <Input
              id="freeFireUid"
              inputMode="numeric"
              placeholder="123456789"
              {...register("freeFireUid")}
            />
            <FieldError>{errors.freeFireUid?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              inputMode="tel"
              placeholder="+91XXXXXXXXXX"
              {...register("whatsappNumber")}
            />
            <FieldError>{errors.whatsappNumber?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" {...register("role")}>
              {PLAYER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {PLAYER_ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <FieldError>{errors.role?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="device">Device</Label>
            <Input id="device" placeholder="e.g. iPhone 13, Poco X5" {...register("device")} />
            <FieldError>{errors.device?.message}</FieldError>
          </div>
        </div>

        {formError && (
          <p className="text-sm font-bold text-vred">{formError}</p>
        )}

        <Button
          type="submit"
          variant="red"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !seasonId || !photoFile}
        >
          {isSubmitting
            ? "Submitting…"
            : !photoFile
              ? "Take a selfie to continue"
              : "Submit Registration"}
        </Button>
      </form>
    </div>
  );
}

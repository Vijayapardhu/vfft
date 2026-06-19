"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { DocumentReference } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ImagePlus, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { auth } from "@/firebase/auth";
import { COLLECTIONS, playerDoc } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { FullScreenLoader } from "@/components/ui/spinner";
import { MasteryEditor } from "@/components/player/MasteryEditor";
import { PLAYER_ROLE_LABELS, PLAYER_ROLES } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useMyPlayer } from "@/hooks/usePlayers";
import { useDocumentData } from "@/hooks/useFirestore";
import { toast } from "@/hooks/useToast";
import { isCloudinaryConfigured, uploadImage } from "@/services/cloudinaryService";
import type { PlayerContact, PlayerRole } from "@/types";

const schema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(60),
  ign: z.string().trim().min(2, "Enter your in-game name").max(30).optional().or(z.literal("")),
  realName: z.string().trim().min(2, "Enter your real name").max(60).optional().or(z.literal("")),
  freeFireUid: z.string().trim().regex(/^\d{6,15}$/, "Enter a valid Free Fire UID").optional().or(z.literal("")),
  whatsappNumber: z.string().trim().regex(/^\+?\d{10,15}$/, "Enter a valid WhatsApp number").optional().or(z.literal("")),
  role: z.enum(["rusher", "sniper", "support", "igl"]).optional(),
  device: z.string().trim().min(2, "Enter your device").max(40).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { firebaseUser, user } = useAuth();
  const { player, loading: playerLoading } = useMyPlayer();

  const contactRef = useMemo(
    () => (player ? doc(db, COLLECTIONS.players, player.id, "private", "contact") as DocumentReference<PlayerContact> : null),
    [player],
  );
  const { data: contact, loading: contactLoading } = useDocumentData<PlayerContact>(contactRef, [player?.id]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Mastery state
  const [weapons, setWeapons] = useState<Record<string, number>>(player?.weapons ?? {});
  const [rolePercentages, setRolePercentages] = useState<Partial<Record<PlayerRole, number>>>(player?.rolePercentages ?? {});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      displayName: user?.displayName ?? firebaseUser?.displayName ?? "",
      ign: player?.ign ?? "",
      realName: contact?.realName ?? "",
      freeFireUid: contact?.freeFireUid ?? "",
      whatsappNumber: contact?.whatsappNumber ?? "",
      role: (player?.role ?? "rusher") as "rusher" | "sniper" | "support" | "igl",
      device: player?.device ?? "",
    },
  });

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    if (!firebaseUser) { setFormError("You must be signed in."); return; }

    try {
      let photoURL: string | null = null;
      if (photoFile && isCloudinaryConfigured) {
        photoURL = await uploadImage(photoFile, "players");
      }

      const updates: Record<string, unknown> = {
        displayName: values.displayName,
        updatedAt: serverTimestamp(),
      };
      if (photoURL) updates.photoURL = photoURL;

      await updateDoc(doc(db, COLLECTIONS.users, firebaseUser.uid), updates);
      await updateProfile(auth.currentUser!, { displayName: values.displayName, photoURL: photoURL ?? undefined });

      if (player) {
        const playerUpdates: Record<string, unknown> = {
          ign: values.ign,
          role: values.role,
          device: values.device,
          weapons,
          rolePercentages,
          updatedAt: serverTimestamp(),
        };
        if (photoURL) playerUpdates.photoURL = photoURL;
        await updateDoc(playerDoc(player.id), playerUpdates);

        if (contactRef) {
          await updateDoc(contactRef, {
            realName: values.realName,
            freeFireUid: values.freeFireUid,
            whatsappNumber: values.whatsappNumber,
          });
        }
      }

      toast({ type: "success", message: "Profile updated!" });
      router.push(ROUTES.dashboard);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Update failed. Please try again.");
    }
  }

  if (playerLoading || contactLoading) return <FullScreenLoader />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader
        title="Edit Profile"
        subtitle="Update your account and player details"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo */}
        <div>
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/40">
              {photoPreview ? (
                <Image src={photoPreview} alt="" fill unoptimized className="object-cover" />
              ) : (player?.photoURL ?? user?.photoURL ?? firebaseUser?.photoURL) ? (
                <Image
                  src={player?.photoURL ?? user?.photoURL ?? firebaseUser?.photoURL ?? ""}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <ImagePlus className="h-7 w-7 text-ink/40" />
              )}
            </div>
            <label className="cursor-pointer rounded-2xl border-4 border-ink bg-cream px-4 py-2 text-sm font-bold uppercase shadow-brutal-xs hover:bg-vyellow">
              Choose image
              <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
            </label>
          </div>
        </div>

        {/* Account fields */}
        <div>
          <h2 className="mb-3 text-xl font-bold uppercase tracking-tight">Account</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" placeholder="Your name" {...register("displayName")} />
              <FieldError>{errors.displayName?.message}</FieldError>
            </div>
          </div>
        </div>

        {/* Player fields */}
        {player && (
          <div>
            <h2 className="mb-3 text-xl font-bold uppercase tracking-tight">Player Profile</h2>
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
                <Input id="freeFireUid" inputMode="numeric" placeholder="123456789" {...register("freeFireUid")} />
                <FieldError>{errors.freeFireUid?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input id="whatsappNumber" inputMode="tel" placeholder="+91XXXXXXXXXX" {...register("whatsappNumber")} />
                <FieldError>{errors.whatsappNumber?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select id="role" {...register("role")}>
                  {PLAYER_ROLES.map((r) => (
                    <option key={r} value={r}>{PLAYER_ROLE_LABELS[r]}</option>
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

            {/* Game Mastery editor */}
            <div className="mt-6">
              <MasteryEditor
                weapons={weapons}
                rolePercentages={rolePercentages}
                onWeaponsChange={setWeapons}
                onRolePercentagesChange={setRolePercentages}
              />
            </div>
          </div>
        )}

        {formError && (
          <p className="text-sm font-bold text-vred">{formError}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="yellow" size="lg" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
          <Button type="button" variant="cream" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

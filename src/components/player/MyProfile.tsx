"use client";

import { Settings, UserPlus } from "lucide-react";
import Link from "next/link";
import { PlayerProfile } from "@/components/player/PlayerProfile";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { useMyPlayer } from "@/hooks/usePlayers";
import { cn } from "@/lib/utils";

export function MyProfile() {
  const { player, loading } = useMyPlayer();

  if (loading) return <FullScreenLoader />;

  if (!player) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No player profile"
        message="Register as a player to create your profile and join the auction pool."
      >
        <Link
          href={ROUTES.register}
          className={cn(buttonVariants({ variant: "red", size: "lg" }))}
        >
          Register Now
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          href={ROUTES.editProfile}
          className={cn(buttonVariants({ variant: "cream", size: "sm" }))}
        >
          <Settings className="mr-1.5 h-4 w-4" />
          Edit Profile
        </Link>
      </div>
      <PlayerProfile playerId={player.id} />
    </div>
  );
}

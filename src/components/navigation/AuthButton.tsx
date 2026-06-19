"use client";

import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { signOut } from "@/firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function AuthButton() {
  const { isLoading, isAuthenticated, user, firebaseUser, role } = useAuth();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-11 w-24 animate-pulse rounded-2xl border-4 border-ink bg-cream motion-reduce:animate-none" />
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={ROUTES.login}
        className={cn(buttonVariants({ variant: "ink", size: "sm" }))}
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    );
  }

  const name = user?.displayName ?? firebaseUser?.displayName ?? "Player";
  const photo = user?.photoURL ?? firebaseUser?.photoURL ?? null;

  async function handleSignOut() {
    setOpen(false);
    await signOut();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 rounded-2xl border-4 border-ink bg-cream px-2 py-1 shadow-brutal-xs transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
      >
        {photo ? (
          <Image
            src={photo}
            alt=""
            width={28}
            height={28}
            className="rounded-full border-2 border-ink"
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-vpurple">
            <UserRound className="h-4 w-4" />
          </span>
        )}
        <span className="hidden max-w-24 truncate text-sm font-bold sm:block">
          {name}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border-4 border-ink bg-cream p-2 shadow-brutal-md"
          >
            <Link
              role="menuitem"
              href={ROUTES.dashboard}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-vyellow"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            {(role === "teamLeader" || role === "franchiseOwner") && (
              <>
                <div className="mb-1 mt-2 px-3 text-[10px] font-bold uppercase tracking-wider text-ink/40">
                  Team
                </div>
                <Link
                  role="menuitem"
                  href={ROUTES.teamSquad}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-vyellow"
                >
                  <Users className="h-4 w-4" /> Squad
                </Link>
                <Link
                  role="menuitem"
                  href={ROUTES.teamLineup}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-vyellow"
                >
                  <ClipboardList className="h-4 w-4" /> Lineup
                </Link>
                <Link
                  role="menuitem"
                  href={ROUTES.teamManage}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-vyellow"
                >
                  <Trophy className="h-4 w-4" /> Manage
                </Link>
                <Link
                  role="menuitem"
                  href={ROUTES.teamHistory}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-vyellow"
                >
                  <Building2 className="h-4 w-4" /> History
                </Link>
                <div className="my-1 border-t-2 border-ink/10" />
                <Link
                  role="menuitem"
                  href={ROUTES.franchise}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-vyellow"
                >
                  <Building2 className="h-4 w-4" /> Franchise
                </Link>
              </>
            )}
            <Link
              role="menuitem"
              href={ROUTES.profile}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-vyellow"
            >
              <UserRound className="h-4 w-4" /> Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-vred hover:bg-vred hover:text-ink"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

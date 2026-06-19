"use client";

import Link from "next/link";
import { Camera, Globe, Headphones, MessageCircle, Tv } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const LINKS = [
  { label: "About", href: "/about" },
  { label: "Rules", href: "/rules" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Community", href: "/community-guidelines" },
];

const SOCIALS = [
  { key: "instagram", icon: Camera, label: "Instagram" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { key: "youtube", icon: Tv, label: "YouTube" },
  { key: "discord", icon: Headphones, label: "Discord" },
  { key: "website", icon: Globe, label: "Website" },
] as const;

export function Footer() {
  const { data: settings } = useSettings();
  const links = settings?.socialLinks;
  const socials = SOCIALS.filter((s) => {
    const url = links?.[s.key];
    return typeof url === "string" && url.trim().length > 0;
  });

  return (
    <footer className="border-t-4 border-ink bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-bold uppercase tracking-wide transition-colors hover:text-vred"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {socials.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {socials.map(({ key, icon: Icon, label }) => (
              <a
                key={key}
                href={links![key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-cream transition-colors hover:bg-vyellow"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs font-medium text-ink/50">
          VFFT — Velangi Free Fire Tournament · Where Village Legends Rise ·
          Virtual currency only, no real-money gaming.
        </p>
      </div>
    </footer>
  );
}

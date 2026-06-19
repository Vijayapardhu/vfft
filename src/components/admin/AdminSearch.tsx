"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Swords, Gamepad2, Newspaper } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { useAllNews } from "@/hooks/useNews";

export function AdminSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data: players } = usePlayers();
  const { data: teams } = useTeams();
  const { data: matches } = useMatches();
  const { data: news } = useAllNews();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    const items: { label: string; sublabel: string; href: string; icon: React.ReactNode }[] = [];

    for (const p of players) {
      if (p.ign.toLowerCase().includes(q) || p.uid.toLowerCase().includes(q)) {
        items.push({
          label: p.ign,
          sublabel: `Player • ${p.role}`,
          href: "/admin/players",
          icon: <Users className="h-4 w-4" />,
        });
      }
    }

    for (const t of teams) {
      if (t.name.toLowerCase().includes(q)) {
        items.push({
          label: t.name,
          sublabel: "Team",
          href: "/admin/teams",
          icon: <Swords className="h-4 w-4" />,
        });
      }
    }

    for (const m of matches) {
      if (String(m.matchNumber).includes(q)) {
        items.push({
          label: `Match #${m.matchNumber}`,
          sublabel: `${m.map} • ${m.status}`,
          href: "/admin/matches",
          icon: <Gamepad2 className="h-4 w-4" />,
        });
      }
    }

    for (const n of news) {
      if (n.title.toLowerCase().includes(q)) {
        items.push({
          label: n.title,
          sublabel: "News Article",
          href: "/admin/news",
          icon: <Newspaper className="h-4 w-4" />,
        });
      }
    }

    return items.slice(0, 10);
  }, [debouncedQuery, players, teams, matches, news]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brutal-xs"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed inset-x-4 top-[15vh] z-[70] mx-auto max-w-xl"
            >
              <div className="overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-xl">
                <div className="flex items-center gap-3 border-b-4 border-ink px-4 py-3">
                  <Search className="h-5 w-5 text-ink/40" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search players, teams, matches, news..."
                    className="flex-1 bg-transparent text-lg font-bold outline-none placeholder:text-ink/40"
                  />
                  <kbd className="rounded-lg border-2 border-ink bg-cream px-2 py-0.5 text-xs font-bold">
                    ESC
                  </kbd>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {results.length > 0 ? (
                    results.map((r, i) => (
                      <button
                        key={`${r.href}-${i}`}
                        type="button"
                        onClick={() => handleSelect(r.href)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-vyellow"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-xl border-2 border-ink bg-cream">
                          {r.icon}
                        </span>
                        <div>
                          <p className="text-sm font-bold">{r.label}</p>
                          <p className="text-xs font-medium text-ink/60">{r.sublabel}</p>
                        </div>
                      </button>
                    ))
                  ) : query.trim() ? (
                    <p className="p-4 text-center text-sm font-medium text-ink/40">No results found.</p>
                  ) : (
                    <p className="p-4 text-center text-sm font-medium text-ink/40">Type to search...</p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

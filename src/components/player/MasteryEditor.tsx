"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { useWeapons } from "@/hooks/useWeapons";
import { MAX_GUN_LEVEL } from "@/constants/weapons";
import type { PlayerRole } from "@/types";

interface Props {
  weapons: Record<string, number>;
  rolePercentages: Partial<Record<PlayerRole, number>>;
  onWeaponsChange: (v: Record<string, number>) => void;
  onRolePercentagesChange: (v: Partial<Record<PlayerRole, number>>) => void;
}

const ROLE_KEYS: PlayerRole[] = ["rusher", "sniper", "support", "igl"];
const ROLE_LABELS: Record<PlayerRole, string> = {
  rusher: "Rusher",
  sniper: "Sniper",
  support: "Support",
  igl: "IGL",
};

export function MasteryEditor({ weapons, rolePercentages, onWeaponsChange, onRolePercentagesChange }: Props) {
  const { weapons: allWeapons, categories: weaponCategories, loading } = useWeapons();
  const [collapsed, setCollapsed] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  function setLevel(id: string, level: number) {
    const next = { ...weapons };
    if (level <= 0) delete next[id];
    else next[id] = Math.min(level, MAX_GUN_LEVEL);
    onWeaponsChange(next);
  }

  function setRolePct(role: PlayerRole, val: number) {
    onRolePercentagesChange({ ...rolePercentages, [role]: Math.max(0, Math.min(100, val)) });
  }

  const totalWeapons = Object.keys(weapons).length;

  return (
    <div className="space-y-5">
      {/* Toggle header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold uppercase text-ink">Game Mastery</span>
          {totalWeapons > 0 && (
            <span className="ml-2 text-sm font-medium text-ink/60">
              {totalWeapons} gun{totalWeapons > 1 ? "s" : ""} leveled
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="cream"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "Edit" : "Close"}
        </Button>
      </div>

      {!collapsed && (
        <div className="space-y-5 rounded-2xl border-4 border-ink bg-cream p-4">
          {/* Role percentages */}
          <div>
            <Label>Role Proficiency (%)</Label>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ROLE_KEYS.map((r) => (
                <div key={r}>
                  <Label>{ROLE_LABELS[r]}</Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={rolePercentages[r] ?? 0}
                    onChange={(e) => setRolePct(r, Number(e.target.value))}
                    className="w-full accent-vyellow"
                  />
                  <span className="text-xs font-bold">{rolePercentages[r] ?? 0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weapon level grid by category */}
          {loading ? (
            <div className="py-4 text-center text-sm text-ink/60">Loading weapons...</div>
          ) : (
          <div>
            <Label>Gun Levels (max {MAX_GUN_LEVEL})</Label>
            <div className="mt-2 space-y-3">
              {weaponCategories.map((cat) => {
                const catGuns = allWeapons.filter((w) => w.category === cat);
                const isOpen = openCategory === cat;
                return (
                  <div key={cat} className="rounded-xl border-2 border-ink/20">
                    <button
                      type="button"
                      onClick={() => setOpenCategory(isOpen ? null : cat)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-bold uppercase text-ink"
                    >
                      <span>{cat}</span>
                      <span className="text-xs text-ink/40">{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-2 gap-2 border-t-2 border-ink/10 p-3 sm:grid-cols-3 md:grid-cols-4">
                        {catGuns.map((w) => {
                          const level = weapons[w.id] ?? 0;
                          return (
                            <div key={w.id} className="flex items-center gap-1.5">
                              <span className="min-w-0 flex-1 truncate text-xs font-bold text-ink">{w.name}</span>
                              <select
                                value={level}
                                onChange={(e) => setLevel(w.id, Number(e.target.value))}
                                className="w-14 rounded-lg border-2 border-ink bg-cream px-1 py-0.5 text-xs font-bold"
                              >
                                <option value={0}>--</option>
                                {Array.from({ length: MAX_GUN_LEVEL }, (_, i) => i + 1).map((l) => (
                                  <option key={l} value={l}>Lv.{l}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { Label } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-xl border-4 border-ink bg-cream p-1 shadow-brutal-xs"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 flex-1 rounded-2xl border-4 border-ink bg-cream px-4 py-2 font-mono text-sm font-bold shadow-brutal-xs outline-none"
        />
      </div>
    </div>
  );
}

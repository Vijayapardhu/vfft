"use client";

import { Input, Label } from "@/components/ui/input";

interface SocialLinks {
  instagram: string;
  whatsapp: string;
  youtube: string;
  discord?: string;
  website?: string;
}

interface SocialLinksFormProps {
  value: SocialLinks;
  onChange: (links: SocialLinks) => void;
}

export function SocialLinksForm({ value, onChange }: SocialLinksFormProps) {
  function update(key: keyof SocialLinks, val: string) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Instagram URL</Label>
        <Input
          value={value.instagram}
          onChange={(e) => update("instagram", e.target.value)}
          placeholder="https://instagram.com/..."
        />
      </div>
      <div>
        <Label>WhatsApp Number / Link</Label>
        <Input
          value={value.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          placeholder="https://wa.me/..."
        />
      </div>
      <div>
        <Label>YouTube URL</Label>
        <Input
          value={value.youtube}
          onChange={(e) => update("youtube", e.target.value)}
          placeholder="https://youtube.com/..."
        />
      </div>
      <div>
        <Label>Discord Invite</Label>
        <Input
          value={value.discord ?? ""}
          onChange={(e) => update("discord", e.target.value)}
          placeholder="https://discord.gg/..."
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Website</Label>
        <Input
          value={value.website ?? ""}
          onChange={(e) => update("website", e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

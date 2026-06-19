"use client";

import { Input, Label } from "@/components/ui/input";

interface SeasonFormData {
  seasonName: string;
  prizePool: string;
  startDate: string;
  endDate: string;
}

interface SeasonSettingsFormProps {
  value: SeasonFormData;
  onChange: (data: SeasonFormData) => void;
}

export function SeasonSettingsForm({ value, onChange }: SeasonSettingsFormProps) {
  function update(key: keyof SeasonFormData, val: string) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Season Name</Label>
        <Input
          value={value.seasonName}
          onChange={(e) => update("seasonName", e.target.value)}
          placeholder="Season 1"
        />
      </div>
      <div>
        <Label>Prize Pool</Label>
        <Input
          value={value.prizePool}
          onChange={(e) => update("prizePool", e.target.value)}
          placeholder="₹10,000"
        />
      </div>
      <div>
        <Label>Start Date</Label>
        <Input
          type="date"
          value={value.startDate}
          onChange={(e) => update("startDate", e.target.value)}
        />
      </div>
      <div>
        <Label>End Date</Label>
        <Input
          type="date"
          value={value.endDate}
          onChange={(e) => update("endDate", e.target.value)}
        />
      </div>
    </div>
  );
}

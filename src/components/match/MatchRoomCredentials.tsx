"use client";

import { setDoc } from "firebase/firestore";
import { Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { matchCredentialsDoc } from "@/firebase/collections";
import { useAuth } from "@/hooks/useAuth";
import { useMatchCredentials } from "@/hooks/useMatches";

/**
 * Room ID & password for a match. Admins get an editor; the two playing teams
 * see the values; everyone else sees a friendly placeholder. Stored in the
 * private subcollection so credentials never leak on the public match doc.
 */
export function MatchRoomCredentials({ matchId }: { matchId: string }) {
  const { isAdmin } = useAuth();
  const { data: credentials } = useMatchCredentials(matchId);
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (credentials) {
      setRoomId(credentials.roomId ?? "");
      setPassword(credentials.password ?? "");
    }
  }, [credentials]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(matchCredentialsDoc(matchId), {
        roomId: roomId.trim(),
        password: password.trim(),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border-4 border-ink bg-vyellow p-5 shadow-brutal">
      <h2 className="mb-3 flex items-center gap-2 text-xl">
        <Lock className="h-5 w-5" /> Room Details
      </h2>

      {isAdmin ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rc-room">Room ID</Label>
              <Input
                id="rc-room"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setSaved(false);
                }}
                placeholder="e.g. 12345678"
              />
            </div>
            <div>
              <Label htmlFor="rc-pass">Password</Label>
              <Input
                id="rc-pass"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSaved(false);
                }}
                placeholder="e.g. vfft123"
              />
            </div>
          </div>
          <Button variant="ink" disabled={saving || !roomId.trim()} onClick={save}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Room Details"}
          </Button>
          <p className="text-xs font-medium text-ink/70">
            Only the two playing teams can see these.
          </p>
        </div>
      ) : credentials ? (
        <div className="grid grid-cols-2 gap-3 font-bold">
          <div>
            <div className="text-xs uppercase text-ink/60">Room ID</div>
            <div className="text-lg">{credentials.roomId}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-ink/60">Password</div>
            <div className="text-lg">{credentials.password}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-ink/70">
          Shared with the playing teams before the room opens.
        </p>
      )}
    </div>
  );
}

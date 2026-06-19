"use client";

import { Camera, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Selfie-only photo capture (PRD registration). Uses the live front camera via
 * getUserMedia so players can't pick an old gallery image. On devices without
 * camera access it falls back to the OS camera capture input (`capture="user"`),
 * which still opens the camera rather than the gallery on mobile.
 */
export function SelfieCapture({
  value,
  onCapture,
}: {
  value: string | null;
  onCapture: (file: File, previewUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }

  // Always release the camera when the component unmounts.
  useEffect(() => stop, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setStreaming(true);
      // Attach after the <video> mounts.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError(
        "Couldn't open the camera. Allow camera access, or use the camera button below.",
      );
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 640;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${w}x${h}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file, URL.createObjectURL(file));
        stop();
      },
      "image/jpeg",
      0.9,
    );
  }

  function onFallbackFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file, URL.createObjectURL(file));
  }

  return (
    <div className="space-y-3">
      <div className="relative grid aspect-square w-44 place-items-center overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/30">
        {streaming ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Your selfie" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-10 w-10 text-ink/40" />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {streaming ? (
          <>
            <Button type="button" variant="red" size="sm" onClick={capture}>
              <Camera className="h-4 w-4" /> Capture
            </Button>
            <Button type="button" variant="cream" size="sm" onClick={stop}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="yellow" size="sm" onClick={start}>
              <Camera className="h-4 w-4" /> {value ? "Retake selfie" : "Open camera"}
            </Button>
            {value && (
              <Button type="button" variant="cream" size="sm" onClick={start}>
                <RotateCcw className="h-4 w-4" /> Retake
              </Button>
            )}
          </>
        )}

        {/* OS camera fallback — still opens the camera (not gallery) on mobile. */}
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-2xl border-4 border-ink bg-cream px-3 py-1.5 text-sm font-bold uppercase shadow-brutal-xs hover:bg-vyellow">
          <Camera className="h-4 w-4" /> Phone camera
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={onFallbackFile}
          />
        </label>
      </div>

      {error && <p className="text-xs font-bold text-vred">{error}</p>}
    </div>
  );
}

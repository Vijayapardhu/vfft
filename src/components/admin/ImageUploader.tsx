"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CloudinaryFolder } from "@/services/cloudinaryService";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder: CloudinaryFolder;
}

export function ImageUploader({ value, onChange, folder }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const { uploadImage } = await import("@/services/cloudinaryService");
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block rounded-2xl border-4 border-ink overflow-hidden">
          <img
            src={value}
            alt="Uploaded preview"
            className="max-h-48 w-auto object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-vred text-ink shadow-brutal-xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-4 border-dashed border-ink/30 p-8 transition-colors",
            drag && "border-ink bg-vyellow/20",
            uploading && "pointer-events-none opacity-50",
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <ImageIcon className="h-8 w-8 text-ink/40" />
          )}
          <span className="text-sm font-bold text-ink/60">
            {uploading ? "Uploading..." : "Click or drag image here"}
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

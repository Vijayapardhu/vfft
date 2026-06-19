/**
 * Unsigned client-side uploads to Cloudinary (TRD §10/§26). The cloud name and
 * unsigned preset are public by design; the API secret stays server-side and is
 * never imported here. Folders mirror the documented Cloudinary structure.
 */
export type CloudinaryFolder =
  | "players"
  | "teams"
  | "banners"
  | "gallery"
  | "hall-of-fame"
  | "match-evidence"
  | "winners"
  | "posters"
  | "weapons";

export const isCloudinaryConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
);

export async function uploadImage(
  file: File,
  folder: CloudinaryFolder,
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new Error("Cloudinary is not configured. Add credentials to .env.local.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", `vfft/${folder}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    throw new Error("Image upload failed. Please try again.");
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Image upload returned no URL.");
  return data.secure_url;
}

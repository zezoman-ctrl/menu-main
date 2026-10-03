import { supabase } from "./supabase";

export const BUCKET = "menu-photos";
export const MAX_PHOTOS = 25;

export function photoUrl(path) {
  return path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;
}

// Shrinks any phone photo (even a 5-12 MB iPhone shot) to a ~60-150 KB JPEG before upload.
// This is what keeps 25 photos tiny on the free tier.
export async function resizeImage(file, max = 800, quality = 0.8) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file); // also applies the photo's rotation
  } catch {
    throw new Error("Could not read this photo. Try another one (JPEG or PNG).");
  }
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process this photo."))),
      "image/jpeg",
      quality
    )
  );
}
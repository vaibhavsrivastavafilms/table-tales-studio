import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { logMonitoring } from "@/lib/monitoring";
import {
  LIMITS,
  sanitizeFilename,
  validateStorageBlob,
} from "@/lib/validation";

export const BUCKETS = {
  projectImages: "project-images",
  exports: "exports",
  thumbnails: "thumbnails",
} as const;

export type StorageBucket = (typeof BUCKETS)[keyof typeof BUCKETS];

function storagePath(
  userId: string,
  projectId: string,
  filename: string
): string {
  return `${userId}/${projectId}/${filename}`;
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  if (!isSupabaseConfigured()) return path;

  const env = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!env) return path;

  return `${env}/storage/v1/object/public/${bucket}/${path}`;
}

export function isStorageUrl(url: string): boolean {
  return url.includes("/storage/v1/object/public/");
}

export async function uploadImage(
  userId: string,
  projectId: string,
  file: Blob,
  index: number
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  if (!validateStorageBlob(file)) {
    logMonitoring("storage_upload_rejected", "warn", { bucket: "project-images" });
    return null;
  }

  try {
    const supabase = createBrowserClient();
    const path = storagePath(
      userId,
      projectId,
      `slide-${index + 1}-${Date.now()}.jpg`
    );

    const { error } = await supabase.storage
      .from(BUCKETS.projectImages)
      .upload(path, file, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;
    return getPublicUrl(BUCKETS.projectImages, path);
  } catch (error) {
    logger.warn("uploadImage failed", { error: String(error) });
    logMonitoring("storage_error", "warn", { op: "uploadImage" });
    return null;
  }
}

export async function uploadThumbnail(
  userId: string,
  projectId: string,
  blob: Blob,
  index: number
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  if (!validateStorageBlob(blob)) return null;

  try {
    const supabase = createBrowserClient();
    const path = storagePath(userId, projectId, `thumb-${index + 1}.jpg`);

    const { error } = await supabase.storage
      .from(BUCKETS.thumbnails)
      .upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;
    return getPublicUrl(BUCKETS.thumbnails, path);
  } catch (error) {
    logger.warn("uploadThumbnail failed", { error: String(error) });
    return null;
  }
}

export async function deleteImage(pathOrUrl: string): Promise<void> {
  if (!isSupabaseConfigured() || !pathOrUrl) return;

  try {
    const supabase = createBrowserClient();
    const path = pathOrUrl.includes("/object/public/")
      ? pathOrUrl.split("/object/public/")[1]?.split("/").slice(1).join("/")
      : pathOrUrl;

    if (!path) return;

    const bucket = pathOrUrl.includes(BUCKETS.thumbnails)
      ? BUCKETS.thumbnails
      : BUCKETS.projectImages;

    await supabase.storage.from(bucket).remove([path]);
  } catch (error) {
    logger.warn("deleteImage failed", { error: String(error) });
  }
}

export async function uploadExportZip(
  userId: string,
  projectId: string,
  blob: Blob,
  filename: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  if (blob.size > LIMITS.exportZipMaxBytes || blob.size === 0) return null;

  const safeName = `${sanitizeFilename(filename)}.zip`.replace(/\.zip\.zip$/, ".zip");

  try {
    const supabase = createBrowserClient();
    const path = `${userId}/${projectId}/${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKETS.exports)
      .upload(path, blob, {
        contentType: "application/zip",
        upsert: true,
      });

    if (error) throw error;
    return getPublicUrl(BUCKETS.exports, path);
  } catch (error) {
    logger.warn("uploadExportZip failed", { error: String(error) });
    return null;
  }
}

export async function uploadProjectImages(
  userId: string,
  projectId: string,
  blobs: Blob[]
): Promise<string[]> {
  const urls: string[] = [];
  const capped = blobs.slice(0, LIMITS.projectImagesMax);

  for (let i = 0; i < capped.length; i++) {
    const url = await uploadImage(userId, projectId, capped[i], i);
    urls.push(url ?? (await fallbackDataUrl(capped[i])));
  }

  return urls;
}

async function fallbackDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  logUploadFailure,
  supabaseErrorFields,
  type UploadFailureContext,
} from "@/lib/uploadDiagnostics";
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

export type StorageUploadAttempt = {
  bucket: StorageBucket;
  path: string;
  mimeType: string;
  payloadBytes: number;
};

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

export async function probeProjectImagesBucket(): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase not configured" };
  }

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.storage
      .from(BUCKETS.projectImages)
      .list("", { limit: 1 });

    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: data ? "reachable" : "empty" };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "probe failed",
    };
  }
}

export async function uploadImage(
  userId: string,
  projectId: string,
  file: Blob,
  index: number
): Promise<{ url: string } | { error: UploadFailureContext }> {
  const attempt: StorageUploadAttempt = {
    bucket: BUCKETS.projectImages,
    path: storagePath(
      userId,
      projectId,
      `slide-${index + 1}-${Date.now()}.jpg`
    ),
    mimeType: file.type || "image/jpeg",
    payloadBytes: file.size,
  };

  if (!isSupabaseConfigured()) {
    return {
      error: {
        code: "storage",
        message: "Supabase is not configured",
        stage: "uploading",
        uploadTarget: "supabase",
        bucket: attempt.bucket,
        storagePath: attempt.path,
        mimeType: attempt.mimeType,
        payloadBytes: attempt.payloadBytes,
      },
    };
  }

  if (!validateStorageBlob(file)) {
    logUploadFailure(new Error("Invalid storage blob"), {
      code: "empty_blob",
      message: "Processed image blob rejected for storage",
      stage: "uploading",
      uploadTarget: "supabase",
      bucket: attempt.bucket,
      storagePath: attempt.path,
      mimeType: attempt.mimeType,
      payloadBytes: attempt.payloadBytes,
      fileIndex: index,
    });
    return {
      error: {
        code: "empty_blob",
        message: "Processed image blob rejected for storage",
        stage: "uploading",
        uploadTarget: "supabase",
        bucket: attempt.bucket,
        storagePath: attempt.path,
        mimeType: attempt.mimeType,
        payloadBytes: attempt.payloadBytes,
        fileIndex: index,
      },
    };
  }

  try {
    const supabase = createBrowserClient();
    const { error } = await supabase.storage
      .from(attempt.bucket)
      .upload(attempt.path, file, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      const provider = supabaseErrorFields(error);
      const ctx: UploadFailureContext = {
        code: "storage",
        message: error.message || "Storage upload failed",
        stage: "uploading",
        uploadTarget: "supabase",
        bucket: attempt.bucket,
        storagePath: attempt.path,
        mimeType: attempt.mimeType,
        payloadBytes: attempt.payloadBytes,
        fileIndex: index,
        providerStatus: provider.status,
        providerMessage: provider.message,
      };
      logUploadFailure(error, ctx);
      return { error: ctx };
    }

    return { url: getPublicUrl(attempt.bucket, attempt.path) };
  } catch (error) {
    const provider = supabaseErrorFields(error);
    const ctx: UploadFailureContext = {
      code: "storage",
      message: error instanceof Error ? error.message : "Storage upload failed",
      stage: "uploading",
      uploadTarget: "supabase",
      bucket: attempt.bucket,
      storagePath: attempt.path,
      mimeType: attempt.mimeType,
      payloadBytes: attempt.payloadBytes,
      fileIndex: index,
      providerStatus: provider.status,
      providerMessage: provider.message,
      stack: error instanceof Error ? error.stack : undefined,
    };
    logUploadFailure(error, ctx);
    return { error: ctx };
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
    logUploadFailure(error, {
      code: "storage",
      stage: "uploading",
      bucket: BUCKETS.thumbnails,
      fileIndex: index,
      uploadTarget: "supabase",
      message: "Thumbnail upload failed",
    });
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
    logUploadFailure(error, {
      code: "storage",
      stage: "uploading",
      message: "deleteImage failed",
    });
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
    logUploadFailure(error, {
      code: "storage",
      stage: "uploading",
      bucket: BUCKETS.exports,
      message: "Export zip upload failed",
    });
    return null;
  }
}

export type ProjectImagesUploadResult = {
  urls: string[];
  usedLocalFallback: boolean;
  storageErrors: number;
};

export async function uploadProjectImages(
  userId: string,
  projectId: string,
  blobs: Blob[],
  localDisplayUrls: string[]
): Promise<ProjectImagesUploadResult> {
  const urls: string[] = [];
  const capped = blobs.slice(0, LIMITS.projectImagesMax);
  let storageErrors = 0;
  let usedLocalFallback = false;

  for (let i = 0; i < capped.length; i++) {
    const result = await uploadImage(userId, projectId, capped[i], i);
    if ("url" in result && result.url) {
      urls.push(result.url);
      continue;
    }

    storageErrors += 1;
    const localUrl = localDisplayUrls[i];
    if (localUrl?.startsWith("blob:")) {
      urls.push(localUrl);
      usedLocalFallback = true;
      continue;
    }

    try {
      urls.push(await blobToDataUrl(capped[i]));
      usedLocalFallback = true;
    } catch (err) {
      logUploadFailure(err, {
        code: "invalid_base64",
        stage: "fallback",
        fileIndex: i,
        uploadTarget: "data_url",
        message: "Could not encode fallback data URL",
      });
      if (localUrl) {
        urls.push(localUrl);
        usedLocalFallback = true;
      }
    }
  }

  return { urls, usedLocalFallback, storageErrors };
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

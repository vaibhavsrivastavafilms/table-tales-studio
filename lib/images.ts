import { isBrowser, revokeObjectUrls } from "@/lib/browser";
import { logMonitoring } from "@/lib/monitoring";
import {
  LIMITS,
  validateUploadFiles,
  type UploadValidationResult,
} from "@/lib/validation";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const THUMB_MAX = 480;

export type ProcessedUpload = {
  displayUrl: string;
  storageBlob: Blob;
  thumbnailDataUrl: string;
};

export async function compressImageFile(file: File): Promise<Blob> {
  if (!isBrowser()) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
  );

  return blob ?? file;
}

export async function createThumbnailBlob(blob: Blob): Promise<Blob> {
  if (!isBrowser()) return blob;

  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, THUMB_MAX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return (
    (await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.75)
    )) ?? blob
  );
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function validateFilesForUpload(files: File[]): UploadValidationResult {
  return validateUploadFiles(files);
}

function withUploadTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error("Upload processing timed out")),
        LIMITS.uploadTimeoutMs
      );
    }),
  ]);
}

export async function processUploadFiles(
  files: File[]
): Promise<ProcessedUpload[]> {
  const checked = validateUploadFiles(files);
  if (!checked.ok) {
    logMonitoring("upload_rejected", "warn", { reason: checked.reason });
    throw new Error(checked.reason);
  }

  const objectUrls: string[] = [];

  try {
    const results: ProcessedUpload[] = [];

    for (const file of checked.files) {
      const storageBlob = await compressImageFile(file);
      const thumbBlob = await createThumbnailBlob(storageBlob);
      const displayUrl = URL.createObjectURL(storageBlob);
      objectUrls.push(displayUrl);
      const thumbnailDataUrl = await blobToDataUrl(thumbBlob);
      results.push({ displayUrl, storageBlob, thumbnailDataUrl });
    }

    return results;
  } catch (error) {
    revokeObjectUrls(objectUrls);
    logMonitoring("upload_process_failed", "error");
    throw error;
  }
}

export async function processUploadFilesSafe(
  files: File[]
): Promise<ProcessedUpload[]> {
  return withUploadTimeout(processUploadFiles(files));
}

export function replaceObjectUrls(previous: string[], next: string[]): void {
  const keep = new Set(next);
  for (const url of previous) {
    if (url.startsWith("blob:") && !keep.has(url)) {
      URL.revokeObjectURL(url);
    }
  }
}

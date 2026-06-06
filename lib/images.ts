import { isBrowser, revokeObjectUrls } from "@/lib/browser";
import {
  logUploadFailure,
  UploadPipelineError,
} from "@/lib/uploadDiagnostics";
import { logMonitoring } from "@/lib/monitoring";
import {
  assertNonEmptyBlob,
  isAllowedUploadMime,
  isValidBase64DataUrl,
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

function guardFileMime(file: File): void {
  const mime = (file.type || "").toLowerCase();
  if (mime && !isAllowedUploadMime(mime)) {
    throw new UploadPipelineError({
      code: "unsupported_mime",
      message: `Unsupported image type: ${mime}`,
      stage: "validating",
      mimeType: mime,
      fileName: file.name,
      payloadBytes: file.size,
    });
  }
}

export async function compressImageFile(file: File): Promise<Blob> {
  guardFileMime(file);

  if (!isBrowser()) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (err) {
    throw new UploadPipelineError({
      code: "canvas_conversion",
      message: "Could not decode image for optimization",
      stage: "optimizing",
      mimeType: file.type,
      fileName: file.name,
      payloadBytes: file.size,
      cause: err instanceof Error ? err.message : undefined,
    });
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new UploadPipelineError({
      code: "canvas_conversion",
      message: "Canvas unavailable for image optimization",
      stage: "optimizing",
      fileName: file.name,
      mimeType: file.type,
      payloadBytes: file.size,
    });
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
  );

  if (!blob || blob.size === 0) {
    throw new UploadPipelineError({
      code: "canvas_conversion",
      message: "Image optimization produced an empty file",
      stage: "optimizing",
      fileName: file.name,
      mimeType: file.type,
      payloadBytes: file.size,
    });
  }

  assertNonEmptyBlob(blob, "optimized image");
  return blob;
}

export async function createThumbnailBlob(blob: Blob): Promise<Blob> {
  if (!isBrowser()) return blob;
  assertNonEmptyBlob(blob, "source for thumbnail");

  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, THUMB_MAX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return blob;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const thumb =
    (await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.75)
    )) ?? blob;

  assertNonEmptyBlob(thumb, "thumbnail");
  return thumb;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  assertNonEmptyBlob(blob, "blob for data URL");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  if (!isValidBase64DataUrl(dataUrl)) {
    throw new UploadPipelineError({
      code: "invalid_base64",
      message: "Invalid image data URL after encoding",
      stage: "optimizing",
      mimeType: blob.type,
      payloadBytes: blob.size,
      uploadTarget: "data_url",
    });
  }

  return dataUrl;
}

export function validateFilesForUpload(files: File[]): UploadValidationResult {
  return validateUploadFiles(files);
}

function withUploadTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new UploadPipelineError({
              code: "processing_timeout",
              message: "Upload processing timed out",
              stage: "optimizing",
            })
          ),
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
    throw new UploadPipelineError({
      code: "validation",
      message: checked.reason,
      stage: "validating",
    });
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
    if (!(error instanceof UploadPipelineError)) {
      logUploadFailure(error, { code: "unknown", stage: "optimizing" });
    }
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

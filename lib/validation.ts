import { guardCaptions } from "@/lib/creativeGuardrails";
import {
  type Captions,
  SLIDE_KEYS,
} from "@/lib/slides";

import { getTemplateId, type TemplateId } from "@/lib/templates";
export type ExportFormat = "jpeg" | "png";

export const LIMITS = {
  titleMax: 120,
  captionFieldMax: 500,
  captionsJsonMax: 12_000,
  templateNameMax: 80,
  projectImagesMax: 10,
  uploadMaxBytes: 15 * 1024 * 1024,
  uploadMaxFiles: 10,
  jsonBodyMaxBytes: 32_000,
  exportZipMaxBytes: 80 * 1024 * 1024,
  uploadTimeoutMs: 45_000,
} as const;

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const BLOCKED_EXTENSIONS = new Set([
  "svg",
  "xml",
  "html",
  "htm",
  "js",
  "mjs",
  "cjs",
  "php",
  "exe",
  "bat",
  "sh",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseTemplateId(value: unknown): TemplateId {
  if (typeof value !== "string" || !value.trim()) {
    return "street-food";
  }
  return getTemplateId(value.trim().slice(0, LIMITS.templateNameMax));
}

export function parseTemplateName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "Street Food";
  return value.trim().slice(0, LIMITS.templateNameMax);
}

export function sanitizeProjectTitle(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  const cleaned = raw.replace(/[\x00-\x1f\x7f]/g, "");
  const title = cleaned.slice(0, LIMITS.titleMax);
  return title || "Untitled Carousel";
}

export function sanitizeCaptionField(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").slice(0, LIMITS.captionFieldMax);
}

export function sanitizeCaptions(input: unknown): Captions {
  const base = Object.fromEntries(
    SLIDE_KEYS.map((k) => [k, ""])
  ) as Captions;

  if (!input || typeof input !== "object") return base;

  const record = input as Record<string, unknown>;
  for (const key of SLIDE_KEYS) {
    if (record[key] !== undefined) {
      base[key] = sanitizeCaptionField(record[key]);
    }
  }
  return guardCaptions(base);
}

export function captionsPayloadSize(captions: Captions): number {
  try {
    return JSON.stringify(captions).length;
  } catch {
    return LIMITS.captionsJsonMax + 1;
  }
}

export function isCaptionsPayloadValid(captions: Captions): boolean {
  return captionsPayloadSize(captions) <= LIMITS.captionsJsonMax;
}

export function parseExportFormat(value: unknown): ExportFormat {
  return value === "png" ? "png" : "jpeg";
}

export function sanitizeFilename(name: string): string {
  const base = name
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\.\./g, "")
    .trim()
    .slice(0, 80);
  return base || "upload";
}

export function fileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

export type UploadValidationResult =
  | { ok: true; files: File[] }
  | { ok: false; reason: string };

export function validateUploadFiles(files: File[]): UploadValidationResult {
  if (!files.length) {
    return { ok: false, reason: "No files selected" };
  }

  if (files.length > LIMITS.uploadMaxFiles) {
    return {
      ok: false,
      reason: `Maximum ${LIMITS.uploadMaxFiles} images per upload`,
    };
  }

  const accepted: File[] = [];

  for (const file of files) {
    const ext = fileExtension(file.name);
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return { ok: false, reason: `Unsupported file type: .${ext}` };
    }

    const mime = (file.type || "").toLowerCase();
    if (mime && !ALLOWED_IMAGE_MIME.has(mime)) {
      if (mime.includes("svg") || mime.startsWith("text/")) {
        return { ok: false, reason: "SVG and script files are not allowed" };
      }
      return { ok: false, reason: `Unsupported image type: ${mime}` };
    }

    if (file.size > LIMITS.uploadMaxBytes) {
      return {
        ok: false,
        reason: `Each image must be under ${Math.round(LIMITS.uploadMaxBytes / (1024 * 1024))}MB`,
      };
    }

    if (file.size === 0) {
      return { ok: false, reason: "Empty file rejected" };
    }

    accepted.push(file);
  }

  return { ok: true, files: accepted };
}

export function isAllowedUploadMime(mime: string): boolean {
  const normalized = mime.toLowerCase();
  if (!normalized) return true;
  return ALLOWED_IMAGE_MIME.has(normalized);
}

export function isValidBase64DataUrl(value: string): boolean {
  if (!value.startsWith("data:")) return false;
  const comma = value.indexOf(",");
  if (comma < 0) return false;
  const header = value.slice(0, comma);
  const payload = value.slice(comma + 1).trim();
  if (!payload.length) return false;
  if (!/^data:image\/(jpeg|jpg|png|webp);base64$/i.test(header.split(";")[0] ?? "")) {
    return /^data:image\//i.test(header) && header.includes("base64");
  }
  if (payload.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(payload);
}

export function validateStorageBlob(blob: Blob): boolean {
  if (blob.size === 0 || blob.size > LIMITS.uploadMaxBytes * 2) return false;
  const type = (blob.type || "").toLowerCase();
  if (!type) return true;
  return type === "image/jpeg" || type === "image/png" || type === "application/zip";
}

export function assertNonEmptyBlob(blob: Blob, label: string): void {
  if (blob.size === 0) {
    throw new Error(`Empty ${label} after processing`);
  }
}

export function clampImageCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(3, Math.round(n)));
}

export function sanitizeImageUrlList(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .filter((u): u is string => typeof u === "string" && u.length > 0)
    .slice(0, LIMITS.projectImagesMax)
    .map((u) => u.slice(0, 2048));
}

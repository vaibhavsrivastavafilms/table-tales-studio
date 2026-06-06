import { BUCKETS, type StorageBucket } from "@/lib/storage";
import { logMonitoring } from "@/lib/monitoring";

export type UploadStage =
  | "validating"
  | "optimizing"
  | "uploading"
  | "fallback"
  | "done";

export type UploadFailureCode =
  | "validation"
  | "empty_blob"
  | "unsupported_mime"
  | "file_too_large"
  | "canvas_conversion"
  | "invalid_base64"
  | "processing_timeout"
  | "invalid_project_id"
  | "auth"
  | "storage"
  | "unknown";

export type UploadFailureContext = {
  code: UploadFailureCode;
  message: string;
  stage: UploadStage;
  bucket?: StorageBucket;
  storagePath?: string;
  mimeType?: string;
  payloadBytes?: number;
  fileName?: string;
  fileIndex?: number;
  uploadTarget?: "supabase" | "local_blob" | "data_url";
  providerStatus?: string;
  providerMessage?: string;
  stack?: string;
  cause?: string;
};

export class UploadPipelineError extends Error {
  readonly context: UploadFailureContext;

  constructor(context: UploadFailureContext) {
    super(context.message);
    this.name = "UploadPipelineError";
    this.context = context;
  }
}

function truncateStack(stack: string | undefined, max = 1200): string | undefined {
  if (!stack) return undefined;
  return stack.length > max ? `${stack.slice(0, max)}…` : stack;
}

export function errorMessage(error: unknown): string {
  if (error instanceof UploadPipelineError) return error.context.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

export function errorStack(error: unknown): string | undefined {
  if (error instanceof Error) return truncateStack(error.stack);
  return undefined;
}

export function supabaseErrorFields(
  error: unknown
): { status?: string; message?: string } {
  if (!error || typeof error !== "object") return {};
  const e = error as {
    message?: string;
    statusCode?: string | number;
    error?: string;
    name?: string;
  };
  return {
    status:
      e.statusCode !== undefined
        ? String(e.statusCode)
        : e.name
          ? String(e.name)
          : undefined,
    message: e.message ?? e.error,
  };
}

export function toMonitoringMeta(
  ctx: UploadFailureContext
): Record<string, string | number | boolean> {
  const meta: Record<string, string | number | boolean> = {
    code: ctx.code,
    stage: ctx.stage,
    message: ctx.message.slice(0, 400),
  };
  if (ctx.bucket) meta.bucket = ctx.bucket;
  if (ctx.storagePath) meta.path = ctx.storagePath.slice(0, 200);
  if (ctx.mimeType) meta.mime = ctx.mimeType;
  if (ctx.payloadBytes !== undefined) meta.bytes = ctx.payloadBytes;
  if (ctx.fileName) meta.file = ctx.fileName.slice(0, 80);
  if (ctx.fileIndex !== undefined) meta.fileIndex = ctx.fileIndex;
  if (ctx.uploadTarget) meta.target = ctx.uploadTarget;
  if (ctx.providerStatus) meta.providerStatus = ctx.providerStatus;
  if (ctx.providerMessage) meta.providerMessage = ctx.providerMessage.slice(0, 300);
  if (ctx.cause) meta.cause = ctx.cause.slice(0, 200);
  return meta;
}

/** Full console detail in all environments — not the quiet production monitoring line. */
export function logUploadFailure(
  error: unknown,
  partial: Partial<UploadFailureContext>
): UploadFailureContext {
  const provider = supabaseErrorFields(error);
  const ctx: UploadFailureContext = {
    code: partial.code ?? "unknown",
    message:
      partial.message ??
      (error instanceof Error ? error.message : "Upload failed"),
    stage: partial.stage ?? "validating",
    bucket: partial.bucket,
    storagePath: partial.storagePath,
    mimeType: partial.mimeType,
    payloadBytes: partial.payloadBytes,
    fileName: partial.fileName,
    fileIndex: partial.fileIndex,
    uploadTarget: partial.uploadTarget,
    providerStatus: partial.providerStatus ?? provider.status,
    providerMessage: partial.providerMessage ?? provider.message,
    stack: partial.stack ?? errorStack(error),
    cause:
      partial.cause ??
      (error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : undefined),
  };

  console.error("[TableTales:upload] failure", {
    ...ctx,
    bucket: ctx.bucket ?? BUCKETS.projectImages,
  });

  logMonitoring("upload_failed", "error", toMonitoringMeta(ctx));
  return ctx;
}

export function uploadStageLabel(stage: UploadStage | "failed" | "idle"): string | null {
  switch (stage) {
    case "validating":
    case "uploading":
      return "Uploading images…";
    case "optimizing":
      return "Optimizing photos…";
    case "fallback":
      return "Saving local previews…";
    case "failed":
      return "Upload failed";
    case "done":
    case "idle":
    default:
      return null;
  }
}

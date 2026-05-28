import { NextResponse } from "next/server";
import { LIMITS } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { logMonitoring } from "@/lib/monitoring";

export type ApiErrorBody = {
  error: string;
  code?: string;
};

export function jsonError(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(
  data: T,
  status = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function requireMethod(
  req: Request,
  allowed: ReadonlySet<string>
): NextResponse<ApiErrorBody> | null {
  if (!allowed.has(req.method)) {
    return jsonError("Method not allowed", 405, "METHOD_NOT_ALLOWED");
  }
  return null;
}

export async function parseJsonBody(
  req: Request,
  maxBytes = LIMITS.jsonBodyMaxBytes
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; response: NextResponse<ApiErrorBody> }
> {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    logMonitoring("api_payload_rejected", "warn", { reason: "oversized" });
    return {
      ok: false,
      response: jsonError("Request body too large", 413, "PAYLOAD_TOO_LARGE"),
    };
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return {
      ok: false,
      response: jsonError("Could not read request body", 400, "BODY_READ_FAILED"),
    };
  }

  if (raw.length > maxBytes) {
    logMonitoring("api_payload_rejected", "warn", { reason: "oversized" });
    return {
      ok: false,
      response: jsonError("Request body too large", 413, "PAYLOAD_TOO_LARGE"),
    };
  }

  if (!raw.trim()) {
    return { ok: true, data: {} };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        response: jsonError("Invalid JSON body", 400, "INVALID_JSON"),
      };
    }
    return { ok: true, data: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      response: jsonError("Invalid JSON body", 400, "INVALID_JSON"),
    };
  }
}

export function handleApiError(
  route: string,
  error: unknown,
  fallbackStatus = 500
): NextResponse<ApiErrorBody> {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  logger.error(`${route} failed`, { error: message });
  logMonitoring(`${route}_error`, "error", { route });
  return jsonError("Request failed", fallbackStatus, "INTERNAL_ERROR");
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "anonymous"
  );
}

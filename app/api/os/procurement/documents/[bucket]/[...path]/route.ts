import { NextResponse } from "next/server";
import {
  PROCUREMENT_BUCKETS,
  readLocalProcurementFile,
  type ProcurementBucket,
} from "@/lib/os/procurement/server-document-store";

export const runtime = "nodejs";

const ALLOWED_BUCKETS = new Set<string>(Object.values(PROCUREMENT_BUCKETS));

/** Serve local fallback procurement files when Supabase is not configured. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const { bucket: bucketParam, path: pathParts } = await context.params;
  if (!ALLOWED_BUCKETS.has(bucketParam)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 404 });
  }

  const bucket = bucketParam as ProcurementBucket;
  const storagePath = pathParts.map(decodeURIComponent).join("/");
  const buffer = await readLocalProcurementFile(bucket, storagePath);
  if (!buffer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = storagePath.split(".").pop()?.toLowerCase();
  const mimeType =
    ext === "pdf"
      ? "application/pdf"
      : ext === "json"
        ? "application/json"
        : ext === "png"
          ? "image/png"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

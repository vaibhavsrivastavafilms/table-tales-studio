import { NextResponse } from "next/server";
import {
  PROCUREMENT_BUCKETS,
  uploadProcurementFile,
  type ProcurementBucket,
} from "@/lib/os/procurement/server-document-store";

export const runtime = "nodejs";

const ALLOWED_BUCKETS = new Set<string>(Object.values(PROCUREMENT_BUCKETS));

function resolveBucket(value: string | null): ProcurementBucket | null {
  if (!value || !ALLOWED_BUCKETS.has(value)) return null;
  return value as ProcurementBucket;
}

/** POST — upload a procurement document to external storage. */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const bucket = resolveBucket(String(form.get("bucket") ?? PROCUREMENT_BUCKETS.documents));
    const folder = String(form.get("folder") ?? "bills");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!bucket) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    const document = await uploadProcurementFile(file, bucket, folder);
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

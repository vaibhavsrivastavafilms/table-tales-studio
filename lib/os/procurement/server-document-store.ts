import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getOsSession } from "@/lib/os/auth/server";
import type { StoredDocumentRef } from "@/lib/os/procurement/types";

export const PROCUREMENT_BUCKETS = {
  documents: "procurement-documents",
  ocrJson: "ocr-json",
  creditNotes: "credit-notes",
} as const;

export type ProcurementBucket =
  (typeof PROCUREMENT_BUCKETS)[keyof typeof PROCUREMENT_BUCKETS];

const LOCAL_DATA_DIR = path.join(process.cwd(), ".data", "procurement");

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "document";
}

function getPublicStorageUrl(bucket: ProcurementBucket, storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (base) {
    return `${base}/storage/v1/object/public/${bucket}/${storagePath}`;
  }
  return `/api/os/procurement/documents/${bucket}/${encodeURIComponent(storagePath)}`;
}

async function saveLocalFile(
  bucket: ProcurementBucket,
  storagePath: string,
  buffer: Buffer
): Promise<void> {
  const fullPath = path.join(LOCAL_DATA_DIR, bucket, storagePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
}

export async function readLocalProcurementFile(
  bucket: ProcurementBucket,
  storagePath: string
): Promise<Buffer | null> {
  try {
    const fullPath = path.join(LOCAL_DATA_DIR, bucket, storagePath);
    return await readFile(fullPath);
  } catch {
    return null;
  }
}

async function resolveStorageUserFolder(): Promise<string> {
  const session = await getOsSession();
  return session?.userId ?? "anonymous";
}

export async function uploadProcurementBlob(
  bucket: ProcurementBucket,
  buffer: Buffer,
  opts: {
    filename: string;
    mimeType: string;
    folder?: string;
  }
): Promise<StoredDocumentRef> {
  const id = uid("doc");
  const safeName = sanitizeFilename(opts.filename);
  const storagePath = `${opts.folder ?? "uploads"}/${id}_${safeName}`;

  if (isSupabaseConfigured()) {
    const userFolder = await resolveStorageUserFolder();
    const fullPath = `${userFolder}/${storagePath}`;

    const storageClient = await createServerClient();

    const { error } = await storageClient.storage.from(bucket).upload(fullPath, buffer, {
      contentType: opts.mimeType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return {
      id,
      filename: safeName,
      size: buffer.byteLength,
      mimeType: opts.mimeType,
      storageUrl: getPublicStorageUrl(bucket, fullPath),
    };
  }

  await saveLocalFile(bucket, storagePath, buffer);
  return {
    id,
    filename: safeName,
    size: buffer.byteLength,
    mimeType: opts.mimeType,
    storageUrl: getPublicStorageUrl(bucket, storagePath),
  };
}

export async function uploadProcurementJson(
  bucket: ProcurementBucket,
  payload: unknown,
  opts: { filename: string; folder?: string }
): Promise<string> {
  const buffer = Buffer.from(JSON.stringify(payload), "utf-8");
  const ref = await uploadProcurementBlob(bucket, buffer, {
    filename: opts.filename.endsWith(".json") ? opts.filename : `${opts.filename}.json`,
    mimeType: "application/json",
    folder: opts.folder,
  });
  return ref.storageUrl;
}

export async function uploadProcurementFile(
  file: File,
  bucket: ProcurementBucket,
  folder?: string
): Promise<StoredDocumentRef> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadProcurementBlob(bucket, buffer, {
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    folder,
  });
}

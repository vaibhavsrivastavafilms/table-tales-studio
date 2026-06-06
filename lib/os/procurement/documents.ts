import type {
  CreditNote,
  PurchaseBill,
  StoredDocumentRef,
  VendorDocument,
} from "@/lib/os/procurement/types";

export function resolveDocumentUrl(
  doc: StoredDocumentRef | null | undefined
): string | null {
  if (!doc?.storageUrl) return null;
  if (doc.storageUrl.startsWith("data:")) return null;
  return doc.storageUrl;
}

export function resolveBillDocumentUrl(bill: PurchaseBill): string | null {
  return (
    resolveDocumentUrl(bill.document) ??
    (bill.pdfDataUrl?.startsWith("data:") ? null : bill.pdfDataUrl) ??
    (bill.imageDataUrl?.startsWith("data:") ? null : bill.imageDataUrl) ??
    null
  );
}

export function isBillPdf(bill: PurchaseBill): boolean {
  if (bill.document?.mimeType === "application/pdf") return true;
  if (bill.pdfDataUrl && !bill.pdfDataUrl.startsWith("data:")) return true;
  return Boolean(bill.document?.filename?.toLowerCase().endsWith(".pdf"));
}

export function resolveCreditNoteDocumentUrl(note: CreditNote): string | null {
  return (
    resolveDocumentUrl(note.document) ??
    (note.pdfDataUrl?.startsWith("data:") ? null : note.pdfDataUrl) ??
    (note.imageDataUrl?.startsWith("data:") ? null : note.imageDataUrl) ??
    null
  );
}

export function resolveVendorDocumentUrl(doc: VendorDocument): string | null {
  return (
    resolveDocumentUrl(doc.document) ??
    (doc.dataUrl?.startsWith("data:") ? null : doc.dataUrl) ??
    null
  );
}

export async function fetchOcrResult<T>(ocrJsonUrl: string | null): Promise<T | null> {
  if (!ocrJsonUrl || ocrJsonUrl.startsWith("data:")) return null;
  try {
    const res = await fetch(ocrJsonUrl);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

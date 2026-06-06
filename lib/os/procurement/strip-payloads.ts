import type {
  CreditNote,
  ProcurementDb,
  PurchaseBill,
  StoredDocumentRef,
  VendorDocument,
} from "@/lib/os/procurement/types";

const DATA_URL_PREFIX = /^data:/i;
const MAX_INLINE_STRING = 512;

function isEmbeddedPayload(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (DATA_URL_PREFIX.test(value)) return true;
  return value.length > MAX_INLINE_STRING && value.includes("base64");
}

function stripDocumentRef(doc: StoredDocumentRef | null | undefined): StoredDocumentRef | null {
  if (!doc) return null;
  if (isEmbeddedPayload(doc.storageUrl)) return null;
  return doc;
}

export function stripPurchaseBillPayloads(bill: PurchaseBill): PurchaseBill {
  return {
    ...bill,
    document: stripDocumentRef(bill.document),
    ocrJsonUrl: isEmbeddedPayload(bill.ocrJsonUrl) ? null : bill.ocrJsonUrl ?? null,
    imageDataUrl: null,
    pdfDataUrl: null,
    ocrJson: null,
  };
}

export function stripCreditNotePayloads(note: CreditNote): CreditNote {
  return {
    ...note,
    document: stripDocumentRef(note.document),
    ocrJsonUrl: isEmbeddedPayload(note.ocrJsonUrl) ? null : note.ocrJsonUrl ?? null,
    imageDataUrl: null,
    pdfDataUrl: null,
    ocrJson: null,
  };
}

export function stripVendorDocumentPayloads(doc: VendorDocument): VendorDocument {
  return {
    ...doc,
    document: stripDocumentRef(doc.document),
    dataUrl: null,
  };
}

/** Remove all embedded blobs/base64 from procurement state before persisting. */
export function stripEmbeddedPayloads(db: ProcurementDb): ProcurementDb {
  return {
    ...db,
    purchaseBills: db.purchaseBills.map(stripPurchaseBillPayloads),
    creditNotes: db.creditNotes.map(stripCreditNotePayloads),
    vendorDocuments: db.vendorDocuments.map(stripVendorDocumentPayloads),
    vaultDocuments: db.vaultDocuments.map((v) => ({
      ...v,
      dataUrl: isEmbeddedPayload(v.dataUrl) ? null : v.dataUrl,
    })),
  };
}

/** Migrate legacy imageDataUrl/pdfDataUrl into document ref metadata (URL only). */
export function migrateLegacyBillDocuments(bill: PurchaseBill): PurchaseBill {
  let document = bill.document ?? null;

  if (!document) {
    const legacyUrl = bill.pdfDataUrl ?? bill.imageDataUrl;
    if (legacyUrl && !isEmbeddedPayload(legacyUrl)) {
      document = {
        id: `legacy_${bill.id}`,
        filename: bill.pdfDataUrl ? "invoice.pdf" : "invoice.jpg",
        size: 0,
        mimeType: bill.pdfDataUrl ? "application/pdf" : "image/jpeg",
        storageUrl: legacyUrl,
      };
    }
  }

  return stripPurchaseBillPayloads({
    ...bill,
    document,
    ocrJsonUrl:
      bill.ocrJsonUrl ??
      (bill.ocrJson && !isEmbeddedPayload(bill.ocrJson) ? bill.ocrJson : null),
  });
}

export function migrateLegacyProcurementDocuments(db: ProcurementDb): ProcurementDb {
  return stripEmbeddedPayloads({
    ...db,
    purchaseBills: db.purchaseBills.map(migrateLegacyBillDocuments),
    creditNotes: db.creditNotes.map((n) =>
      stripCreditNotePayloads({
        ...n,
        document:
          n.document ??
          (n.pdfDataUrl || n.imageDataUrl
            ? {
                id: `legacy_cn_${n.id}`,
                filename: n.pdfDataUrl ? "credit-note.pdf" : "credit-note.jpg",
                size: 0,
                mimeType: n.pdfDataUrl ? "application/pdf" : "image/jpeg",
                storageUrl: (n.pdfDataUrl ?? n.imageDataUrl)!,
              }
            : null),
        ocrJsonUrl:
          n.ocrJsonUrl ??
          (n.ocrJson && !isEmbeddedPayload(n.ocrJson) ? n.ocrJson : null),
      })
    ),
    vendorDocuments: db.vendorDocuments.map((d) =>
      stripVendorDocumentPayloads({
        ...d,
        document:
          d.document ??
          (d.dataUrl && !isEmbeddedPayload(d.dataUrl)
            ? {
                id: `legacy_vdoc_${d.id}`,
                filename: d.label || "document",
                size: 0,
                mimeType: "application/octet-stream",
                storageUrl: d.dataUrl,
              }
            : null),
      })
    ),
  });
}

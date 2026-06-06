import { NextResponse } from "next/server";
import { OsUnauthorizedError, requireOsApiSession } from "@/lib/os/auth/server";
import { suggestCategory } from "@/lib/os/procurement/categories";
import { extractBillFromFile } from "@/lib/os/procurement/ocr-extract";
import {
  PROCUREMENT_BUCKETS,
  uploadProcurementFile,
  uploadProcurementJson,
} from "@/lib/os/procurement/server-document-store";
import type { OcrBillResult, StoredDocumentRef } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function mockOcr(filename: string): OcrBillResult {
  const taxable = 11850;
  const gst = 600;
  return {
    vendorName: "Amul Dairy (demo — add OPENAI_API_KEY for real OCR)",
    vendorGst: "24AABCA1234F1Z5",
    vendorAddress: "Anand, Gujarat",
    vendorPhone: "+91 98765 43210",
    vendorEmail: "accounts@amul.co.in",
    invoiceNumber: `DEMO-${Date.now().toString().slice(-6)}`,
    invoiceDate: new Date().toISOString().slice(0, 10),
    taxableAmount: taxable,
    gstAmount: gst,
    totalValue: taxable + gst + 150,
    extraCharges: [{ label: "Delivery charges", amount: 150 }],
    items: [
      {
        itemName: "Cheese Mozzarella",
        quantity: 10,
        unit: "kg",
        rate: 420,
        gstPercent: 5,
        amount: 4410,
        suggestedCategory: suggestCategory("Cheese Mozzarella"),
      },
    ],
  };
}

/** Full upload pipeline: store PDF/image → OCR → store OCR JSON → return refs only. */
export async function POST(request: Request) {
  try {
    await requireOsApiSession();
  } catch (error) {
    if (error instanceof OsUnauthorizedError) {
      return NextResponse.json({ error: error.message, source: "error" }, { status: 401 });
    }
    throw error;
  }

  const form = await request.formData();
  const file = form.get("file");
  const filename =
    file instanceof File ? file.name : String(form.get("filename") ?? "bill.jpg");
  const draftBillId = String(form.get("billId") ?? uid("bill"));

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded", source: "error" },
      { status: 400 }
    );
  }

  let document: StoredDocumentRef;
  try {
    document = await uploadProcurementFile(file, PROCUREMENT_BUCKETS.documents, `bills/${draftBillId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document upload failed";
    return NextResponse.json({ error: message, source: "error" }, { status: 500 });
  }

  if (!apiKey) {
    const ocrJsonUrl = await uploadProcurementJson(
      PROCUREMENT_BUCKETS.ocrJson,
      mockOcr(filename),
      { filename: `${draftBillId}.json`, folder: "bills" }
    );
    return NextResponse.json({
      result: mockOcr(filename),
      source: "mock",
      document,
      ocrJsonUrl,
      billId: draftBillId,
      warning:
        "OPENAI_API_KEY is not set — showing demo data. Add your key to .env.local and restart the dev server.",
    });
  }

  try {
    const { result, source, pageCount } = await extractBillFromFile(file, apiKey);
    if (pageCount && pageCount > 1) {
      document = { ...document, pageCount };
    }

    const ocrJsonUrl = await uploadProcurementJson(
      PROCUREMENT_BUCKETS.ocrJson,
      result,
      { filename: `${draftBillId}.json`, folder: "bills" }
    );

    return NextResponse.json({
      result,
      source,
      filename,
      document,
      ocrJsonUrl,
      billId: draftBillId,
      pageCount: pageCount ?? 1,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OCR extraction failed";
    console.error("[procurement/ocr]", message, error);
    return NextResponse.json({ error: message, source: "error", document }, { status: 422 });
  }
}

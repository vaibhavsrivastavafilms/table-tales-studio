import { NextResponse } from "next/server";
import { suggestCategory } from "@/lib/os/procurement/categories";
import { extractBillFromFile } from "@/lib/os/procurement/ocr-extract";
import type { OcrBillResult } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const filename =
    file instanceof File ? file.name : String(form.get("filename") ?? "bill.jpg");

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      result: mockOcr(filename),
      source: "mock",
      warning:
        "OPENAI_API_KEY is not set — showing demo data. Add your key to .env.local and restart the dev server.",
    });
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded", source: "error" },
      { status: 400 }
    );
  }

  try {
    const { result, source } = await extractBillFromFile(file, apiKey);
    return NextResponse.json({ result, source, filename });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OCR extraction failed";
    console.error("[procurement/ocr]", message, error);
    return NextResponse.json({ error: message, source: "error" }, { status: 422 });
  }
}

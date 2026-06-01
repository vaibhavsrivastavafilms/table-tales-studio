import OpenAI from "openai";
import { pdf } from "pdf-to-img";
import { extractText, getDocumentProxy } from "unpdf";
import { applyOcrTotalsToBill } from "@/lib/os/procurement/bill-totals";
import { suggestCategory } from "@/lib/os/procurement/categories";
import type { OcrBillResult } from "@/lib/os/procurement/types";

const EXTRACTION_PROMPT = `You extract Indian supplier PURCHASE INVOICES for restaurant procurement.

CRITICAL — vendorName (seller/supplier who ISSUED the invoice):
- Use the legal supplier name printed with the seller GSTIN (usually header/top of invoice).
- NEVER use: consignee, "Consignment to", "Ship to", "Bill to", "Delivered to", buyer, or the restaurant/customer name as vendorName.
- If only a consignee label is visible, leave vendorName empty string.

Extract the FULL invoice:
- Every product line with quantity > 0 (skip zero-qty and blank rows).
- items: [{ itemName, quantity, unit, rate, gstPercent, amount }] — product lines only

TOTALS (must match the printed invoice footer exactly):
- taxableAmount, gstAmount, totalValue = GRAND TOTAL on the invoice (not the sum of lines you computed)
- If the invoice has freight, delivery, packing, handling, cartage, other charges, round-off, or similar BELOW the item table, put each in extraCharges: [{ label, amount, gstPercent? }]
- totalValue MUST equal the final amount payable on the invoice, including ALL extraCharges and GST

Indian GST context. Return JSON only.`;

const NON_VENDOR_LABELS =
  /^(consignment\s+to|consignee|ship\s+to|bill\s+to|delivered\s+to|buyer|customer)\b/i;

function sanitizeVendorName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || NON_VENDOR_LABELS.test(trimmed)) return "";
  return trimmed;
}

function isUsableTextResult(result: OcrBillResult): boolean {
  return (
    result.items.length >= 1 ||
    Boolean(result.invoiceNumber?.trim()) ||
    result.totalValue > 0
  );
}

function normalizeOcrResult(parsed: OcrBillResult): OcrBillResult {
  parsed.vendorName = sanitizeVendorName(parsed.vendorName ?? "");
  parsed.items = (parsed.items ?? [])
    .filter((item) => item.itemName?.trim() && Number(item.quantity) > 0)
    .map((item) => ({
      ...item,
      unit: item.unit ?? "kg",
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0,
      gstPercent: Number(item.gstPercent) || 0,
      amount: Number(item.amount) || 0,
      suggestedCategory: suggestCategory(item.itemName),
    }));
  const totals = applyOcrTotalsToBill(parsed);
  parsed.totalValue = totals.totalValue;
  parsed.taxableAmount = totals.taxableAmount;
  parsed.gstAmount = totals.gstAmount;
  parsed.extraCharges = totals.extraCharges.map((c) => ({
    label: c.label,
    amount: c.amount,
    gstPercent: c.gstPercent,
  }));
  return parsed;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfDoc = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdfDoc, { mergePages: true });
  return text.replace(/\s+/g, " ").trim();
}

async function pdfPagesAsDataUrls(
  buffer: Buffer,
  maxPages = 3
): Promise<string[]> {
  const urls: string[] = [];
  const document = await pdf(buffer, { scale: 1.5 });
  let page = 0;
  for await (const image of document) {
    urls.push(`data:image/png;base64,${Buffer.from(image).toString("base64")}`);
    page += 1;
    if (page >= maxPages) break;
  }
  return urls;
}

async function extractFromText(
  client: OpenAI,
  text: string
): Promise<OcrBillResult> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      {
        role: "user",
        content: `Invoice text:\n\n${text.slice(0, 80000)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty text extraction response");
  return normalizeOcrResult(JSON.parse(raw) as OcrBillResult);
}

async function extractFromImages(
  client: OpenAI,
  imageUrls: string[]
): Promise<OcrBillResult> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      {
        role: "user",
        content: imageUrls.map((url) => ({
          type: "image_url" as const,
          image_url: { url, detail: "auto" as const },
        })),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty vision response");
  return normalizeOcrResult(JSON.parse(raw) as OcrBillResult);
}

export async function extractBillFromFile(
  file: File,
  apiKey: string
): Promise<{ result: OcrBillResult; source: "openai-text" | "openai-vision" }> {
  const client = new OpenAI({ apiKey });
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || inferMime(file.name);

  if (mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const text = await extractPdfText(buffer);

    // Fast path: text-based PDFs — one API call only (vendor editable on review)
    if (text.length >= 80) {
      const textResult = await extractFromText(client, text);
      if (isUsableTextResult(textResult)) {
        return { result: textResult, source: "openai-text" };
      }
    }

    // Slow fallback: scanned/image PDF — first 3 pages only
    const pageUrls = await pdfPagesAsDataUrls(buffer, 3);
    if (!pageUrls.length) {
      throw new Error("Could not read PDF pages — try a photo of the invoice");
    }
    const result = await extractFromImages(client, pageUrls);
    return { result, source: "openai-vision" };
  }

  if (!mime.startsWith("image/")) {
    throw new Error(`Unsupported file type: ${mime || file.name}`);
  }

  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
  const result = await extractFromImages(client, [dataUrl]);
  return { result, source: "openai-vision" };
}

function inferMime(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

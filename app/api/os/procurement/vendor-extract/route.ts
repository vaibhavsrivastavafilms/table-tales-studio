import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { VendorExtractResult } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

function mockVendor(text: string): VendorExtractResult {
  const gst = text.match(/GST\s*([A-Z0-9]{15})/i)?.[1] ?? null;
  const credit = text.match(/(\d+)\s*days?/i)?.[1];
  const nameMatch = text.match(/vendor\s+([^.,\n]+)/i);
  return {
    name: nameMatch?.[1]?.trim() ?? "New Vendor",
    gstNumber: gst,
    phone: null,
    address: null,
    paymentTermsDays: credit ? Number(credit) : 15,
    invoicePattern: null,
    matchedVendorId: null,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ result: mockVendor(text), source: "mock" });
    }

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract vendor fields from voice/text. Return JSON: name, gstNumber, phone, address, paymentTermsDays (number), invoicePattern.",
        },
        { role: "user", content: text },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ result: mockVendor(text), source: "mock" });
    }

    const parsed = JSON.parse(raw) as VendorExtractResult;
    parsed.matchedVendorId = null;
    return NextResponse.json({ result: parsed, source: "openai" });
  } catch {
    return NextResponse.json({ result: mockVendor(""), source: "mock" });
  }
}

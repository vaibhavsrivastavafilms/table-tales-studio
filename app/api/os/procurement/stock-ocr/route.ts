import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { StockOcrResult } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

function mockStockOcr(kind: "opening" | "closing"): StockOcrResult {
  const today = new Date().toISOString().slice(0, 10);
  return {
    date: today,
    lines: [
      { itemName: "Cheese Mozzarella", quantity: kind === "opening" ? 32 : 30, unit: "kg", matchedItemId: null },
      { itemName: "Paneer Full Fat", quantity: kind === "opening" ? 18 : 16, unit: "kg", matchedItemId: null },
      { itemName: "Tomato", quantity: kind === "opening" ? 8 : 6, unit: "kg", matchedItemId: null },
    ],
  };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = (form.get("kind") === "closing" ? "closing" : "opening") as
      | "opening"
      | "closing";

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey || !(file instanceof File)) {
      return NextResponse.json({ result: mockStockOcr(kind), source: "mock" });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mime = file.type || "image/jpeg";

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract stock sheet rows. Return JSON: date (YYYY-MM-DD), lines array with itemName, quantity, unit.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${base64}` },
            },
            { type: "text", text: `This is ${kind} stock count sheet.` },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ result: mockStockOcr(kind), source: "mock" });
    }

    return NextResponse.json({
      result: JSON.parse(raw) as StockOcrResult,
      source: "openai",
    });
  } catch {
    return NextResponse.json({
      result: mockStockOcr("opening"),
      source: "mock",
    });
  }
}

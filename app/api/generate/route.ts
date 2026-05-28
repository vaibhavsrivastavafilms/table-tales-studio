import OpenAI from "openai";
import { NextResponse } from "next/server";
import { hasOpenAiKey } from "@/lib/env";

export const runtime = "nodejs";

const FALLBACK = {
  hook: "Street food isn't just food, it's emotion.",
  slide1: "Every corner has a story to tell.",
  slide2: "From spicy bites to sweet delights.",
  slide3: "Flavors that bring people together.",
  slide4: "Some meals become memories forever.",
  cta: "Tag your foodie crew & explore your city.",
};

function clampImageCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(3, Math.round(n)));
}

function parseTemplate(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().slice(0, 80);
  }
  return "Street Food";
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", ...FALLBACK },
      { status: 400 }
    );
  }

  const template = parseTemplate(body.template);
  const imageCount = clampImageCount(body.imageCount);

  if (!hasOpenAiKey()) {
    return NextResponse.json(FALLBACK, { status: 200 });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Generate an Instagram food storytelling carousel.

Template style: ${template}

Create:
- 1 hook
- ${imageCount - 2} storytelling slides
- 1 CTA ending

Return ONLY valid JSON with keys: hook, slide1, slide2, slide3, slide4, cta.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as Record<string, string>;

    return NextResponse.json({ ...FALLBACK, ...parsed });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}

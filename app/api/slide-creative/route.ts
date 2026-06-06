import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  clientIp,
  parseJsonBody,
  requireMethod,
} from "@/lib/apiSecurity";
import { hasOpenAiKey } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rateLimit";
import type { SlideMutationSpec } from "@/lib/creativeMutationTypes";

export const runtime = "nodejs";

const METHODS = new Set(["POST"]);

export async function POST(req: Request) {
  const methodDenied = requireMethod(req, METHODS);
  if (methodDenied) return methodDenied;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ hints: null }, { status: parsed.response.status });
  }

  const body = parsed.data;
  const prompt =
    typeof body.prompt === "string" ? body.prompt.slice(0, 500) : "";
  const slideIndex =
    typeof body.slideIndex === "number"
      ? Math.min(6, Math.max(1, Math.floor(body.slideIndex)))
      : 1;
  const caption =
    typeof body.caption === "string" ? body.caption.slice(0, 400) : "";

  if (!prompt.trim()) {
    return NextResponse.json({ hints: null }, { status: 400 });
  }

  const ip = clientIp(req);
  const rate = checkRateLimit(`slide-creative:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ hints: null, skipped: true }, { status: 429 });
  }

  if (!hasOpenAiKey()) {
    return NextResponse.json({ hints: null, proceduralOnly: true });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You refine a single Instagram carousel slide art direction from a short creator prompt.
Return JSON only with optional numeric multipliers (0.5-1.5 range) and tags array.
Fields allowed: doodleDensityMul, typographyScaleMul, overlayIntensityMul, warmthMul, clutterReduction (0-0.5), focalScaleMul, tags (string[]).
Do not rewrite captions. No markdown.`,
        },
        {
          role: "user",
          content: JSON.stringify({ prompt, slideIndex, caption }),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const raw = JSON.parse(text) as Partial<SlideMutationSpec>;
    return NextResponse.json({ hints: raw });
  } catch (err) {
    logger.warn("slide-creative failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ hints: null, proceduralOnly: true });
  }
}

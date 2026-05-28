import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildStoryPrompt } from "@/lib/aiPrompts";
import {
  clientIp,
  parseJsonBody,
  requireMethod,
} from "@/lib/apiSecurity";
import { hasOpenAiKey } from "@/lib/env";
import { logger } from "@/lib/logger";
import { logMonitoring } from "@/lib/monitoring";
import { checkRateLimit } from "@/lib/rateLimit";
import { parseViralMode } from "@/lib/viralHooks";
import {
  clampImageCount,
  parseTemplateName,
  sanitizeCaptions,
} from "@/lib/validation";

export const runtime = "nodejs";

const METHODS = new Set(["POST"]);

const FALLBACK = {
  hook: "Street food isn't just food, it's emotion.",
  slide1: "Every corner has a story to tell.",
  slide2: "From spicy bites to sweet delights.",
  slide3: "Flavors that bring people together.",
  slide4: "Some meals become memories forever.",
  cta: "Tag your foodie crew & explore your city.",
};

export async function POST(req: Request) {
  const methodDenied = requireMethod(req, METHODS);
  if (methodDenied) return methodDenied;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Invalid request", ...FALLBACK },
      { status: parsed.response.status }
    );
  }

  const body = parsed.data;
  const template = parseTemplateName(body.template);
  const imageCount = clampImageCount(body.imageCount);
  const viralMode = parseViralMode(body.viralMode);
  const captionTone =
    typeof body.captionTone === "string"
      ? body.captionTone.slice(0, 40)
      : undefined;

  const ip = clientIp(req);
  const rate = checkRateLimit(`generate:${ip}`, 20, 60_000);
  if (!rate.allowed) {
    logger.warn("generate rate limited", { ip });
    logMonitoring("api_rate_limited", "warn", { route: "generate", ip });
    return NextResponse.json(
      { error: "Too many requests", ...FALLBACK },
      { status: 429 }
    );
  }

  if (!hasOpenAiKey()) {
    return NextResponse.json(FALLBACK, { status: 200 });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = buildStoryPrompt(template, imageCount, {
      viralMode,
      captionTone,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const raw = JSON.parse(text) as Record<string, unknown>;
    const captions = sanitizeCaptions(raw);

    return NextResponse.json({ ...FALLBACK, ...captions });
  } catch (error) {
    logger.error("Generate API error", { error: String(error) });
    logMonitoring("ai_generate_failed", "error", { route: "generate" });
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}

import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  clientIp,
  parseJsonBody,
  requireMethod,
} from "@/lib/apiSecurity";
import {
  AI_DESIGN_MODES,
  type AiDesignModeId,
} from "@/lib/aiDesignModes";

import { hasOpenAiKey } from "@/lib/env";
import { logger } from "@/lib/logger";
import { logMonitoring } from "@/lib/monitoring";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const METHODS = new Set(["POST"]);
const PROMPT_MAX = 4000;

function parseMode(raw: unknown): AiDesignModeId {
  const id = typeof raw === "string" ? raw : "";
  return AI_DESIGN_MODES.some((m) => m.id === id)
    ? (id as AiDesignModeId)
    : "doodle-cafe-story";
}

export async function POST(req: Request) {
  const methodDenied = requireMethod(req, METHODS);
  if (methodDenied) return methodDenied;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json(
      { skipped: true, error: "Invalid request" },
      { status: parsed.response.status }
    );
  }

  const body = parsed.data;
  const prompt =
    typeof body.prompt === "string"
      ? body.prompt.slice(0, PROMPT_MAX)
      : "";
  const slideIndex =
    typeof body.slideIndex === "number"
      ? Math.min(6, Math.max(1, Math.floor(body.slideIndex)))
      : 1;
  const mode = parseMode(body.mode);

  if (!prompt.trim()) {
    return NextResponse.json(
      { skipped: true, error: "Missing prompt" },
      { status: 400 }
    );
  }

  const ip = clientIp(req);
  const rate = checkRateLimit(`ai-design:${ip}`, 12, 60_000);
  if (!rate.allowed) {
    logger.warn("ai-design rate limited", { ip, slideIndex });
    logMonitoring("api_rate_limited", "warn", { route: "ai-design", ip });
    return NextResponse.json(
      { skipped: true, error: "Too many requests" },
      { status: 429 }
    );
  }

  if (!hasOpenAiKey()) {
    return NextResponse.json({ skipped: true, available: false }, { status: 200 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: `${prompt} Slide ${slideIndex}. Mode: ${mode}.`,
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
      output_format: "png",
      n: 1,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { skipped: true, error: "No image returned" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      available: true,
      imageUrl: `data:image/png;base64,${b64}`,
    });
  } catch (err) {
    logger.warn("ai-design generation failed", {
      slideIndex,
      mode,
      message: err instanceof Error ? err.message : "unknown",
    });
    logMonitoring("ai_design_failed", "warn", { slideIndex, mode });
    return NextResponse.json(
      { skipped: true, error: "Generation unavailable" },
      { status: 200 }
    );
  }
}

import OpenAI, { toFile } from "openai";
import { NextResponse } from "next/server";
import {
  clientIp,
  parseJsonBody,
  requireMethod,
} from "@/lib/apiSecurity";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { AI_DESIGN_MODES } from "@/lib/aiDesignModes";
import type { EditorialCompositionKind } from "@/lib/editorialLayouts";
import { hasOpenAiKey } from "@/lib/env";
import { logger } from "@/lib/logger";
import { logMonitoring } from "@/lib/monitoring";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const METHODS = new Set(["POST"]);
const PROMPT_MAX = 4500;
const COMPOSITIONS = new Set<EditorialCompositionKind>([
  "hero",
  "collage",
  "magazine",
  "minimal-editorial",
  "doodle-story",
  "product-stack",
  "floating-ui",
]);

function parseMode(raw: unknown): AiDesignModeId {
  const id = typeof raw === "string" ? raw : "";
  return AI_DESIGN_MODES.some((m) => m.id === id)
    ? (id as AiDesignModeId)
    : "doodle-cafe-story";
}

function parseComposition(raw: unknown): EditorialCompositionKind {
  const c = typeof raw === "string" ? raw : "";
  return COMPOSITIONS.has(c as EditorialCompositionKind)
    ? (c as EditorialCompositionKind)
    : "collage";
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
  const composition = parseComposition(body.composition);
  const imageUrl =
    typeof body.imageUrl === "string" ? body.imageUrl.slice(0, 8_000_000) : "";

  if (!prompt.trim()) {
    return NextResponse.json(
      { skipped: true, error: "Missing prompt" },
      { status: 400 }
    );
  }

  const ip = clientIp(req);
  const rate = checkRateLimit(`ai-redesign:${ip}`, 10, 60_000);
  if (!rate.allowed) {
    logger.warn("ai-redesign rate limited", { ip, slideIndex });
    return NextResponse.json(
      { skipped: true, error: "Too many requests" },
      { status: 429 }
    );
  }

  if (!hasOpenAiKey()) {
    return NextResponse.json({ skipped: true, available: false }, { status: 200 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const editorialPrompt = `${prompt}
Composition: ${composition}. Slide ${slideIndex}. Mode: ${mode}.
Premium editorial food photography — realistic retouch only. Preserve exact dish identity from source. Natural lighting, subtle depth, agency-grade framing. No surreal AI effects, no fantasy food, no readable text, no watermark, no scrapbook clutter.`;

  try {
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) {
      let buffer: Buffer;
      if (imageUrl.startsWith("data:")) {
        const b64 = imageUrl.split(",")[1];
        if (!b64) throw new Error("Invalid data URL");
        buffer = Buffer.from(b64, "base64");
      } else {
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(12_000) });
        if (!imgRes.ok) throw new Error("Could not fetch source image");
        buffer = Buffer.from(await imgRes.arrayBuffer());
      }

      const file = await toFile(buffer, `slide-${slideIndex}.png`, {
        type: "image/png",
      });

      const edit = await client.images.edit({
        model: "gpt-image-1",
        image: file,
        prompt: editorialPrompt,
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
        output_format: "png",
      });

      const b64 = edit.data?.[0]?.b64_json;
      if (b64) {
        return NextResponse.json({
          available: true,
          imageUrl: `data:image/png;base64,${b64}`,
          source: "edit",
        });
      }
    }

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: editorialPrompt,
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
      source: "generate",
    });
  } catch (err) {
    logger.warn("ai-redesign failed", {
      slideIndex,
      mode,
      message: err instanceof Error ? err.message : "unknown",
    });
    logMonitoring("ai_redesign_failed", "warn", { slideIndex, mode });
    return NextResponse.json(
      { skipped: true, error: "Redesign unavailable" },
      { status: 200 }
    );
  }
}

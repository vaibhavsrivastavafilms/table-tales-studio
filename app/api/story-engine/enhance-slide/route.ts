import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  enhanceSlideFromInput,
  mergeAiEnhancedSlide,
} from "@/lib/story-engine/creative-director";
import type { CarouselProject } from "@/lib/story-engine/types";
import {
  clientIp,
  parseJsonBody,
  requireMethod,
} from "@/lib/apiSecurity";
import { hasOpenAiKey } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const METHODS = new Set(["POST"]);

export async function POST(req: Request) {
  const methodDenied = requireMethod(req, METHODS);
  if (methodDenied) return methodDenied;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const body = parsed.data;
  const project = body.project as CarouselProject | undefined;
  const slideId = typeof body.slideId === "string" ? body.slideId : "";
  const instruction =
    typeof body.instruction === "string" ? body.instruction.slice(0, 500) : "";

  if (!project?.slides?.length || !slideId || !instruction.trim()) {
    return NextResponse.json({ error: "project, slideId, instruction required" }, { status: 400 });
  }

  const ip = clientIp(req);
  const rate = checkRateLimit(`story-enhance:${ip}`, 40, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const slide = project.slides.find((s) => s.id === slideId);
  if (!slide) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  let next = enhanceSlideFromInput({ project, slideId, instruction });

  if (hasOpenAiKey()) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Rewrite ONE carousel slide from creator direction. Preserve role "${slide.role}" and story position.
Return JSON: { "headline": "", "body": "", "visualDirection": "" }
Do not change slide role. No markdown.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction,
              framework: project.story.framework,
              hook: project.story.hook,
              current: { headline: slide.headline, body: slide.body },
              visualPlan: slide.visualPlan,
            }),
          },
        ],
      });
      const text = completion.choices[0]?.message?.content ?? "{}";
      const raw = JSON.parse(text) as {
        headline?: string;
        body?: string;
        visualDirection?: string;
      };
      next = mergeAiEnhancedSlide(project, slideId, raw);
    } catch (error) {
      logger.warn("enhance-slide AI fallback", { error: String(error) });
    }
  }

  return NextResponse.json({ project: next });
}

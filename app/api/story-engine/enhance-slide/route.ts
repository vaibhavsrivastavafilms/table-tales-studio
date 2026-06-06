import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  enhanceSlideFromInput,
  mergeAiEnhancedSlide,
} from "@/lib/story-engine/creative-director";
import { enhanceSlideInputSchema } from "@/lib/story-engine/schema";
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

  const validated = enhanceSlideInputSchema.safeParse(parsed.data);
  if (!validated.success) {
    return NextResponse.json({ error: "Invalid project payload" }, { status: 400 });
  }
  const { project, slideId, instruction } = validated.data as {
    project: CarouselProject;
    slideId: string;
    instruction: string;
  };

  const ip = clientIp(req);
  const rate = checkRateLimit(`story-enhance:${ip}`, 40, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const slide = project.slides.find((s) => s.id === slideId);
  if (!slide) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

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
      const next = mergeAiEnhancedSlide(
        project,
        slideId,
        {
          ...raw,
          visualDirection: raw.visualDirection ?? instruction,
        },
        instruction
      );
      return NextResponse.json({ project: next });
    } catch (error) {
      logger.warn("enhance-slide AI fallback", { error: String(error) });
    }
  }

  const next = enhanceSlideFromInput({ project, slideId, instruction });
  return NextResponse.json({ project: next });
}

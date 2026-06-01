import OpenAI from "openai";
import { NextResponse } from "next/server";
import { mergeAiSlideCopy, runStoryEnginePipeline } from "@/lib/story-engine/story-engine";
import { scoreCarouselProject } from "@/lib/story-engine/scoring-engine";
import type { SlideRole, StoryEngineInput } from "@/lib/story-engine/types";
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

  const body = parsed.data as StoryEngineInput & Record<string, unknown>;
  const input: StoryEngineInput = {
    topic: typeof body.topic === "string" ? body.topic.slice(0, 200) : undefined,
    goal: typeof body.goal === "string" ? body.goal.slice(0, 200) : undefined,
    audience: typeof body.audience === "string" ? body.audience.slice(0, 200) : undefined,
    platform: typeof body.platform === "string" ? body.platform.slice(0, 80) : undefined,
    brand: typeof body.brand === "string" ? body.brand.slice(0, 120) : undefined,
    framework: body.framework as StoryEngineInput["framework"],
    templateName:
      typeof body.templateName === "string" ? body.templateName.slice(0, 80) : undefined,
    imageCount:
      typeof body.imageCount === "number" ? Math.min(12, Math.max(1, body.imageCount)) : 6,
    visualSummary:
      typeof body.visualSummary === "string" ? body.visualSummary.slice(0, 600) : undefined,
    viralMode: typeof body.viralMode === "string" ? body.viralMode.slice(0, 40) : undefined,
    captionTone: typeof body.captionTone === "string" ? body.captionTone.slice(0, 40) : undefined,
  };

  const ip = clientIp(req);
  const rate = checkRateLimit(`story-engine:${ip}`, 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const baseline = runStoryEnginePipeline(input);

  if (!hasOpenAiKey()) {
    const project = {
      ...baseline.project,
      score: scoreCarouselProject(baseline.project),
    };
    return NextResponse.json({ project, source: "rules" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a carousel creative director. Given a brief and story framework, return JSON:
{
  "hook": "string",
  "slides": {
    "hook": { "headline": "", "body": "" },
    "problem": { "headline": "", "body": "" },
    "context": { "headline": "", "body": "" },
    "insight": { "headline": "", "body": "" },
    "transformation": { "headline": "", "body": "" },
    "cta": { "headline": "", "body": "" }
  }
}
Keep each slide concise. Instagram carousel. No markdown.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            brief: baseline.steps.brief,
            story: baseline.steps.story,
            visualSummary: input.visualSummary,
            viralMode: input.viralMode,
            captionTone: input.captionTone,
          }),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const raw = JSON.parse(text) as {
      hook?: string;
      slides?: Partial<Record<SlideRole, { headline?: string; body?: string }>>;
    };

    const story = {
      ...baseline.project.story,
      hook: raw.hook?.trim() || baseline.project.story.hook,
    };

    const mergedSlides = mergeAiSlideCopy(
      baseline.project.slides,
      raw.slides ?? {}
    );

    let project = {
      ...baseline.project,
      story,
      slides: mergedSlides,
      updatedAt: new Date().toISOString(),
    };
    project = { ...project, score: scoreCarouselProject(project) };

    return NextResponse.json({ project, source: "openai" });
  } catch (error) {
    logger.error("story-engine generate failed", { error: String(error) });
    const project = {
      ...baseline.project,
      score: scoreCarouselProject(baseline.project),
    };
    return NextResponse.json({ project, source: "rules-fallback" });
  }
}

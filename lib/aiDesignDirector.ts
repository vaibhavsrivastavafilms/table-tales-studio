import {
  cacheKey,
  dataUrlToBlobUrl,
  getCachedOverlayUrl,
  setCachedOverlayUrl,
} from "@/lib/aiDesignCache";
import { buildDoodlePromptBrief } from "@/lib/aiDoodleGenerator";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { planEditorialLayout } from "@/lib/aiEditorialLayout";
import {
  emptySlideDesign,
  type AiSlideDesign,
} from "@/lib/aiOverlayRenderer";
import { composeTypography } from "@/lib/aiTypographyComposer";
import type { Captions } from "@/lib/slides";
import { SLIDE_KEYS } from "@/lib/slides";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type AiDesignPipelineInput = {
  mode: AiDesignModeId;
  captions: Captions;
  analysis: VisualAnalysis;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
  width?: number;
  height?: number;
};

export function buildSlideDesignPlan(
  slideIndex: number,
  caption: string,
  input: AiDesignPipelineInput
): AiSlideDesign {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const layout = planEditorialLayout({
    slideIndex,
    width: w,
    height: h,
    analysis: input.analysis,
    mode: input.mode,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
  });
  const typography = composeTypography({
    caption,
    slideIndex,
    layout,
    mode: input.mode,
    analysis: input.analysis,
  });
  return emptySlideDesign(slideIndex, layout, typography);
}

export async function fetchAiOverlayImage(body: {
  prompt: string;
  slideIndex: number;
  mode: AiDesignModeId;
}): Promise<{ imageUrl: string | null; skipped?: boolean; error?: string }> {
  const res = await fetch("/api/ai-design", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    imageUrl?: string;
    skipped?: boolean;
    error?: string;
  };
  if (!res.ok) {
    return { imageUrl: null, error: data.error ?? "Generation failed" };
  }
  if (data.skipped || !data.imageUrl) {
    return { imageUrl: null, skipped: true, error: data.error };
  }
  return { imageUrl: data.imageUrl };
}

export async function generateSlideOverlay(
  slideIndex: number,
  caption: string,
  input: AiDesignPipelineInput
): Promise<AiSlideDesign> {
  const plan = buildSlideDesignPlan(slideIndex, caption, input);
  const brief = buildDoodlePromptBrief({
    slideIndex,
    caption,
    mode: input.mode,
    analysis: input.analysis,
    layout: plan.layout,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
  });

  const key = cacheKey({
    mode: input.mode,
    slideIndex,
    caption,
    mood: input.analysis.mood ?? input.mood ?? "",
  });
  const cached = getCachedOverlayUrl(key);
  if (cached) {
    return { ...plan, overlayUrl: cached, source: "ai" };
  }

  const result = await fetchAiOverlayImage({
    prompt: brief.overlayPrompt,
    slideIndex,
    mode: input.mode,
  });

  if (!result.imageUrl) {
    return { ...plan, source: "procedural", error: result.error };
  }

  const displayUrl =
    result.imageUrl.startsWith("data:")
      ? dataUrlToBlobUrl(result.imageUrl) ?? result.imageUrl
      : result.imageUrl;

  setCachedOverlayUrl(key, displayUrl);
  return { ...plan, overlayUrl: displayUrl, source: "ai" };
}

export async function runAiDesignPipeline(
  input: AiDesignPipelineInput,
  options?: {
    concurrency?: number;
    onSlide?: (design: AiSlideDesign) => void;
    signal?: AbortSignal;
  }
): Promise<Map<number, AiSlideDesign>> {
  const concurrency = options?.concurrency ?? 2;
  const out = new Map<number, AiSlideDesign>();

  const jobs = SLIDE_KEYS.map((key, i) => ({
    slideIndex: i + 1,
    caption: input.captions[key],
  }));

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < jobs.length) {
      if (options?.signal?.aborted) return;
      const job = jobs[cursor++];
      const design = await generateSlideOverlay(
        job.slideIndex,
        job.caption,
        input
      );
      out.set(job.slideIndex, design);
      options?.onSlide?.(design);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker())
  );
  return out;
}

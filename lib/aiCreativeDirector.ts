import {
  buildSlideDesignPlan,
  generateSlideOverlay,
  runAiDesignPipeline,
  type AiDesignPipelineInput,
} from "@/lib/aiDesignDirector";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { directSlideArt, type SlideArtDirection } from "@/lib/slideArtDirector";
import { SLIDE_KEYS, type Captions } from "@/lib/slides";
import { isDoodleStoryTemplate, type TemplateId } from "@/lib/templates";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type CreativeRenderInput = {
  templateId: TemplateId;
  captions: Captions;
  analysis: VisualAnalysis;
  mode?: AiDesignModeId;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
  width?: number;
  height?: number;
};

export function buildProceduralArtDirections(
  input: CreativeRenderInput
): Map<number, SlideArtDirection> {
  const mode = input.mode ?? "doodle-cafe-story";
  const out = new Map<number, SlideArtDirection>();

  SLIDE_KEYS.forEach((key, i) => {
    const slideIndex = i + 1;
    out.set(
      slideIndex,
      directSlideArt({
        slideIndex,
        caption: input.captions[key],
        templateId: input.templateId,
        analysis: input.analysis,
        mode,
        styleReference: input.styleReference,
        styleVision: input.styleVision,
        mood: input.mood,
        width: input.width,
        height: input.height,
        reveal: 0.35,
      })
    );
  });

  return out;
}

export async function runCreativeRenderPipeline(
  input: CreativeRenderInput,
  options?: {
    concurrency?: number;
    signal?: AbortSignal;
    onSlide?: (direction: SlideArtDirection) => void;
    fetchAiOverlays?: boolean;
  }
): Promise<Map<number, SlideArtDirection>> {
  const mode = input.mode ?? "doodle-cafe-story";
  const procedural = buildProceduralArtDirections({
    ...input,
    mode,
  });

  const fetchAi =
    options?.fetchAiOverlays !== false && isDoodleStoryTemplate(input.templateId);

  if (!fetchAi) {
    for (const [idx] of procedural) {
      const complete = directSlideArt({
        slideIndex: idx,
        caption: input.captions[SLIDE_KEYS[idx - 1]],
        templateId: input.templateId,
        analysis: input.analysis,
        mode,
        styleReference: input.styleReference,
        styleVision: input.styleVision,
        mood: input.mood,
        width: input.width,
        height: input.height,
        reveal: 1,
      });
      procedural.set(idx, complete);
      options?.onSlide?.(complete);
    }
    return procedural;
  }

  const aiInput: AiDesignPipelineInput = {
    mode,
    captions: input.captions,
    analysis: input.analysis,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
    mood: input.mood,
    width: input.width,
    height: input.height,
  };

  for (const [idx, dir] of procedural) {
    const key = SLIDE_KEYS[idx - 1];
    const plan = buildSlideDesignPlan(idx, input.captions[key], aiInput);
    const pending = directSlideArt({
      slideIndex: idx,
      caption: input.captions[key],
      templateId: input.templateId,
      analysis: input.analysis,
      mode,
      styleReference: input.styleReference,
      styleVision: input.styleVision,
      mood: input.mood,
      width: input.width,
      height: input.height,
      aiOverlay: { ...plan, loading: true },
      reveal: dir.reveal,
    });
    procedural.set(idx, pending);
    options?.onSlide?.(pending);
  }

  const aiDesigns = await runAiDesignPipeline(aiInput, {
    concurrency: options?.concurrency ?? 2,
    signal: options?.signal,
    onSlide: (design) => {
      const dir = procedural.get(design.slideIndex);
      if (!dir) return;
      const key = SLIDE_KEYS[design.slideIndex - 1];
      const merged = directSlideArt({
        slideIndex: design.slideIndex,
        caption: input.captions[key],
        templateId: input.templateId,
        analysis: input.analysis,
        mode,
        styleReference: input.styleReference,
        styleVision: input.styleVision,
        mood: input.mood,
        width: input.width,
        height: input.height,
        aiOverlay: design,
        reveal: design.overlayUrl ? 0.85 : dir.reveal,
      });
      procedural.set(design.slideIndex, merged);
      options?.onSlide?.(merged);
    },
  });

  for (const [idx, design] of aiDesigns) {
    if (procedural.get(idx)?.aiOverlay) continue;
    const key = SLIDE_KEYS[idx - 1];
    const merged = directSlideArt({
      slideIndex: idx,
      caption: input.captions[key],
      templateId: input.templateId,
      analysis: input.analysis,
      mode,
      styleReference: input.styleReference,
      styleVision: input.styleVision,
      mood: input.mood,
      width: input.width,
      height: input.height,
      aiOverlay: design,
      reveal: 1,
    });
    procedural.set(idx, merged);
    options?.onSlide?.(merged);
  }

  return procedural;
}

export { generateSlideOverlay };

import {
  buildSlideDesignPlan,
  generateSlideOverlay,
  runAiDesignPipeline,
  type AiDesignPipelineInput,
} from "@/lib/aiDesignDirector";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import {
  runEditorialRedesignPipeline,
  type EditorialRedesignAsset,
} from "@/lib/aiRedesignDirector";
import { applyConsistencyToMap } from "@/lib/creativeConsistency";
import { enrichArtDirectionsWithEditorial } from "@/lib/editorialTransform";
import { hasOpenAiKey } from "@/lib/env";
import { pickEditorialLayout } from "@/lib/editorialLayouts";
import {
  createPipelineTracker,
  withPipelineTimeout,
} from "@/lib/pipelineInstrumentation";
import { directSlideArt, type SlideArtDirection } from "@/lib/slideArtDirector";
import { SLIDE_KEYS, type Captions } from "@/lib/slides";
import { isDoodleStoryTemplate, type TemplateId } from "@/lib/templates";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import type { GenerationStage } from "@/lib/generationStages";

export type CreativeRenderInput = {
  templateId: TemplateId;
  captions: Captions;
  analysis: VisualAnalysis;
  images?: string[];
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

function slideImageUrl(images: string[], index: number): string {
  return (
    images[index] ??
    images[images.length - 1] ??
    images[0] ??
    ""
  );
}

export type PipelineProgressEvent =
  | { type: "stage"; stage: GenerationStage }
  | { type: "slide"; slideIndex: number; state: "generating" | "rendered" };

export async function runCreativeRenderPipeline(
  input: CreativeRenderInput,
  options?: {
    concurrency?: number;
    signal?: AbortSignal;
    onSlide?: (direction: SlideArtDirection) => void;
    onProgress?: (event: PipelineProgressEvent) => void;
    fetchAiOverlays?: boolean;
    fetchEditorialRedesign?: boolean;
  }
): Promise<Map<number, SlideArtDirection>> {
  const tracker = createPipelineTracker(options?.onProgress);
  const mode = input.mode ?? "doodle-cafe-story";
  let procedural = new Map<number, SlideArtDirection>();

  tracker.startPhase("pipeline");
  tracker.emitStage("analyzing");

  try {
    procedural = await withPipelineTimeout(
      "analysis",
      5_000,
      async () => {
        tracker.startPhase("analysis", "buildingNarrative");
        const built = buildProceduralArtDirections({ ...input, mode });
        tracker.completePhase("analysis", "detectingMood");
        return built;
      },
      buildProceduralArtDirections({ ...input, mode })
    );

    tracker.emitStage("artDirecting");
    for (let i = 1; i <= 6; i++) {
      options?.onProgress?.({ type: "slide", slideIndex: i, state: "generating" });
    }

    const hasImages = (input.images?.length ?? 0) > 0;
    const fetchDoodleAi =
      options?.fetchAiOverlays !== false &&
      isDoodleStoryTemplate(input.templateId) &&
      !hasImages;

    if (fetchDoodleAi && !options?.signal?.aborted) {
      tracker.startPhase("doodles", "placingDoodles");
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

      try {
        const aiDesigns = await withPipelineTimeout(
          "doodles",
          20_000,
          () =>
            runAiDesignPipeline(aiInput, {
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
                options?.onProgress?.({
                  type: "slide",
                  slideIndex: design.slideIndex,
                  state: "rendered",
                });
                options?.onSlide?.(merged);
              },
            }),
          new Map()
        );

        for (const [idx, design] of aiDesigns) {
          if (procedural.get(idx)?.aiOverlay?.overlayUrl) continue;
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
        tracker.completePhase("doodles");
      } catch (err) {
        tracker.failPhase("doodles", err instanceof Error ? err.message : "failed");
      }
    } else if (fetchDoodleAi) {
      tracker.skipPhase("doodles", "aborted");
    } else {
      tracker.skipPhase("doodles", hasImages ? "using uploaded photos" : "not doodle template");
    }

    const fetchRedesign =
      options?.fetchEditorialRedesign !== false && hasImages && hasOpenAiKey();

    if (hasImages) {
      const compositions = new Map(
        [...procedural.entries()].map(([idx, dir]) => [
          idx,
          pickEditorialLayout({
            slideIndex: idx,
            width: input.width,
            height: input.height,
            analysis: input.analysis,
            emotional: dir.emotional,
            styleReference: input.styleReference,
            styleVision: input.styleVision,
            templateId: input.templateId,
          }),
        ])
      );
      tracker.emitStage("artDirecting");

      let redesigns: Map<number, EditorialRedesignAsset> | undefined;

      if (fetchRedesign && !options?.signal?.aborted) {
        tracker.startPhase("redesign", "composingSlides");
        const slides = SLIDE_KEYS.map((key, i) => ({
          slideIndex: i + 1,
          caption: input.captions[key],
          imageUrl: slideImageUrl(input.images!, i),
        })).filter((s) => s.imageUrl);

        redesigns = await withPipelineTimeout(
          "redesign",
          20_000,
          () =>
            runEditorialRedesignPipeline(
              slides,
              {
                mode,
                compositions,
                analysis: input.analysis,
                styleReference: input.styleReference,
                styleVision: input.styleVision,
                mood: input.mood,
              },
              {
                concurrency: options?.concurrency ?? 2,
                signal: options?.signal,
              }
            ),
          new Map<number, EditorialRedesignAsset>()
        );
        tracker.completePhase("redesign", "renderingTypography");
      } else {
        tracker.skipPhase(
          "redesign",
          !hasImages
            ? "no images"
            : !hasOpenAiKey()
              ? "OPENAI_API_KEY missing"
              : "disabled"
        );
        tracker.emitStage("composingSlides");
      }

      tracker.startPhase("segmentation", "extractingSubjects");
      tracker.startPhase("editorial", "renderingTypography");
      procedural = await withPipelineTimeout(
        "editorial",
        10_000,
        () =>
          enrichArtDirectionsWithEditorial({
            images: input.images!,
            templateId: input.templateId,
            captions: input.captions,
            analysis: input.analysis,
            mode,
            styleReference: input.styleReference,
            styleVision: input.styleVision,
            mood: input.mood,
            width: input.width,
            height: input.height,
            baseDirections: procedural,
            redesigns,
          }),
        procedural
      );
      tracker.completePhase("segmentation", "composingSlides");
      tracker.completePhase("editorial");

      for (const dir of procedural.values()) {
        options?.onProgress?.({
          type: "slide",
          slideIndex: dir.slideIndex,
          state: "rendered",
        });
        options?.onSlide?.(dir);
      }
    } else {
      tracker.skipPhase("segmentation", "no images");
      tracker.skipPhase("editorial", "no images");
      tracker.skipPhase("redesign", "no images");
    }

    tracker.startPhase("finalize", "finalizing");
    const finalized = applyConsistencyToMap(procedural);
    tracker.completePhase("finalize", "ready");
    tracker.completePhase("pipeline");
    return finalized;
  } catch (err) {
    tracker.failPhase("finalize", err instanceof Error ? err.message : "failed");
    return applyConsistencyToMap(
      procedural.size
        ? procedural
        : buildProceduralArtDirections({ ...input, mode })
    );
  } finally {
    tracker.printSummary();
  }
}

export { generateSlideOverlay } from "@/lib/aiDesignDirector";

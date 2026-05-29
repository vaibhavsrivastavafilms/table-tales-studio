import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { buildEditorialCollage, type CollageComposition } from "@/lib/editorialCollageEngine";
import { pickEditorialLayout, type EditorialLayoutPlan } from "@/lib/editorialLayouts";
import type { EditorialRedesignAsset } from "@/lib/aiRedesignDirector";
import {
  defaultSegmentation,
  segmentSubjectFromImage,
  type SubjectSegmentation,
} from "@/lib/subjectSegmentation";
import { withPipelineTimeout } from "@/lib/pipelineInstrumentation";
import { directSlideArt, type SlideArtDirection } from "@/lib/slideArtDirector";
import type { Captions } from "@/lib/slides";
import { SLIDE_KEYS } from "@/lib/slides";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import type { TemplateId } from "@/lib/templates";
import { composeDynamicTypography, type DynamicTypographyPlan } from "@/lib/aiTypographyEngine";
import { applyCreativeConsistency } from "@/lib/creativeConsistency";

export type EditorialSlideBundle = {
  editorial: EditorialLayoutPlan;
  segmentation: SubjectSegmentation;
  collage: CollageComposition;
  typographyPlan: DynamicTypographyPlan;
  redesign: EditorialRedesignAsset | null;
};

export function mergeArtDirectionWithEditorial(
  base: SlideArtDirection,
  bundle: EditorialSlideBundle
): SlideArtDirection {
  return {
    ...base,
    editorial: bundle.editorial,
    segmentation: bundle.segmentation,
    collage: bundle.collage,
    typographyPlan: bundle.typographyPlan,
    redesign: bundle.redesign,
    composition: {
      ...base.composition,
      motionClass: bundle.collage.parallaxClass,
      layerDepth:
        bundle.editorial.overlapDepth > 2
          ? "stacked"
          : bundle.editorial.overlapDepth > 1
            ? "layered"
            : base.composition.layerDepth,
    },
  };
}

export async function buildEditorialBundle(input: {
  slideIndex: number;
  caption: string;
  imageUrl: string;
  templateId: TemplateId;
  analysis: VisualAnalysis;
  mode?: AiDesignModeId;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
  width?: number;
  height?: number;
  redesign?: EditorialRedesignAsset | null;
}): Promise<EditorialSlideBundle> {
  const w = input.width ?? 320;
  const h = input.height ?? 400;

  const base = directSlideArt({
    slideIndex: input.slideIndex,
    caption: input.caption,
    templateId: input.templateId,
    analysis: input.analysis,
    mode: input.mode,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
    mood: input.mood,
    width: w,
    height: h,
  });

  const editorial = pickEditorialLayout({
    slideIndex: input.slideIndex,
    width: w,
    height: h,
    analysis: input.analysis,
    emotional: base.emotional,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
    templateId: input.templateId,
  });

  const segmentation = input.imageUrl
    ? await withPipelineTimeout(
        `segmentation-slide-${input.slideIndex}`,
        8_000,
        () => segmentSubjectFromImage(input.imageUrl, w, h, 8_000),
        defaultSegmentation(w, h)
      )
    : defaultSegmentation(w, h);

  const redesignUrl =
    input.redesign?.collageUrl ?? input.redesign?.overlayUrl ?? null;

  const collage = buildEditorialCollage({
    imageUrl: input.imageUrl,
    slideIndex: input.slideIndex,
    width: w,
    height: h,
    layout: editorial,
    segmentation,
    analysis: input.analysis,
    redesignUrl,
  });

  const typographyPlan = composeDynamicTypography({
    caption: input.caption,
    slideIndex: input.slideIndex,
    layout: base.layout,
    emotional: base.emotional,
    editorial,
  });

  return {
    editorial,
    segmentation,
    collage,
    typographyPlan,
    redesign: input.redesign ?? null,
  };
}

export async function enrichArtDirectionsWithEditorial(input: {
  images: string[];
  templateId: TemplateId;
  captions: Captions;
  analysis: VisualAnalysis;
  mode?: AiDesignModeId;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
  width?: number;
  height?: number;
  baseDirections: Map<number, SlideArtDirection>;
  redesigns?: Map<number, EditorialRedesignAsset>;
}): Promise<Map<number, SlideArtDirection>> {
  const out = new Map<number, SlideArtDirection>();

  const results = await Promise.allSettled(
    SLIDE_KEYS.map(async (key, i) => {
      const slideIndex = i + 1;
      const base = input.baseDirections.get(slideIndex);
      if (!base) return null;

      const imageUrl =
        input.images[i] ??
        input.images[input.images.length - 1] ??
        input.images[0] ??
        "";

      try {
        const bundle = await buildEditorialBundle({
          slideIndex,
          caption: input.captions[key],
          imageUrl,
          templateId: input.templateId,
          analysis: input.analysis,
          mode: input.mode,
          styleReference: input.styleReference,
          styleVision: input.styleVision,
          mood: input.mood,
          width: input.width,
          height: input.height,
          redesign: input.redesigns?.get(slideIndex) ?? null,
        });

        return {
          slideIndex,
          direction: applyCreativeConsistency(
            mergeArtDirectionWithEditorial(base, bundle)
          ),
        };
      } catch (err) {
        console.warn("[TableTales:pipeline] editorial slide failed", {
          slideIndex,
          message: err instanceof Error ? err.message : "unknown",
        });
        return {
          slideIndex,
          direction: applyCreativeConsistency(base),
        };
      }
    })
  );

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) continue;
    out.set(result.value.slideIndex, result.value.direction);
  }

  for (const [slideIndex, base] of input.baseDirections) {
    if (!out.has(slideIndex)) {
      out.set(slideIndex, applyCreativeConsistency(base));
    }
  }

  return out;
}

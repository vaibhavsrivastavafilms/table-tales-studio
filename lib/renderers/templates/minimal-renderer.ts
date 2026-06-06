import { analyzePhotoComposition } from "@/lib/renderers/photo-composition";
import type {
  DoodleLayer,
  LayoutSelection,
  SlideRenderOutput,
  TemplateRenderInput,
  TypographyPlacement,
} from "@/lib/renderers/types";

const RENDERER_ID = "minimal";

export function renderMinimalSlide(input: TemplateRenderInput): SlideRenderOutput {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const photo = analyzePhotoComposition({
    width: w,
    height: h,
    slideIndex: input.slideIndex,
    analysis: input.analysis,
  });

  const layout: LayoutSelection = {
    id: "minimal-type-only",
    variant: "minimal-type",
    foodSafe: photo.heroBounds,
    captionZone: {
      x: 16,
      y: h - 96,
      width: w - 32,
      height: 80,
    },
  };

  const doodleLayer: DoodleLayer = {
    doodles: [],
    accentColor: "#ffffff",
    strokeColor: "#ffffff",
  };

  const typography: TypographyPlacement = {
    captionZone: layout.captionZone,
    align: "center",
    maxWidth: layout.captionZone.width,
    rotation: 0,
    avoidRects: [photo.heroBounds],
    placementReason: "Minimal type band — photography carries the slide.",
  };

  return {
    templateId: input.templateId,
    rendererId: RENDERER_ID,
    photo,
    layout,
    doodleLayer,
    typography,
    photoTreatment: {
      filter: "contrast(1.05) saturate(1.08)",
      overlayOpacity: 0.42,
      vignetteStrength: 0.35,
      grainOpacity: 0.02,
      bottomGradient:
        "linear-gradient(0deg, rgba(0,0,0,0.82) 0%, transparent 58%)",
    },
    showEdgeSketch: false,
  };
}

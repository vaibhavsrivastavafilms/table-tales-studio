import { analyzePhotoComposition } from "@/lib/renderers/photo-composition";
import type {
  DoodleLayer,
  LayoutSelection,
  PhotoTreatment,
  SlideRenderOutput,
  TemplateRenderInput,
  TypographyPlacement,
} from "@/lib/renderers/types";

const RENDERER_ID = "luxury";
const GOLD = "#c9a227";
const CREAM = "#f5f0e6";

export function renderLuxurySlide(input: TemplateRenderInput): SlideRenderOutput {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const photo = analyzePhotoComposition({
    width: w,
    height: h,
    slideIndex: input.slideIndex,
    analysis: input.analysis,
  });

  const layout: LayoutSelection = {
    id: "luxury-minimal-hero",
    variant: "luxury-minimal",
    foodSafe: photo.heroBounds,
    captionZone: {
      x: 20,
      y: h - 108,
      width: w - 40,
      height: 88,
    },
  };

  const doodleLayer: DoodleLayer = {
    doodles: [
      {
        type: "underline",
        x: 24,
        y: h - 42,
        rotation: 0,
        scale: 1.1,
        opacity: 0.7,
      },
      {
        type: "circle",
        x: photo.heroBounds.x + photo.heroBounds.width - 36,
        y: photo.heroBounds.y + 12,
        rotation: 0,
        scale: 0.65,
        opacity: 0.45,
      },
    ],
    accentColor: GOLD,
    strokeColor: CREAM,
  };

  const typography: TypographyPlacement = {
    captionZone: layout.captionZone,
    align: "center",
    maxWidth: layout.captionZone.width,
    rotation: 0,
    avoidRects: [photo.heroBounds],
    placementReason: "Centered luxury band below hero — food remains the focal centerpiece.",
  };

  return {
    templateId: input.templateId,
    rendererId: RENDERER_ID,
    photo,
    layout,
    doodleLayer,
    typography,
    photoTreatment: {
      filter: "contrast(1.08) saturate(0.92) brightness(0.98)",
      overlayOpacity: 0.28,
      vignetteStrength: 0.42,
      grainOpacity: 0.04,
      topGradient:
        "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 50%)",
      bottomGradient:
        "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 55%)",
      radialFoodGlow: `radial-gradient(ellipse 65% 50% at 50% 42%, transparent 30%, rgba(0,0,0,0.5) 100%)`,
    },
    showEdgeSketch: false,
  };
}

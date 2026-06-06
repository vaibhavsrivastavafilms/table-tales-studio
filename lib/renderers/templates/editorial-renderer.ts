import { analyzePhotoComposition } from "@/lib/renderers/photo-composition";
import type {
  DoodleLayer,
  LayoutSelection,
  SlideRenderOutput,
  TemplateRenderInput,
  TypographyPlacement,
} from "@/lib/renderers/types";

const RENDERER_ID = "editorial";
const ACCENT = "#e8d4b8";
const INK = "#1a1410";

export function renderEditorialSlide(input: TemplateRenderInput): SlideRenderOutput {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const slide = input.slideIndex;
  const photo = analyzePhotoComposition({
    width: w,
    height: h,
    slideIndex: slide,
    analysis: input.analysis,
  });

  const topBand = slide % 2 === 1;
  const captionZone = topBand
    ? { x: 14, y: 14, width: w - 28, height: 100 }
    : { x: 14, y: h - 118, width: w - 28, height: 104 };

  const layout: LayoutSelection = {
    id: topBand ? "editorial-top-type" : "editorial-bottom-type",
    variant: "editorial-band",
    foodSafe: photo.heroBounds,
    captionZone,
    headlineBurstZone: { x: captionZone.x, y: captionZone.y, width: 120, height: 32 },
  };

  const doodleLayer: DoodleLayer = {
    doodles: [
      {
        type: "highlight",
        x: captionZone.x,
        y: captionZone.y + captionZone.height - 12,
        rotation: -2,
        scale: 1,
        opacity: 0.55,
      },
      {
        type: "arrow",
        x: photo.heroBounds.x - 8,
        y: photo.heroCenterY,
        rotation: 90,
        scale: 0.85,
        opacity: 0.75,
      },
      {
        type: "star",
        x: w - 36,
        y: topBand ? h - 40 : 28,
        rotation: 15,
        scale: 0.8,
      },
    ],
    accentColor: ACCENT,
    strokeColor: INK,
  };

  const typography: TypographyPlacement = {
    captionZone,
    align: topBand ? "left" : "left",
    maxWidth: captionZone.width,
    rotation: topBand && slide === 2 ? -1.5 : 0,
    avoidRects: [photo.heroBounds],
    placementReason: "Magazine band — asymmetric type away from food focal.",
  };

  return {
    templateId: input.templateId,
    rendererId: RENDERER_ID,
    photo,
    layout,
    doodleLayer,
    typography,
    photoTreatment: {
      filter: `contrast(${1.12 + input.analysis.streetFoodScore * 0.06}) saturate(${1.05 + input.analysis.warmth * 0.1})`,
      overlayOpacity: 0.35,
      vignetteStrength: 0.38,
      grainOpacity: 0.055,
      topGradient:
        "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 45%)",
      bottomGradient:
        "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 50%)",
    },
    showEdgeSketch: false,
  };
}

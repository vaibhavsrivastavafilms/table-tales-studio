import {
  createBurstNearHeadline,
  placeOnHeroRing,
} from "@/lib/renderers/doodle-elements";
import { analyzePhotoComposition, pointInZone } from "@/lib/renderers/photo-composition";
import type {
  DoodleElement,
  DoodleLayer,
  LayoutSelection,
  PhotoTreatment,
  SlideRenderOutput,
  TemplateRenderInput,
  TypographyPlacement,
} from "@/lib/renderers/types";
import { DOODLE_CAFE_ACCENT, DOODLE_CAFE_CREAM } from "@/lib/doodleCafeLock";

const RENDERER_ID = "doodle-cafe";

export function selectDoodleCafeLayout(
  input: TemplateRenderInput,
  photo: ReturnType<typeof analyzePhotoComposition>
): LayoutSelection {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const slide = input.slideIndex;

  const captionZone =
    slide === 1 || slide === 6
      ? photo.negativeSpaceTop.height > 56
        ? {
            x: 16,
            y: 12,
            width: w - 32,
            height: Math.min(120, photo.negativeSpaceTop.height - 8),
          }
        : {
            x: 12,
            y: h - 128,
            width: w - 24,
            height: 112,
          }
      : {
          x: 12,
          y: h - 132,
          width: w - 24,
          height: 116,
        };

  return {
    id: "doodle-cafe-hero-food",
    variant: "hero-food",
    captionZone,
    headlineBurstZone: {
      x: captionZone.x,
      y: captionZone.y,
      width: captionZone.width * 0.7,
      height: 36,
    },
    foodSafe: photo.heroBounds,
  };
}

export function generateDoodleCafeLayer(
  input: TemplateRenderInput,
  photo: ReturnType<typeof analyzePhotoComposition>,
  layout: LayoutSelection
): DoodleLayer {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const hero = photo.heroBounds;
  const slide = input.slideIndex;
  const doodles: DoodleElement[] = [];

  const ringSlots: Array<{ type: DoodleElement["type"]; scale: number }> = [
    { type: "circle", scale: 1.15 },
    { type: "arrow", scale: 1.05 },
    { type: "scribble", scale: 0.95 },
    { type: "circle", scale: 0.85 },
    { type: "arrow", scale: 1.1 },
    { type: "highlight", scale: 1 },
    { type: "coffee-stain", scale: 0.75 },
    { type: "star", scale: 0.7 },
  ];

  ringSlots.forEach((spec, i) => {
    const pos = placeOnHeroRing(hero, slide, i);
    if (!pointInZone(pos.x + 24, pos.y + 24, hero, 4)) {
      doodles.push({
        type: spec.type,
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        scale: spec.scale,
        opacity: spec.type === "coffee-stain" ? 0.35 : 0.82,
      });
    }
  });

  doodles.push({
    type: "arrow",
    x: hero.x + hero.width * 0.08,
    y: hero.y + hero.height * 0.55,
    rotation: -28,
    scale: 1.2,
    opacity: 0.9,
  });

  doodles.push({
    type: "circle",
    x: hero.x + hero.width * 0.78,
    y: hero.y + hero.height * 0.12,
    rotation: 8,
    scale: 1.25,
    opacity: 0.85,
  });

  if (layout.headlineBurstZone) {
    doodles.push(createBurstNearHeadline(layout.headlineBurstZone, slide));
    doodles.push({
      type: "star",
      x: layout.headlineBurstZone.x + 8,
      y: layout.headlineBurstZone.y + 18,
      rotation: 0,
      scale: 0.65,
    });
  }

  const edgeStains: DoodleElement[] = [
    { type: "coffee-stain", x: 4, y: h * 0.72, rotation: 0, scale: 0.55, opacity: 0.28 },
    { type: "coffee-stain", x: w - 48, y: 24, rotation: 40, scale: 0.45, opacity: 0.22 },
    { type: "scribble", x: w - 80, y: h - 48, rotation: -6, scale: 0.8, opacity: 0.5 },
  ];
  edgeStains.forEach((s) => {
    if (!pointInZone(s.x, s.y, hero, 20)) doodles.push(s);
  });

  return {
    doodles: doodles.slice(0, 14),
    accentColor: DOODLE_CAFE_ACCENT,
    strokeColor: DOODLE_CAFE_CREAM,
  };
}

export function placeDoodleCafeTypography(
  layout: LayoutSelection,
  photo: ReturnType<typeof analyzePhotoComposition>
): TypographyPlacement {
  const z = layout.captionZone;
  return {
    captionZone: z,
    align: "left",
    maxWidth: z.width,
    rotation: 0,
    avoidRects: [photo.heroBounds],
    placementReason:
      "Headline placed in negative space — hero food remains unobstructed.",
  };
}

export function doodleCafePhotoTreatment(
  photo: ReturnType<typeof analyzePhotoComposition>
): PhotoTreatment {
  return {
    filter: `contrast(1.06) saturate(1.12) brightness(1.02)`,
    overlayOpacity: 0.12,
    vignetteStrength: 0.22,
    grainOpacity: 0.028,
    topGradient:
      "linear-gradient(180deg, rgba(18,12,8,0.45) 0%, transparent 42%)",
    bottomGradient:
      "linear-gradient(0deg, rgba(12,8,6,0.55) 0%, transparent 48%)",
    radialFoodGlow: `radial-gradient(ellipse 70% 58% at ${(photo.heroCenterX / 320) * 100}% ${(photo.heroCenterY / 400) * 100}%, transparent 42%, rgba(0,0,0,0.35) 100%)`,
  };
}

export function renderDoodleCafeSlide(input: TemplateRenderInput): SlideRenderOutput {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const photo = analyzePhotoComposition({
    width: w,
    height: h,
    slideIndex: input.slideIndex,
    analysis: input.analysis,
  });
  const layout = selectDoodleCafeLayout(input, photo);
  const doodleLayer = generateDoodleCafeLayer(input, photo, layout);
  const typography = placeDoodleCafeTypography(layout, photo);

  return {
    templateId: input.templateId,
    rendererId: RENDERER_ID,
    photo,
    layout,
    doodleLayer,
    typography,
    photoTreatment: doodleCafePhotoTreatment(photo),
    showEdgeSketch: true,
  };
}

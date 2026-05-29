import type { LayoutRedesign } from "@/lib/layoutRedesignEngine";
import type { EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";

export type HierarchyLayer = {
  id: string;
  zIndex: number;
  opacity: number;
  emphasis: number;
};

export type VisualHierarchy = {
  layers: HierarchyLayer[];
  captionEmphasis: number;
  doodleEmphasis: number;
  photoEmphasis: number;
  focalPoint: { x: number; y: number };
  typeLayers: HierarchyLayer[];
  cutoutEmphasis: number;
};

export function buildVisualHierarchy(
  layout: LayoutRedesign,
  emotional: EmotionalStyleProfile
): VisualHierarchy {
  const focalPoint = {
    x: layout.foodSafe.x + layout.foodSafe.width / 2,
    y: layout.foodSafe.y + layout.foodSafe.height / 2,
  };

  const layers: HierarchyLayer[] = [
    { id: "photo", zIndex: 0, opacity: 1, emphasis: emotional.photoContrast > 1 ? 0.9 : 0.75 },
    { id: "grade", zIndex: 2, opacity: emotional.gradientStrength, emphasis: 0.5 },
    { id: "doodles", zIndex: 16, opacity: emotional.doodleDensity, emphasis: 0.85 },
    { id: "typography", zIndex: 22, opacity: 1, emphasis: emotional.typographyScale },
    { id: "stickers", zIndex: 18, opacity: emotional.stickerEnergy, emphasis: 0.7 },
  ];

  const typeLayers: HierarchyLayer[] = [
    { id: "hero-type", zIndex: 24, opacity: 1, emphasis: emotional.typographyScale * 1.2 },
    { id: "micro-type", zIndex: 23, opacity: 0.75, emphasis: 0.45 },
    { id: "script-type", zIndex: 25, opacity: 0.9, emphasis: 0.65 },
  ];

  return {
    layers,
    captionEmphasis: emotional.typographyScale,
    doodleEmphasis: emotional.doodleDensity,
    photoEmphasis: 1,
    focalPoint,
    typeLayers,
    cutoutEmphasis: layout.variant === "image-hero" ? 1.1 : 0.95,
  };
}

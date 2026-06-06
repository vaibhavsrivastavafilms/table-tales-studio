import type { LayoutZone } from "@/lib/layoutRedesignEngine";
import type { TemplateId } from "@/lib/templates";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

/** Hand-drawn overlay primitives (template renderer). */
export type RendererDoodleType =
  | "arrow"
  | "circle"
  | "underline"
  | "star"
  | "scribble"
  | "coffee-stain"
  | "highlight"
  | "burst"
  | "sparkle"
  | "heart";

export type DoodleElement = {
  type: RendererDoodleType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity?: number;
  strokeWidth?: number;
  label?: string;
};

export type DoodleLayer = {
  doodles: DoodleElement[];
  accentColor: string;
  strokeColor: string;
};

export type PhotoComposition = {
  heroBounds: LayoutZone;
  heroCenterX: number;
  heroCenterY: number;
  negativeSpaceTop: LayoutZone;
  negativeSpaceBottom: LayoutZone;
  backgroundBlurPx: number;
  foodSharpness: number;
  reasoning: string;
};

export type LayoutSelection = {
  id: string;
  variant: "hero-food" | "editorial-band" | "luxury-minimal" | "minimal-type";
  captionZone: LayoutZone;
  headlineBurstZone?: LayoutZone;
  foodSafe: LayoutZone;
};

export type TypographyPlacement = {
  captionZone: LayoutZone;
  align: "left" | "center" | "right";
  maxWidth: number;
  rotation: number;
  avoidRects: LayoutZone[];
  placementReason: string;
};

export type PhotoTreatment = {
  filter: string;
  overlayOpacity: number;
  vignetteStrength: number;
  grainOpacity: number;
  topGradient?: string;
  bottomGradient?: string;
  radialFoodGlow?: string;
};

export type SlideRenderOutput = {
  templateId: TemplateId;
  rendererId: string;
  photo: PhotoComposition;
  layout: LayoutSelection;
  doodleLayer: DoodleLayer;
  typography: TypographyPlacement;
  photoTreatment: PhotoTreatment;
  showEdgeSketch: boolean;
};

export type TemplateRenderInput = {
  templateId: TemplateId;
  slideIndex: number;
  caption: string;
  width?: number;
  height?: number;
  analysis: VisualAnalysis;
  mood?: string;
};

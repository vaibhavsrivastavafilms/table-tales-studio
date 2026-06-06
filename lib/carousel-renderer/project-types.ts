/**
 * Carousel Rendering Engine — canonical project model.
 * Photos stay intact; renderer composes layout + type + miniature doodles.
 */

export const CAROUSEL_WIDTH = 1080;
export const CAROUSEL_HEIGHT = 1350;
export const CAROUSEL_ASPECT = "4:5" as const;

export type CarouselTemplateId =
  | "doodle-cafe"
  | "cozy-coffee"
  | "hidden-gem"
  | "date-night"
  | "luxury-dining"
  | "brunch";

export type LayoutType =
  | "hero-food"
  | "atmosphere"
  | "food-closeup"
  | "drink"
  | "community"
  | "quote"
  | "hero-payoff"
  | "cta-ending";

export type DoodleAssetType =
  | "arrow"
  | "circle"
  | "star"
  | "heart"
  | "steam"
  | "people"
  | "coffee-stain"
  | "light-bulb"
  | "speech-bubble"
  | "scribble"
  | "sparkle";

export type DoodleAsset = {
  id: string;
  type: DoodleAssetType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity?: number;
};

export type RenderSlide = {
  id: string;
  index: number;
  role: string;
  photoId: string;
  photoUrl: string;
  headline: string;
  body: string;
  layout: LayoutType;
  doodles: DoodleAsset[];
  subhead?: string;
  /** Photo intelligence metadata */
  photoConfidence?: number;
  photoReasoning?: string;
};

export type CarouselRenderProject = {
  id: string;
  templateId: CarouselTemplateId;
  theme: string;
  style: string;
  width: number;
  height: number;
  slides: RenderSlide[];
  brandName?: string;
  brandCta?: string;
  location?: string;
  createdAt: string;
};

export type PhotoAssignmentMeta = {
  photoId: string;
  url: string;
  confidence: number;
  reasoning: string;
};

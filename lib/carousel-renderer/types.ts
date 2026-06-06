/**
 * Legacy render document types + re-exports from project-types.
 * Prefer CarouselRenderProject for new integrations.
 */

export {
  CAROUSEL_WIDTH,
  CAROUSEL_HEIGHT,
  CAROUSEL_ASPECT,
  type CarouselTemplateId,
  type LayoutType,
  type DoodleAssetType,
  type DoodleAsset,
  type RenderSlide,
  type CarouselRenderProject,
  type PhotoAssignmentMeta,
} from "@/lib/carousel-renderer/project-types";

import type { DoodleAssetType as DAT } from "@/lib/carousel-renderer/project-types";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type PlacedDoodle = {
  type: DAT;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity?: number;
  variant?: string;
};

export type TypographyHierarchyLevel = "primary" | "secondary" | "tertiary";

export type TypographyBlock = {
  kind: "brush-sticker" | "editorial-lines" | "quote" | "cta" | "brand" | "headline" | "subheadline" | "body";
  hierarchy?: TypographyHierarchyLevel;
  lines: string[];
  zone: Rect;
  align: "left" | "center" | "right";
  color: string;
  backgroundColor?: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: string;
  textTransform?: "uppercase" | "none";
  rotation?: number;
};

export type PhotoLayer = {
  url: string;
  layout: "cover";
  filter: string;
  objectPosition: string;
  vignette: number;
};

export type SlideLayoutSpec = {
  role: string;
  photo: PhotoLayer;
  photoFrame: Rect;
  captionZone: Rect;
  foodSafe: Rect;
  doodleZones: Rect[];
  topScrimHeight: number;
  bottomScrimHeight: number;
  gradientTop?: string;
  gradientBottom?: string;
  compositionPlan?: import("@/lib/carousel-renderer/composition-types").CompositionPlan;
};

export type SlideComposition = {
  index: number;
  role: string;
  layout: SlideLayoutSpec;
  doodles: PlacedDoodle[];
  typography: TypographyBlock[];
  showSlideNumber: boolean;
  showQr?: boolean;
  showPin?: boolean;
  /** Debug: visualize subject anchors + negative space */
  showAnchors?: boolean;
};

export type CarouselSlideJson = {
  index: number;
  role: string;
  photoUrl: string;
  headline: string;
  subhead?: string;
  composition: SlideComposition;
};

export type CarouselDocument = {
  id: string;
  templateId: import("@/lib/carousel-renderer/project-types").CarouselTemplateId;
  templateName: string;
  width: number;
  height: number;
  aspectRatio: "4:5";
  theme?: string;
  slides: CarouselSlideJson[];
  createdAt: string;
};

export type CarouselRenderInput = {
  templateId: import("@/lib/carousel-renderer/project-types").CarouselTemplateId;
  photoUrls: string[];
  captions: string[];
  brandName?: string;
  brandCta?: string;
  location?: string;
};

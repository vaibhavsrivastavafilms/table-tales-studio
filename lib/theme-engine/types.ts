import type {
  OverlayStyle,
  PhotoAsset,
  SlideLayout,
  VisualType,
} from "@/lib/story-engine/types";

/** Supported restaurant story themes (photo-inferred). */
export type RestaurantTheme =
  | "luxury-dining-experience"
  | "hidden-gem"
  | "signature-dish"
  | "chef-craftsmanship"
  | "restaurant-launch"
  | "new-menu-launch"
  | "date-night"
  | "brunch-experience"
  | "coffee-culture"
  | "behind-the-scenes"
  | "local-favorite"
  | "farm-to-table"
  | "restaurant-transformation";

export type ThemeDetection = {
  theme: RestaurantTheme;
  confidence: number;
  reasoning: string;
  cuisine?: string;
  restaurantType?: string;
  mood?: string;
  style?: string;
};

export type PhotoSignals = {
  total: number;
  foodRatio: number;
  drinkRatio: number;
  interiorRatio: number;
  peopleRatio: number;
  detailRatio: number;
  wideRatio: number;
  heroRatio: number;
  avgWarmth: number;
  avgBrightness: number;
  avgHeroPotential: number;
  avgComposition: number;
  dominantCategory: string;
  mood: string;
  style: string;
};

export type ThemeSlideRole = {
  id: string;
  label: string;
  beat: string;
  defaultVisualType: VisualType;
  layout: SlideLayout;
  overlayStyle: OverlayStyle;
  /** Photo category preference for assignment */
  photoCategory?: PhotoAsset["category"];
  visualReasoning: string;
};

export type ThemeFrameworkDefinition = {
  theme: RestaurantTheme;
  name: string;
  description: string;
  copyTone: string;
  promptStrategy: string;
  slideRoles: ThemeSlideRole[];
};

export type ThemeCopyStyle = {
  voice: string;
  adjectives: string[];
  hookPattern: (topic: string) => string;
  ctaVerb: string;
};

export type ThemePipelineResult = {
  detection: ThemeDetection;
  framework: ThemeFrameworkDefinition;
  signals: PhotoSignals;
};

import { getFoodFirstRects } from "@/lib/carousel-renderer/food-first-layout";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import type { LayoutType } from "@/lib/carousel-renderer/project-types";
import type { Rect } from "@/lib/carousel-renderer/types";

export type LayoutPresetDefinition = {
  id: LayoutType;
  name: string;
  role: DoodleCafeSlideRole;
  photoFrame: Rect;
  foodSafe: Rect;
  captionZone: Rect;
  doodleZones: Rect[];
  topScrimHeight: number;
  bottomScrimHeight: number;
  objectPosition: string;
  /** Target % of slide for photo / type / doodles */
  budget: { photo: number; typography: number; doodle: number };
};

const ROLE_TO_LAYOUT: Record<DoodleCafeSlideRole, LayoutType> = {
  "hero-hook": "hero-food",
  atmosphere: "atmosphere",
  "food-steam": "food-closeup",
  drink: "drink",
  "community-cta": "community",
  quote: "quote",
  "hero-payoff": "hero-payoff",
  "brand-end": "cta-ending",
};

export function layoutTypeForRole(role: DoodleCafeSlideRole): LayoutType {
  return ROLE_TO_LAYOUT[role];
}

function presetForRole(role: DoodleCafeSlideRole): LayoutPresetDefinition {
  const rects = getFoodFirstRects(role);
  const layout = layoutTypeForRole(role);
  const budgets: Record<LayoutType, LayoutPresetDefinition["budget"]> = {
    "hero-food": { photo: 0.7, typography: 0.2, doodle: 0.1 },
    atmosphere: { photo: 0.75, typography: 0.15, doodle: 0.1 },
    "food-closeup": { photo: 0.85, typography: 0.05, doodle: 0.1 },
    drink: { photo: 0.8, typography: 0.12, doodle: 0.08 },
    community: { photo: 0.72, typography: 0.18, doodle: 0.1 },
    quote: { photo: 0.78, typography: 0.14, doodle: 0.08 },
    "hero-payoff": { photo: 0.9, typography: 0.08, doodle: 0.02 },
    "cta-ending": { photo: 0.82, typography: 0.14, doodle: 0.04 },
  };

  const names: Record<LayoutType, string> = {
    "hero-food": "HeroFoodLayout",
    atmosphere: "AtmosphereLayout",
    "food-closeup": "FoodCloseupLayout",
    drink: "DrinkLayout",
    community: "CommunityLayout",
    quote: "QuoteLayout",
    "hero-payoff": "HeroPayoffLayout",
    "cta-ending": "CTAEndingLayout",
  };

  return {
    id: layout,
    name: names[layout],
    role,
    photoFrame: rects.photoFrame,
    foodSafe: rects.foodSafe,
    captionZone: rects.captionZone,
    doodleZones: rects.doodleZones,
    topScrimHeight: rects.topScrimHeight,
    bottomScrimHeight: rects.bottomScrimHeight,
    objectPosition:
      layout === "food-closeup" || layout === "hero-payoff" || layout === "drink"
        ? "center center"
        : "center 42%",
    budget: budgets[layout],
  };
}

export const HeroFoodLayout = presetForRole("hero-hook");
export const AtmosphereLayout = presetForRole("atmosphere");
export const FoodCloseupLayout = presetForRole("food-steam");
export const DrinkLayout = presetForRole("drink");
export const CommunityLayout = presetForRole("community-cta");
export const QuoteLayout = presetForRole("quote");
export const HeroPayoffLayout = presetForRole("hero-payoff");
export const CTAEndingLayout = presetForRole("brand-end");

export const LAYOUT_PRESETS: Record<LayoutType, LayoutPresetDefinition> = {
  "hero-food": HeroFoodLayout,
  atmosphere: AtmosphereLayout,
  "food-closeup": FoodCloseupLayout,
  drink: DrinkLayout,
  community: CommunityLayout,
  quote: QuoteLayout,
  "hero-payoff": HeroPayoffLayout,
  "cta-ending": CTAEndingLayout,
};

export function getLayoutPreset(layout: LayoutType): LayoutPresetDefinition {
  return LAYOUT_PRESETS[layout];
}

export function getLayoutPresetByRole(role: DoodleCafeSlideRole): LayoutPresetDefinition {
  return presetForRole(role);
}

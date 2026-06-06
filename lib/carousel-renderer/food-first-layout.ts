import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
} from "@/lib/carousel-renderer/project-types";
import type { Rect } from "@/lib/carousel-renderer/types";
import type { FoodFirstBudget } from "@/lib/carousel-renderer/photo-treatment";

const W = CAROUSEL_WIDTH;
const H = CAROUSEL_HEIGHT;

/** Slide area budgets — photo is hero; doodles + type are marginal. */
export const FOOD_FIRST_BUDGETS: Record<DoodleCafeSlideRole, FoodFirstBudget> = {
  "hero-hook": { photo: 0.75, typography: 0.15, doodle: 0.1 },
  atmosphere: { photo: 0.75, typography: 0.15, doodle: 0.1 },
  "food-steam": { photo: 0.85, typography: 0.05, doodle: 0.1 },
  drink: { photo: 0.8, typography: 0.12, doodle: 0.08 },
  "community-cta": { photo: 0.65, typography: 0.25, doodle: 0.1 },
  quote: { photo: 0.78, typography: 0.14, doodle: 0.08 },
  "hero-payoff": { photo: 0.9, typography: 0.08, doodle: 0.02 },
  "brand-end": { photo: 0.82, typography: 0.14, doodle: 0.04 },
};

export type FoodFirstRects = {
  photoFrame: Rect;
  foodSafe: Rect;
  captionZone: Rect;
  doodleZones: Rect[];
  topScrimHeight: number;
  bottomScrimHeight: number;
};

function typoStrip(
  budget: FoodFirstBudget,
  placement: "top" | "bottom" | "compact-top"
): Rect {
  const h = Math.round(H * budget.typography);
  if (placement === "bottom") {
    return { x: 40, y: H - h - 24, width: W - 80, height: h };
  }
  if (placement === "compact-top") {
    return { x: 40, y: 28, width: W - 80, height: Math.min(h, Math.round(H * 0.06)) };
  }
  return { x: 40, y: 28, width: W - 80, height: h, rotation: -1 };
}

function photoFrameFromBudget(budget: FoodFirstBudget, topReserved: number): Rect {
  const photoH = Math.round(H * budget.photo);
  const y = topReserved;
  return { x: 0, y, width: W, height: Math.min(photoH, H - y - 24) };
}

function marginDoodleZones(food: Rect, side: "bottom" | "corners" | "top-edge"): Rect[] {
  const margin = Math.round(W * 0.1);
  switch (side) {
    case "top-edge":
      return [
        {
          x: food.x + food.width * 0.55,
          y: food.y - 100,
          width: 120,
          height: 90,
        },
        {
          x: food.x + food.width * 0.35,
          y: food.y - 90,
          width: 100,
          height: 80,
        },
      ];
    case "corners":
      return [
        { x: 16, y: food.y + food.height - margin, width: margin, height: margin },
        { x: W - margin - 16, y: food.y + 80, width: margin, height: margin },
        { x: W - margin - 16, y: H - margin - 40, width: margin, height: margin },
      ];
    default:
      return [
        { x: 20, y: H - margin - 48, width: margin + 40, height: margin },
        { x: W - margin - 60, y: H - margin - 80, width: margin, height: margin },
      ];
  }
}

export function getFoodFirstRects(role: DoodleCafeSlideRole): FoodFirstRects {
  const budget = FOOD_FIRST_BUDGETS[role];

  switch (role) {
    case "hero-hook": {
      const captionZone = typoStrip(budget, "top");
      const photoFrame = photoFrameFromBudget(budget, captionZone.y + captionZone.height);
      return {
        photoFrame,
        foodSafe: {
          x: 80,
          y: photoFrame.y + 40,
          width: W - 160,
          height: photoFrame.height - 80,
        },
        captionZone,
        doodleZones: marginDoodleZones(photoFrame, "bottom"),
        topScrimHeight: captionZone.height + 40,
        bottomScrimHeight: Math.round(H * 0.12),
      };
    }
    case "food-steam": {
      const captionZone = typoStrip(budget, "compact-top");
      const photoFrame = { x: 0, y: captionZone.y + captionZone.height, width: W, height: H - captionZone.height - captionZone.y };
      const foodSafe = {
        x: 60,
        y: photoFrame.y + 20,
        width: W - 120,
        height: photoFrame.height - 40,
      };
      return {
        photoFrame,
        foodSafe,
        captionZone,
        doodleZones: marginDoodleZones(foodSafe, "top-edge"),
        topScrimHeight: captionZone.height + 16,
        bottomScrimHeight: 0,
      };
    }
    case "hero-payoff": {
      const captionZone = typoStrip(budget, "bottom");
      const photoFrame = { x: 0, y: 0, width: W, height: H - captionZone.height - 32 };
      const foodSafe = {
        x: 48,
        y: 48,
        width: W - 96,
        height: photoFrame.height - 96,
      };
      return {
        photoFrame,
        foodSafe,
        captionZone,
        doodleZones: [
          { x: W - 100, y: 72, width: 72, height: 72 },
          { x: 24, y: H - captionZone.height - 100, width: 64, height: 64 },
        ],
        topScrimHeight: 0,
        bottomScrimHeight: captionZone.height + 48,
      };
    }
    case "quote": {
      const captionZone = {
        x: 72,
        y: Math.round(H * 0.38),
        width: W - 144,
        height: Math.round(H * budget.typography),
      };
      const photoFrame = { x: 0, y: 0, width: W, height: H };
      return {
        photoFrame,
        foodSafe: { x: 120, y: 200, width: W - 240, height: H - 400 },
        captionZone,
        doodleZones: [
          { x: 48, y: 100, width: 72, height: 88 },
          { x: W - 120, y: 110, width: 72, height: 88 },
          { x: W - 100, y: H - 160, width: 64, height: 64 },
        ],
        topScrimHeight: 120,
        bottomScrimHeight: 120,
      };
    }
    default: {
      const captionZone =
        role === "community-cta" || role === "brand-end"
          ? typoStrip(budget, "bottom")
          : typoStrip(budget, "top");
      const top = role === "community-cta" || role === "brand-end" ? 0 : captionZone.y + captionZone.height;
      const photoFrame =
        role === "community-cta" || role === "brand-end"
          ? { x: 0, y: 0, width: W, height: H - captionZone.height - 28 }
          : photoFrameFromBudget(budget, top);
      const foodSafe = {
        x: 72,
        y: photoFrame.y + (role === "atmosphere" ? 60 : 32),
        width: W - 144,
        height: photoFrame.height - (role === "atmosphere" ? 120 : 64),
      };
      return {
        photoFrame,
        foodSafe,
        captionZone,
        doodleZones: marginDoodleZones(foodSafe, "corners"),
        topScrimHeight: role === "community-cta" || role === "brand-end" ? 0 : captionZone.height + 24,
        bottomScrimHeight:
          role === "community-cta" || role === "brand-end"
            ? captionZone.height + 56
            : Math.round(H * 0.08),
      };
    }
  }
}

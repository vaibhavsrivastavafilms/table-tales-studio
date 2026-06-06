import type { PhotoAsset } from "@/lib/story-engine/types";
import { classifyPhotoSignals } from "@/lib/theme-engine/theme-classifier";
import type {
  PhotoSignals,
  RestaurantTheme,
  ThemeDetection,
} from "@/lib/theme-engine/types";

type ThemeCandidate = {
  theme: RestaurantTheme;
  weight: number;
  reason: string;
};

function scoreCandidates(signals: PhotoSignals): ThemeCandidate[] {
  const s = signals;
  const candidates: ThemeCandidate[] = [];

  if (
    s.drinkRatio >= 0.2 &&
    s.interiorRatio >= 0.15 &&
    s.avgWarmth >= 0.52 &&
    s.avgHeroPotential >= 0.58
  ) {
    candidates.push({
      theme: "luxury-dining-experience",
      weight:
        s.drinkRatio * 2 +
        s.interiorRatio * 1.5 +
        s.avgWarmth * 1.2 +
        s.avgHeroPotential * 1.5,
      reason:
        "Strong drink + interior mix with warm lighting and elevated plating signals premium dining.",
    });
  }

  if (s.drinkRatio >= 0.35 && s.foodRatio < 0.45) {
    candidates.push({
      theme: "coffee-culture",
      weight: s.drinkRatio * 3 + s.avgWarmth * 0.8,
      reason: "Drink-forward set with café ritual energy.",
    });
  }

  if (s.peopleRatio >= 0.3 && s.detailRatio >= 0.1) {
    candidates.push({
      theme: "behind-the-scenes",
      weight: s.peopleRatio * 2.5 + s.detailRatio * 1.2,
      reason: "People and kitchen detail suggest documentary BTS storytelling.",
    });
  }

  if (s.foodRatio >= 0.55 && s.total <= 5 && s.avgHeroPotential >= 0.65) {
    candidates.push({
      theme: "signature-dish",
      weight: s.foodRatio * 2 + s.avgHeroPotential * 2,
      reason: "Food-dominant gallery with hero plating — ideal for a signature dish arc.",
    });
  }

  if (s.peopleRatio >= 0.22 && s.avgWarmth >= 0.55 && s.drinkRatio >= 0.1) {
    candidates.push({
      theme: "date-night",
      weight: s.peopleRatio * 1.8 + s.avgWarmth * 1.5 + s.drinkRatio,
      reason: "Warm tones, people, and drinks align with intimate date-night positioning.",
    });
  }

  if (s.avgBrightness >= 0.58 && s.foodRatio >= 0.35) {
    candidates.push({
      theme: "brunch-experience",
      weight: s.avgBrightness * 2 + s.foodRatio * 1.2,
      reason: "Bright, food-forward imagery fits weekend brunch storytelling.",
    });
  }

  if (s.interiorRatio >= 0.35 && s.foodRatio < 0.35) {
    candidates.push({
      theme: "hidden-gem",
      weight: s.interiorRatio * 2.2,
      reason: "Space-led photos with fewer hero dishes — discovery / hidden gem narrative.",
    });
  }

  if (s.detailRatio >= 0.3 && s.foodRatio >= 0.2) {
    candidates.push({
      theme: "chef-craftsmanship",
      weight: s.detailRatio * 2.5 + s.foodRatio,
      reason: "High detail + food ratio signals chef craft and technique focus.",
    });
  }

  if (s.wideRatio >= 0.2 && s.foodRatio >= 0.25 && s.style !== "premium") {
    candidates.push({
      theme: "farm-to-table",
      weight: s.wideRatio * 2 + s.foodRatio,
      reason: "Wide environmental shots with honest food suggest farm-to-table provenance.",
    });
  }

  if (s.peopleRatio >= 0.2 && s.interiorRatio >= 0.2 && s.style === "documentary") {
    candidates.push({
      theme: "local-favorite",
      weight: s.peopleRatio * 1.5 + s.interiorRatio * 1.5,
      reason: "Neighborhood interior + guest moments — local staple positioning.",
    });
  }

  if (s.foodRatio >= 0.4 && s.total >= 6) {
    candidates.push({
      theme: "new-menu-launch",
      weight: s.foodRatio * 1.5 + s.total * 0.1,
      reason: "Variety of food shots supports a new menu / multiple dish launch.",
    });
  }

  if (s.interiorRatio >= 0.25 && s.detailRatio >= 0.2 && s.avgBrightness < 0.5) {
    candidates.push({
      theme: "restaurant-transformation",
      weight: s.interiorRatio + s.detailRatio * 1.5,
      reason: "Interior + work-in-progress detail suggests renovation or transformation arc.",
    });
  }

  if (s.interiorRatio >= 0.2 && s.peopleRatio >= 0.15 && s.avgHeroPotential >= 0.6) {
    candidates.push({
      theme: "restaurant-launch",
      weight: s.interiorRatio * 1.2 + s.avgHeroPotential,
      reason: "Space + energy mix fits opening / launch milestone storytelling.",
    });
  }

  candidates.push({
    theme: "signature-dish",
    weight: s.foodRatio * 1.2 + 0.3,
    reason: "Default food storytelling when no stronger theme signal dominates.",
  });

  return candidates.sort((a, b) => b.weight - a.weight);
}

function inferCuisine(signals: PhotoSignals): string | undefined {
  if (signals.drinkRatio > 0.35) return "Coffee & beverages";
  if (signals.foodRatio > 0.5 && signals.avgHeroPotential > 0.65) return "Fine dining";
  if (signals.foodRatio > 0.4) return "Contemporary restaurant";
  return undefined;
}

function inferRestaurantType(signals: PhotoSignals, theme: RestaurantTheme): string {
  const map: Partial<Record<RestaurantTheme, string>> = {
    "coffee-culture": "Specialty café",
    "luxury-dining-experience": "Fine dining",
    "hidden-gem": "Independent bistro",
    "local-favorite": "Neighborhood restaurant",
    "brunch-experience": "Brunch café",
    "farm-to-table": "Farm-to-table",
    "chef-craftsmanship": "Chef-driven kitchen",
    "behind-the-scenes": "Full-service kitchen",
    "date-night": "Date-night destination",
    "restaurant-launch": "New opening",
    "new-menu-launch": "Seasonal menu",
    "signature-dish": "Menu-forward",
    "restaurant-transformation": "Renovated concept",
  };
  return map[theme] ?? "Restaurant";
}

/**
 * Detect restaurant story theme from analyzed photos.
 */
export function detectTheme(assets: PhotoAsset[]): ThemeDetection {
  const signals = classifyPhotoSignals(assets);
  if (assets.length === 0) {
    return {
      theme: "signature-dish",
      confidence: 0.5,
      reasoning: "No photos uploaded — defaulting to signature dish framework.",
      mood: "neutral",
      style: "editorial",
    };
  }

  const ranked = scoreCandidates(signals);
  const top = ranked[0]!;
  const second = ranked[1];
  const maxW = top.weight;
  const confidence = second
    ? Math.min(0.98, Math.max(0.62, 0.55 + (top.weight - second.weight) / (maxW + 0.01) * 0.4))
    : Math.min(0.95, 0.7 + top.weight * 0.1);

  return {
    theme: top.theme,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: top.reason,
    cuisine: inferCuisine(signals),
    restaurantType: inferRestaurantType(signals, top.theme),
    mood: signals.mood,
    style: signals.style,
  };
}

export function detectThemeFromUrls(urls: string[]): ThemeDetection {
  const { analyzePhotos } = require("@/lib/story-engine/photo/photo-intelligence") as {
    analyzePhotos: (u: string[]) => { assets: PhotoAsset[] };
  };
  const analysis = analyzePhotos(urls);
  return detectTheme(analysis.assets);
}

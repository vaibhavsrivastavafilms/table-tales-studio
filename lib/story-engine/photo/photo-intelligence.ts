import {
  type PhotoAnalysis,
  type PhotoAsset,
  type PhotoCategory,
  type Slide,
  type VisualPlan,
  type VisualRecommendation,
  type VisualType,
} from "@/lib/story-engine/types";

function photoId(index: number): string {
  return `photo_${index + 1}`;
}

function hashContentKey(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function urlStem(url: string): string {
  try {
    const path = url.split("?")[0] ?? url;
    const base = path.split("/").pop() ?? path;
    return base.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/** Filename / URL hints — avoids tying category to upload index. */
export function inferPhotoCategoryFromUrl(url: string): PhotoCategory | null {
  const stem = urlStem(url);
  if (!stem) return null;

  const rules: { pattern: RegExp; category: PhotoCategory }[] = [
    {
      pattern:
        /milkshake|smoothie|juice|latte|espresso|cappuccino|coffee|drink|cocktail|beer|wine|soda|tea|bubble/,
      category: "drink",
    },
    {
      pattern:
        /people|crowd|friends|guest|community|staff|team|dining-together|patrons/,
      category: "people",
    },
    {
      pattern:
        /interior|inside|dining-room|booth|ambiance|ambience|cafe-room|restaurant-space|wide-shot|patio-view/,
      category: "interior",
    },
    { pattern: /wide|establishing|overview/, category: "wide" },
    {
      pattern:
        /salad|burger|pizza|pasta|bowl|dish|food|steak|dessert|cake|pastry|brunch|plated|fruit/,
      category: "food",
    },
    { pattern: /detail|closeup|close-up|macro|texture/, category: "detail" },
    { pattern: /hero|signature|special|showcase/, category: "hero" },
  ];

  for (const { pattern, category } of rules) {
    if (pattern.test(stem)) return category;
  }
  return null;
}

function visualSignalsFromContent(contentKey: string): {
  heroPotential: number;
  brightness: number;
  warmth: number;
  compositionScore: number;
} {
  const h = hashContentKey(contentKey);
  return {
    heroPotential: 0.42 + (h % 55) / 100,
    brightness: 0.36 + (h % 48) / 100,
    warmth: 0.32 + (h % 65) / 100,
    compositionScore: 0.52 + (h % 42) / 100,
  };
}

/** Mock vision analysis — swap for API later. Scores derive from image identity, not upload order. */
export function analyzePhotos(urls: string[]): PhotoAnalysis {
  const categories: PhotoCategory[] = [
    "food",
    "drink",
    "interior",
    "people",
    "detail",
    "wide",
    "hero",
  ];

  const assets: PhotoAsset[] = urls.map((url, i) => {
    const stem = urlStem(url);
    const contentKey = stem || url;
    const inferred = inferPhotoCategoryFromUrl(url);
    const fallbackHash = hashContentKey(contentKey);
    const category =
      inferred ?? categories[fallbackHash % categories.length];
    const signals = visualSignalsFromContent(contentKey);

    const heroBoost =
      category === "hero" || category === "food" || category === "detail"
        ? 0.06
        : 0;
    const heroPotential = clamp01(signals.heroPotential + heroBoost);
    const brightness = signals.brightness;
    const warmth =
      category === "drink" || category === "food"
        ? clamp01(signals.warmth + 0.04)
        : signals.warmth;
    const compositionScore = signals.compositionScore;

    return {
      id: photoId(i),
      url,
      category,
      heroPotential,
      brightness,
      warmth,
      compositionScore,
      tags: [
        category,
        brightness > 0.55 ? "bright" : "moody",
        inferred ? "filename-hint" : "heuristic",
      ],
    };
  });
  return { assets, analyzedAt: new Date().toISOString() };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function scoreForVisualType(
  asset: PhotoAsset,
  visualType: VisualType
): number {
  const map: Partial<Record<VisualType, (a: PhotoAsset) => number>> = {
    hero: (a) => a.heroPotential * 0.6 + a.compositionScore * 0.4,
    detail: (a) =>
      a.category === "detail" || a.category === "food"
        ? a.compositionScore
        : a.compositionScore * 0.5,
    closeup: (a) =>
      a.category === "food" || a.category === "detail"
        ? a.compositionScore
        : a.compositionScore * 0.45,
    wide: (a) =>
      a.category === "wide" || a.category === "interior"
        ? a.compositionScore
        : a.compositionScore * 0.4,
    "before-after": (a) => a.heroPotential * 0.5 + a.brightness * 0.3,
    reaction: (a) =>
      a.category === "people" ? a.compositionScore : a.compositionScore * 0.35,
    brand: (a) => a.warmth * 0.5 + a.compositionScore * 0.5,
  };
  const fn = map[visualType];
  return fn ? fn(asset) : asset.compositionScore;
}

export function pickBestPhoto(
  assets: PhotoAsset[],
  visualType: VisualType
): { photoId: string; confidence: number; reasoning: string } | null {
  if (assets.length === 0) return null;
  let best = assets[0];
  let bestScore = scoreForVisualType(best, visualType);
  for (const asset of assets.slice(1)) {
    const s = scoreForVisualType(asset, visualType);
    if (s > bestScore) {
      best = asset;
      bestScore = s;
    }
  }
  const confidence = Math.min(0.99, Math.max(0.55, bestScore));
  const reasoning =
    visualType === "hero"
      ? `Strong focal point (${best.category}, hero ${(best.heroPotential * 100).toFixed(0)}%)`
      : `Best match for ${visualType}: ${best.category}, composition ${(best.compositionScore * 100).toFixed(0)}%`;
  return { photoId: best.id, confidence, reasoning };
}

export function enrichVisualPlanWithPhotos(
  slide: Slide,
  assets: PhotoAsset[]
): VisualPlan {
  const pick = pickBestPhoto(assets, slide.visualPlan.visualType);
  if (!pick) return slide.visualPlan;
  return {
    ...slide.visualPlan,
    preferredPhotoId: pick.photoId,
    confidence: pick.confidence,
    reasoning: pick.reasoning,
    photoPreference: assets.find((a) => a.id === pick.photoId)?.url,
  };
}

export function planVisualRecommendations(
  slides: Slide[],
  assets: PhotoAsset[]
): VisualRecommendation[] {
  return slides
    .map((slide) => {
      const pick = pickBestPhoto(assets, slide.visualPlan.visualType);
      if (!pick) return null;
      return {
        slideId: slide.id,
        preferredPhotoId: pick.photoId,
        confidence: pick.confidence,
        reasoning: pick.reasoning,
      };
    })
    .filter((r): r is VisualRecommendation => r !== null);
}

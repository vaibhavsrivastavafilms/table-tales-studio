import type { PhotoAsset } from "@/lib/story-engine/types";
import type { PhotoSignals } from "@/lib/theme-engine/types";

function ratio(count: number, total: number): number {
  return total > 0 ? count / total : 0;
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Aggregate Photo Intelligence metadata into signals for theme detection.
 */
export function classifyPhotoSignals(assets: PhotoAsset[]): PhotoSignals {
  if (assets.length === 0) {
    return {
      total: 0,
      foodRatio: 0,
      drinkRatio: 0,
      interiorRatio: 0,
      peopleRatio: 0,
      detailRatio: 0,
      wideRatio: 0,
      heroRatio: 0,
      avgWarmth: 0.5,
      avgBrightness: 0.5,
      avgHeroPotential: 0.5,
      avgComposition: 0.5,
      dominantCategory: "food",
      mood: "neutral",
      style: "editorial",
    };
  }

  const n = assets.length;
  const count = (cat: PhotoAsset["category"]) =>
    assets.filter((a) => a.category === cat).length;

  const avgWarmth = avg(assets.map((a) => a.warmth));
  const avgBrightness = avg(assets.map((a) => a.brightness));
  const avgHeroPotential = avg(assets.map((a) => a.heroPotential));
  const avgComposition = avg(assets.map((a) => a.compositionScore));

  const categories = [
    "food",
    "drink",
    "interior",
    "people",
    "detail",
    "wide",
    "hero",
  ] as const;
  let dominantCategory = "food";
  let maxCount = 0;
  for (const cat of categories) {
    const c = count(cat);
    if (c > maxCount) {
      maxCount = c;
      dominantCategory = cat;
    }
  }

  let mood = "warm";
  if (avgBrightness > 0.62) mood = "bright";
  else if (avgBrightness < 0.42) mood = "moody";
  if (avgWarmth > 0.58) mood = "intimate";

  let style = "editorial";
  if (avgHeroPotential > 0.72 && avgComposition > 0.65) style = "premium";
  if (count("people") / n > 0.35) style = "documentary";
  if (count("drink") / n > 0.4) style = "lifestyle";

  return {
    total: n,
    foodRatio: ratio(count("food"), n),
    drinkRatio: ratio(count("drink"), n),
    interiorRatio: ratio(count("interior"), n),
    peopleRatio: ratio(count("people"), n),
    detailRatio: ratio(count("detail"), n),
    wideRatio: ratio(count("wide"), n),
    heroRatio: ratio(count("hero"), n),
    avgWarmth,
    avgBrightness,
    avgHeroPotential,
    avgComposition,
    dominantCategory,
    mood,
    style,
  };
}

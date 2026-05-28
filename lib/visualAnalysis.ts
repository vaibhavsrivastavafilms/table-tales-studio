import { isBrowser } from "@/lib/browser";

export type VisualAnalysis = {
  cuisine?: string;
  dishType?: string;
  ambience?: string;
  lighting?: string;
  mood?: string;
  energy?: string;
  platingStyle?: string;
  visualTone?: string;
  luxuryScore: number;
  streetFoodScore: number;
  dominantColors: string[];
  storytellingAngles: string[];
  warmth: number;
  brightness: number;
};

const DEFAULT_ANALYSIS: VisualAnalysis = {
  cuisine: "contemporary",
  dishType: "plated food",
  ambience: "intimate dining",
  lighting: "natural mixed",
  mood: "warm cinematic",
  energy: "balanced",
  platingStyle: "modern",
  visualTone: "rich contrast",
  luxuryScore: 0.45,
  streetFoodScore: 0.35,
  dominantColors: ["#1a1a1a", "#c4a574"],
  storytellingAngles: ["sensory detail", "chef craftsmanship"],
  warmth: 0.55,
  brightness: 0.5,
};

type ColorSample = { r: number; g: number; b: number };

async function sampleImageUrl(url: string): Promise<ColorSample | null> {
  if (!isBrowser()) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n += 1;
        }
        if (!n) {
          resolve(null);
          return;
        }
        resolve({ r: r / n, g: g / n, b: b / n });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function inferFromFilename(name: string): Partial<VisualAnalysis> {
  const lower = name.toLowerCase();
  const hints: Partial<VisualAnalysis> = {};

  if (/pasta|pizza|burger|taco|ramen|biryani|curry|thali/.test(lower)) {
    hints.cuisine = lower.includes("biryani") || lower.includes("curry")
      ? "indian"
      : "comfort";
    hints.dishType = "hearty plate";
  }
  if (/coffee|cafe|latte|espresso/.test(lower)) {
    hints.cuisine = "café";
    hints.dishType = "beverage moment";
    hints.ambience = "cozy café";
  }
  if (/dessert|cake|pastry|sweet/.test(lower)) {
    hints.dishType = "dessert";
    hints.mood = "indulgent";
  }
  if (/street|stall|night|neon/.test(lower)) {
    hints.streetFoodScore = 0.85;
    hints.energy = "high";
  }
  if (/fine|luxury|wine|plated/.test(lower)) {
    hints.luxuryScore = 0.9;
    hints.platingStyle = "fine dining";
  }

  return hints;
}

function scoreFromColor(sample: ColorSample): Partial<VisualAnalysis> {
  const warmth = (sample.r + sample.g * 0.5) / 255;
  const brightness = (sample.r + sample.g + sample.b) / (255 * 3);
  const contrast =
    Math.max(sample.r, sample.g, sample.b) -
    Math.min(sample.r, sample.g, sample.b);

  const luxuryScore = Math.min(
    1,
    warmth * 0.35 + (brightness < 0.45 ? 0.25 : 0) + (contrast > 80 ? 0.2 : 0)
  );
  const streetFoodScore = Math.min(
    1,
    (brightness > 0.55 ? 0.35 : 0) + (sample.r > 180 && sample.g > 120 ? 0.25 : 0) + (contrast > 100 ? 0.2 : 0)
  );

  let lighting = "balanced natural";
  if (brightness < 0.35) lighting = "low-key cinematic";
  else if (brightness > 0.7) lighting = "bright documentary";
  else if (warmth > 0.65) lighting = "warm tungsten";

  let mood = "warm cinematic";
  if (luxuryScore > 0.65) mood = "refined evening";
  if (streetFoodScore > 0.6) mood = "street energy";
  if (brightness < 0.4 && warmth > 0.5) mood = "cozy intimate";

  const hex = `#${[sample.r, sample.g, sample.b]
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("")}`;

  return {
    warmth,
    brightness,
    luxuryScore,
    streetFoodScore,
    lighting,
    mood,
    dominantColors: [hex],
    visualTone: luxuryScore > 0.6 ? "elegant contrast" : "documentary warmth",
  };
}

export function inferCuisine(analysis: VisualAnalysis): string {
  if (analysis.luxuryScore > 0.7) return "fine dining";
  if (analysis.streetFoodScore > 0.65) return "street food";
  if (analysis.cuisine) return analysis.cuisine;
  return "contemporary indian";
}

export function inferMood(analysis: VisualAnalysis): string {
  return analysis.mood ?? "warm cinematic";
}

export function inferRestaurantType(analysis: VisualAnalysis): string {
  if (analysis.luxuryScore > 0.65) return "luxury restaurant";
  if (analysis.streetFoodScore > 0.6) return "street food spot";
  if (analysis.ambience?.includes("café")) return "specialty café";
  return "neighborhood favorite";
}

export function inferStorytellingAngles(analysis: VisualAnalysis): string[] {
  const angles: string[] = [];
  if (analysis.luxuryScore > 0.6) angles.push("luxury experience", "chef craftsmanship");
  if (analysis.streetFoodScore > 0.55) angles.push("hidden gem", "authentic local flavor");
  if (analysis.warmth > 0.6 && analysis.brightness < 0.5) {
    angles.push("monsoon café mood", "comfort food nostalgia");
  }
  if (analysis.energy === "high") angles.push("sensory overload", "late-night cravings");
  if (analysis.brightness < 0.4) angles.push("cinematic dark reveal");
  if (!angles.length) angles.push("founder passion", "sensory detail");
  return [...new Set(angles)].slice(0, 5);
}

export async function analyzeImageSet(
  sources: { url?: string; name?: string }[]
): Promise<VisualAnalysis> {
  if (!sources.length) return { ...DEFAULT_ANALYSIS };

  const merged: VisualAnalysis = { ...DEFAULT_ANALYSIS };
  const samples: ColorSample[] = [];

  for (const src of sources.slice(0, 8)) {
    if (src.name) {
      const hint = inferFromFilename(src.name);
      if (hint.cuisine) merged.cuisine = hint.cuisine;
      if (hint.dishType) merged.dishType = hint.dishType;
      if (hint.ambience) merged.ambience = hint.ambience;
      if (hint.mood) merged.mood = hint.mood;
      if (hint.energy) merged.energy = hint.energy;
      if (hint.platingStyle) merged.platingStyle = hint.platingStyle;
      if (hint.luxuryScore != null) merged.luxuryScore = hint.luxuryScore;
      if (hint.streetFoodScore != null) merged.streetFoodScore = hint.streetFoodScore;
    }
    if (src.url && isBrowser()) {
      const sample = await sampleImageUrl(src.url);
      if (sample) samples.push(sample);
    }
  }

  if (samples.length) {
    const avg = samples.reduce(
      (acc, s) => ({ r: acc.r + s.r, g: acc.g + s.g, b: acc.b + s.b }),
      { r: 0, g: 0, b: 0 }
    );
    const n = samples.length;
    const colorHints = scoreFromColor({
      r: avg.r / n,
      g: avg.g / n,
      b: avg.b / n,
    });
    merged.warmth = colorHints.warmth ?? merged.warmth;
    merged.brightness = colorHints.brightness ?? merged.brightness;
    merged.luxuryScore = colorHints.luxuryScore ?? merged.luxuryScore;
    merged.streetFoodScore = colorHints.streetFoodScore ?? merged.streetFoodScore;
    merged.lighting = colorHints.lighting ?? merged.lighting;
    merged.mood = colorHints.mood ?? merged.mood;
    merged.visualTone = colorHints.visualTone ?? merged.visualTone;
    merged.dominantColors = colorHints.dominantColors ?? merged.dominantColors;
  }

  merged.cuisine = inferCuisine(merged);
  merged.storytellingAngles = inferStorytellingAngles(merged);
  merged.ambience = merged.ambience ?? inferRestaurantType(merged);
  merged.energy =
    merged.streetFoodScore > 0.6
      ? "high"
      : merged.luxuryScore > 0.55
        ? "slow"
        : "balanced";

  return merged;
}

/** Procedural doodle elements — reference-matched white sketch overlays. */

export type DoodleElementType =
  | "steam"
  | "heart"
  | "arrow"
  | "sparkle"
  | "speech"
  | "circle"
  | "human"
  | "underline"
  | "pin";

export type DoodleHumanVariant = "solo" | "duo-sitting" | "table-duo" | "on-rim";

export type DoodleElement = {
  type: DoodleElementType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  label?: string;
  variant?: DoodleHumanVariant;
};

export type DoodleDensity = "airy" | "balanced" | "rich";

const DENSITY_COUNT: Record<DoodleDensity, number> = {
  airy: 3,
  balanced: 5,
  rich: 7,
};

function hash(seed: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Light ambient accents — hero doodles come from reference blueprint. */
export function generateAmbientDoodles(input: {
  slideIndex: number;
  width?: number;
  height?: number;
  density?: DoodleDensity;
}): DoodleElement[] {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const seed = input.slideIndex * 19;
  const count = DENSITY_COUNT[input.density ?? "balanced"];
  const types: DoodleElementType[] = ["sparkle", "heart", "steam", "underline"];
  const out: DoodleElement[] = [];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(hash(seed, i) * types.length)];
    out.push({
      type,
      x: Math.round(hash(seed, i + 1) * (w * 0.75) + w * 0.08),
      y: Math.round(hash(seed, i + 2) * (h * 0.55) + h * 0.12),
      scale: 0.55 + hash(seed, i + 3) * 0.35,
      rotation: (hash(seed, i + 4) - 0.5) * 20,
    });
  }
  return out;
}

/** @deprecated Use reference blueprint hero doodles */
export function generateDoodleElements(input: {
  slideIndex: number;
  width?: number;
  height?: number;
  density?: DoodleDensity;
  seed?: number;
}): DoodleElement[] {
  return generateAmbientDoodles(input);
}

export function generateCafeAccentElements(
  slideIndex: number,
  width = 320,
  height = 400
): DoodleElement[] {
  return generateAmbientDoodles({
    slideIndex,
    width,
    height,
    density: slideIndex % 2 === 0 ? "airy" : "balanced",
  });
}

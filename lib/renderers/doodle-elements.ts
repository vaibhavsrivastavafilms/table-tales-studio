import type { DoodleElement, RendererDoodleType } from "@/lib/renderers/types";

/** SVG viewBox size per doodle type */
export const DOODLE_VIEWBOX: Record<RendererDoodleType, string> = {
  arrow: "0 0 40 40",
  circle: "0 0 48 48",
  underline: "0 0 48 16",
  star: "0 0 32 32",
  scribble: "0 0 56 24",
  "coffee-stain": "0 0 64 64",
  highlight: "0 0 80 24",
  burst: "0 0 48 48",
  sparkle: "0 0 32 32",
  heart: "0 0 36 36",
};

export function doodleSize(type: RendererDoodleType, scale: number): { w: number; h: number } {
  const base: Record<RendererDoodleType, [number, number]> = {
    arrow: [44, 44],
    circle: [56, 48],
    underline: [64, 20],
    star: [28, 28],
    scribble: [72, 28],
    "coffee-stain": [52, 52],
    highlight: [88, 28],
    burst: [40, 40],
    sparkle: [24, 24],
    heart: [32, 32],
  };
  const [bw, bh] = base[type];
  return { w: Math.round(bw * scale), h: Math.round(bh * scale) };
}

function hash(slide: number, i: number): number {
  return Math.sin(slide * 12.9898 + i * 78.233) * 43758.5453 - Math.floor(Math.sin(slide * 12.9898 + i * 78.233) * 43758.5453);
}

/** Place doodle on ring around hero bounds — never on food center. */
export function placeOnHeroRing(
  hero: { x: number; y: number; width: number; height: number },
  slideIndex: number,
  slot: number,
  inset = 0.08
): { x: number; y: number; rotation: number } {
  const angles = [0.75, 0.2, 0.95, 0.35, 0.6, 0.1, 0.85, 0.45];
  const t = angles[(slideIndex + slot) % angles.length] + hash(slideIndex, slot) * 0.12;
  const cx = hero.x + hero.width / 2;
  const cy = hero.y + hero.height / 2;
  const rx = hero.width * (0.52 + inset);
  const ry = hero.height * (0.48 + inset);
  const x = cx + Math.cos(t * Math.PI * 2) * rx - 20;
  const y = cy + Math.sin(t * Math.PI * 2) * ry - 20;
  return {
    x: Math.round(x),
    y: Math.round(y),
    rotation: (t * 360) % 40 - 20,
  };
}

export function createBurstNearHeadline(
  zone: { x: number; y: number; width: number; height: number },
  slideIndex: number
): DoodleElement {
  return {
    type: "burst",
    x: zone.x + zone.width * 0.85,
    y: zone.y + 4,
    rotation: -12 + hash(slideIndex, 9) * 24,
    scale: 0.9 + hash(slideIndex, 10) * 0.25,
    opacity: 0.88,
  };
}

import type { DoodleAssetType } from "@/lib/carousel-renderer/project-types";

export type DoodleSvgMeta = {
  viewBox: string;
  width: number;
  height: number;
  href: string;
};

const BASE = "/assets/doodles";

/** Static SVG assets — decorative overlays only, never replace photos. */
export const DOODLE_SVG_CATALOG: Record<DoodleAssetType, DoodleSvgMeta> = {
  arrow: { viewBox: "0 0 40 40", width: 40, height: 40, href: `${BASE}/arrow.svg` },
  circle: { viewBox: "0 0 56 48", width: 56, height: 48, href: `${BASE}/circle.svg` },
  star: { viewBox: "0 0 32 32", width: 32, height: 32, href: `${BASE}/star.svg` },
  heart: { viewBox: "0 0 36 36", width: 36, height: 36, href: `${BASE}/heart.svg` },
  steam: { viewBox: "0 0 48 48", width: 48, height: 48, href: `${BASE}/steam.svg` },
  people: { viewBox: "0 0 96 72", width: 96, height: 72, href: `${BASE}/people.svg` },
  "coffee-stain": {
    viewBox: "0 0 64 64",
    width: 64,
    height: 64,
    href: `${BASE}/coffee-stain.svg`,
  },
  "light-bulb": {
    viewBox: "0 0 40 56",
    width: 40,
    height: 56,
    href: `${BASE}/light-bulb.svg`,
  },
  "speech-bubble": {
    viewBox: "0 0 72 56",
    width: 72,
    height: 56,
    href: `${BASE}/speech-bubble.svg`,
  },
  scribble: { viewBox: "0 0 72 24", width: 72, height: 24, href: `${BASE}/arrow.svg` },
  sparkle: { viewBox: "0 0 32 32", width: 32, height: 32, href: `${BASE}/star.svg` },
};

export function doodlePixelSize(type: DoodleAssetType, scale: number): { w: number; h: number } {
  const m = DOODLE_SVG_CATALOG[type];
  return { w: Math.round(m.width * scale), h: Math.round(m.height * scale) };
}

export function listDoodleAssetTypes(): DoodleAssetType[] {
  return Object.keys(DOODLE_SVG_CATALOG) as DoodleAssetType[];
}

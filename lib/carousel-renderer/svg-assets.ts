import type { DoodleAssetType } from "@/lib/carousel-renderer/types";

export type SvgAssetDef = {
  viewBox: string;
  width: number;
  height: number;
  paths: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

/** Hand-drawn SVG path library — rendered as overlay, never generative. */
export const SVG_ASSETS: Record<DoodleAssetType, SvgAssetDef> = {
  steam: {
    viewBox: "0 0 48 48",
    width: 48,
    height: 48,
    stroke: "#fffef8",
    strokeWidth: 2,
    paths:
      '<path d="M8 36c0-10 6-18 14-18 4 0 8 3 9 9" fill="none" stroke-linecap="round"/><path d="M26 34c0-11 7-19 15-19 5 0 9 4 10 10" fill="none" stroke-linecap="round"/>',
  },
  arrow: {
    viewBox: "0 0 40 40",
    width: 40,
    height: 40,
    stroke: "#fffef8",
    strokeWidth: 2.2,
    paths:
      '<path d="M4 20h24M24 12l10 8-10 8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  circle: {
    viewBox: "0 0 56 48",
    width: 56,
    height: 48,
    stroke: "#fffef8",
    strokeWidth: 1.8,
    paths:
      '<ellipse cx="28" cy="24" rx="22" ry="16" fill="none" stroke-dasharray="6 5"/>',
  },
  people: {
    viewBox: "0 0 96 72",
    width: 96,
    height: 72,
    stroke: "#fffef8",
    strokeWidth: 1.6,
    paths:
      '<circle cx="28" cy="14" r="7" fill="none"/><path d="M14 58c3-14 10-20 14-20s11 6 14 20" fill="none" stroke-linecap="round"/><circle cx="62" cy="16" r="7" fill="none"/><path d="M48 60c3-14 10-20 14-20s11 6 14 20" fill="none" stroke-linecap="round"/><path d="M8 64h80" opacity="0.4" stroke-linecap="round"/>',
  },
  heart: {
    viewBox: "0 0 36 36",
    width: 36,
    height: 36,
    stroke: "#fffef8",
    strokeWidth: 1.5,
    paths:
      '<path d="M18 30c-7-6-12-10-12-15a6 6 0 0112 0c0 5-5 9-12 15-7-6-12-10-12-15a6 6 0 0112 0c0 6-5 10-12 15z" fill="none"/>',
  },
  star: {
    viewBox: "0 0 32 32",
    width: 32,
    height: 32,
    stroke: "#f4c430",
    strokeWidth: 1.5,
    paths:
      '<path d="M16 2v6M16 26v6M2 16h6M26 16h6M6 6l3 3M23 23l3 3M26 6l-3 3M9 23l-3 3" fill="none" stroke-linecap="round"/>',
  },
  "light-bulb": {
    viewBox: "0 0 40 56",
    width: 40,
    height: 56,
    stroke: "#fffef8",
    strokeWidth: 1.5,
    paths:
      '<path d="M20 4c-8 0-14 6-14 14 0 6 4 10 6 12v6h16v-6c2-2 6-6 6-12 0-8-6-14-14-14z" fill="none"/><path d="M12 40h16" stroke-linecap="round"/><path d="M14 46h12" stroke-linecap="round"/><path d="M8 8l4 4M32 8l-4 4" opacity="0.6" stroke-linecap="round"/>',
  },
  "coffee-stain": {
    viewBox: "0 0 64 64",
    width: 64,
    height: 64,
    stroke: "#fffef8",
    strokeWidth: 1,
    paths:
      '<ellipse cx="32" cy="32" rx="28" ry="26" fill="none" opacity="0.35"/><ellipse cx="32" cy="32" rx="20" ry="18" fill="none" stroke-dasharray="4 6" opacity="0.5"/>',
  },
  "speech-bubble": {
    viewBox: "0 0 72 56",
    width: 72,
    height: 56,
    stroke: "#fffef8",
    strokeWidth: 1.6,
    paths:
      '<path d="M8 8h48a8 8 0 018 8v20a8 8 0 01-8 8H28l-12 12V44H8a8 8 0 01-8-8V16a8 8 0 018-8z" fill="none" stroke-linejoin="round"/>',
  },
  scribble: {
    viewBox: "0 0 72 24",
    width: 72,
    height: 24,
    stroke: "#f4c430",
    strokeWidth: 2.2,
    paths: '<path d="M2 16c12-14 28-18 44-10s18 14 24 6" fill="none" stroke-linecap="round"/>',
  },
  sparkle: {
    viewBox: "0 0 28 28",
    width: 28,
    height: 28,
    stroke: "#f4c430",
    strokeWidth: 1.4,
    paths:
      '<path d="M14 1v4M14 23v4M1 14h4M23 14h4" fill="none" stroke-linecap="round"/>',
  },
};

export function assetSize(type: DoodleAssetType, scale: number): { w: number; h: number } {
  const a = SVG_ASSETS[type];
  return { w: Math.round(a.width * scale), h: Math.round(a.height * scale) };
}

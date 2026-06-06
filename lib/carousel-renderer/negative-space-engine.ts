import { pointInZone } from "@/lib/carousel-renderer/geometry";
import type { RankedNegativeSpace, SubjectAnchors } from "@/lib/carousel-renderer/subject-types";
import type { Rect } from "@/lib/carousel-renderer/types";
import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
} from "@/lib/carousel-renderer/project-types";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";

const W = CAROUSEL_WIDTH;
const H = CAROUSEL_HEIGHT;

const PROTECT_PAD = 28;

function rectsOverlap(a: Rect, b: Rect, pad = PROTECT_PAD): boolean {
  return !(
    a.x + a.width + pad < b.x ||
    b.x + b.width + pad < a.x ||
    a.y + a.height + pad < b.y ||
    b.y + b.height + pad < a.y
  );
}

function protectedRects(anchors: SubjectAnchors): Rect[] {
  const list: Rect[] = [];
  if (anchors.heroDish) list.push(anchors.heroDish);
  if (anchors.secondaryDish) list.push(anchors.secondaryDish);
  if (anchors.drink) list.push(anchors.drink);
  if (anchors.people) list.push(anchors.people);
  if (anchors.garnish) list.push(anchors.garnish);
  return list;
}

function overlapsAny(candidate: Rect, protectedList: Rect[]): boolean {
  return protectedList.some((p) => rectsOverlap(candidate, p));
}

function zoneScore(
  candidate: Rect,
  protectedList: Rect[],
  role: DoodleCafeSlideRole,
  label: string
): number {
  let score = (candidate.width * candidate.height) / (W * H);

  const roleBoost: Partial<Record<string, number>> = {
    "top-left-band": role === "hero-hook" ? 0.22 : 0.08,
    "top-right-band": role === "atmosphere" ? 0.24 : 0.1,
    "top-strip": role === "food-steam" ? 0.28 : 0.12,
    "bottom-left-band": role === "drink" ? 0.2 : 0.1,
    "bottom-band": ["community-cta", "brand-end", "hero-payoff"].includes(role)
      ? 0.26
      : 0.08,
    "left-margin": 0.06,
    "right-margin": 0.06,
  };

  score += roleBoost[label] ?? 0.04;

  for (const p of protectedList) {
    const cx = candidate.x + candidate.width / 2;
    const cy = candidate.y + candidate.height / 2;
    if (pointInZone(cx, cy, p, 0)) score -= 0.35;
  }

  return Math.max(0, Math.min(1, score));
}

const CANDIDATE_ZONES: Array<{ label: string; rect: Rect }> = [
  { label: "top-left-band", rect: { x: 28, y: 24, width: Math.round(W * 0.52), height: Math.round(H * 0.16) } },
  { label: "top-right-band", rect: { x: Math.round(W * 0.46), y: 28, width: Math.round(W * 0.5), height: Math.round(H * 0.16) } },
  { label: "top-strip", rect: { x: 32, y: 20, width: W - 64, height: Math.round(H * 0.07) } },
  { label: "bottom-left-band", rect: { x: 28, y: H - Math.round(H * 0.2), width: Math.round(W * 0.46), height: Math.round(H * 0.18) } },
  { label: "bottom-band", rect: { x: 36, y: H - Math.round(H * 0.22), width: W - 72, height: Math.round(H * 0.2) } },
  { label: "left-margin", rect: { x: 16, y: Math.round(H * 0.22), width: Math.round(W * 0.14), height: Math.round(H * 0.5) } },
  { label: "right-margin", rect: { x: W - Math.round(W * 0.16), y: Math.round(H * 0.18), width: Math.round(W * 0.14), height: Math.round(H * 0.55) } },
  { label: "center-quiet", rect: { x: 64, y: Math.round(H * 0.32), width: W - 128, height: Math.round(H * 0.12) } },
];

/**
 * Find visually quiet zones for typography — never over hero food, drink, or faces.
 */
export function findNegativeSpace(
  anchors: SubjectAnchors,
  role: DoodleCafeSlideRole
): RankedNegativeSpace[] {
  const protectedList = protectedRects(anchors);

  const ranked = CANDIDATE_ZONES.map(({ label, rect }) => {
    const clear = !overlapsAny(rect, protectedList);
    const score = clear ? zoneScore(rect, protectedList, role, label) : zoneScore(rect, protectedList, role, label) * 0.25;
    return { rect, score, label };
  })
    .filter((z) => z.score > 0.05)
    .sort((a, b) => b.score - a.score);

  return ranked;
}

export function pickBestNegativeSpace(
  ranked: RankedNegativeSpace[],
  preferLabels?: string[]
): RankedNegativeSpace | null {
  if (ranked.length === 0) return null;
  if (preferLabels?.length) {
    for (const label of preferLabels) {
      const hit = ranked.find((r) => r.label === label);
      if (hit) return hit;
    }
  }
  return ranked[0] ?? null;
}

export function typographyZoneFromNegative(
  space: RankedNegativeSpace,
  typographyFraction: number
): Rect {
  const maxH = Math.round(H * typographyFraction);
  return {
    x: space.rect.x,
    y: space.rect.y,
    width: space.rect.width,
    height: Math.min(space.rect.height, maxH),
    rotation: space.label.includes("left") ? -1 : space.label.includes("right") ? 1 : 0,
  };
}

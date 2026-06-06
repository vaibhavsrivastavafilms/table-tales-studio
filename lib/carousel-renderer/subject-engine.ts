import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import {
  findNegativeSpace,
  pickBestNegativeSpace,
  typographyZoneFromNegative,
} from "@/lib/carousel-renderer/negative-space-engine";
import type {
  RankedNegativeSpace,
  SubjectAnalysis,
  SubjectAnchors,
} from "@/lib/carousel-renderer/subject-types";
import type { Rect } from "@/lib/carousel-renderer/types";
import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
} from "@/lib/carousel-renderer/project-types";
import type { PhotoAsset } from "@/lib/story-engine/types";

const W = CAROUSEL_WIDTH;
const H = CAROUSEL_HEIGHT;

function clampRect(r: Rect): Rect {
  return {
    x: Math.max(0, Math.min(W - 40, Math.round(r.x))),
    y: Math.max(0, Math.min(H - 40, Math.round(r.y))),
    width: Math.max(40, Math.min(W, Math.round(r.width))),
    height: Math.max(40, Math.min(H, Math.round(r.height))),
  };
}

function unionRect(rects: Rect[]): Rect {
  if (rects.length === 0) return { x: 80, y: 280, width: W - 160, height: 560 };
  const x1 = Math.min(...rects.map((r) => r.x));
  const y1 = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.width));
  const y2 = Math.max(...rects.map((r) => r.y + r.height));
  return clampRect({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });
}

function objectPositionFromRect(r: Rect): string {
  const cx = ((r.x + r.width / 2) / W) * 100;
  const cy = ((r.y + r.height / 2) / H) * 100;
  return `${cx.toFixed(1)}% ${cy.toFixed(1)}%`;
}

function scaleRect(base: Rect, scale: number, offsetX = 0, offsetY = 0): Rect {
  return clampRect({
    x: base.x + offsetX,
    y: base.y + offsetY,
    width: base.width * scale,
    height: base.height * scale,
  });
}

/** Base anchor geometry before photo metadata refinement. */
function baseAnchorsForRole(role: DoodleCafeSlideRole): SubjectAnchors {
  const heroDish: Rect = { x: 120, y: 320, width: W - 240, height: 580 };
  const table: Rect = { x: 40, y: H - 280, width: W - 80, height: 220 };
  const drink: Rect = { x: 240, y: 280, width: 420, height: 520 };
  const people: Rect = { x: 80, y: 420, width: 360, height: 480 };
  const interior: Rect = { x: 0, y: 180, width: W, height: H - 200 };

  switch (role) {
    case "food-steam":
    case "hero-payoff":
      return { heroDish: { x: 72, y: 180, width: W - 144, height: 820 }, garnish: scaleRect(heroDish, 0.22, 40, -60), table };
    case "drink":
      return { drink, heroDish: scaleRect(drink, 0.45, -80, 120), table };
    case "atmosphere":
      return { interior, people: { x: W - 340, y: 380, width: 300, height: 420 }, table };
    case "community-cta":
      return { people: { x: 60, y: 360, width: W - 120, height: 520 }, table, heroDish: scaleRect(heroDish, 0.55, 200, 200) };
    case "quote":
      return { interior, heroDish: scaleRect(heroDish, 0.5, 0, 80) };
    case "brand-end":
      return { heroDish, table, logoArea: { x: W / 2 - 120, y: H - 200, width: 240, height: 120 } };
    default:
      return {
        heroDish,
        secondaryDish: scaleRect(heroDish, 0.35, -100, 80),
        garnish: scaleRect(heroDish, 0.18, 60, -40),
        table,
        drink: scaleRect(drink, 0.4, 180, 0),
      };
  }
}

/** Refine anchors from PhotoAsset category + scores. */
function refineAnchorsFromAsset(
  anchors: SubjectAnchors,
  asset: PhotoAsset,
  role: DoodleCafeSlideRole
): SubjectAnchors {
  const shiftX = (asset.compositionScore - 0.5) * 48;
  const shiftY = (asset.heroPotential - 0.5) * 56;
  const out = { ...anchors };

  const nudge = (r?: Rect): Rect | undefined =>
    r
      ? clampRect({
          ...r,
          x: r.x + shiftX,
          y: r.y + shiftY,
        })
      : undefined;

  Object.keys(out).forEach((key) => {
    const k = key as keyof SubjectAnchors;
    if (out[k]) out[k] = nudge(out[k]);
  });

  switch (asset.category) {
    case "drink":
      out.drink = out.drink ?? { x: 260, y: 260, width: 400, height: 560 };
      out.heroDish = out.heroDish ?? scaleRect(out.drink, 0.5, -60, 140);
      break;
    case "people":
      out.people = out.people ?? { x: 100, y: 400, width: 400, height: 500 };
      break;
    case "interior":
    case "wide":
      out.interior = out.interior ?? { x: 0, y: 160, width: W, height: H - 180 };
      out.heroDish = out.heroDish ?? scaleRect(out.interior, 0.45, 120, 200);
      break;
    case "detail":
      out.garnish = out.garnish ?? scaleRect(out.heroDish ?? baseAnchorsForRole(role).heroDish!, 0.25, 80, -80);
      break;
    case "food":
    case "hero":
      out.heroDish = out.heroDish ?? baseAnchorsForRole(role).heroDish;
      if (asset.heroPotential > 0.72) {
        out.heroDish = clampRect({
          ...out.heroDish!,
          width: Math.min(W - 100, out.heroDish!.width * 1.05),
          height: Math.min(H - 200, out.heroDish!.height * 1.05),
        });
      }
      break;
    default:
      break;
  }

  if (!out.table) {
    out.table = { x: 32, y: H - 260, width: W - 64, height: 200 };
  }

  return out;
}

/**
 * Photo Intelligence → semantic subject analysis.
 * Mock-heuristic today; merge with Gemini Vision via detectSubjectsWithGemini().
 */
export function analyzeSubjectsFromAsset(
  asset: PhotoAsset | null | undefined,
  role: DoodleCafeSlideRole
): SubjectAnalysis {
  const reasoning: string[] = [];
  let anchors = baseAnchorsForRole(role);

  if (asset) {
    anchors = refineAnchorsFromAsset(anchors, asset, role);
    reasoning.push(
      `Category ${asset.category} · hero ${(asset.heroPotential * 100).toFixed(0)}% · composition ${(asset.compositionScore * 100).toFixed(0)}%`
    );
    if (asset.tags.includes("bright")) reasoning.push("Bright frame — prefer top negative space for type");
    if (asset.tags.includes("moody")) reasoning.push("Moody frame — prefer bottom/side negative bands");
  } else {
    reasoning.push("No PhotoAsset — using role-default subject anchors");
  }

  const negativeSpace = findNegativeSpace(anchors, role);
  if (negativeSpace[0]) {
    reasoning.push(`Typography prefers ${negativeSpace[0].label} (score ${negativeSpace[0].score.toFixed(2)})`);
  }

  const protectedParts = [
    anchors.heroDish,
    anchors.drink,
    anchors.people,
    anchors.secondaryDish,
  ].filter((r): r is Rect => Boolean(r));

  const protectedRegion = unionRect(protectedParts.length ? protectedParts : [anchors.heroDish!]);
  const hero = anchors.heroDish ?? anchors.drink ?? anchors.interior ?? protectedRegion;

  return {
    anchors,
    negativeSpace,
    confidence: asset ? Math.min(0.95, 0.55 + asset.compositionScore * 0.35) : 0.5,
    reasoning,
    protectedRegion,
    objectPosition: objectPositionFromRect(hero),
  };
}

export { findNegativeSpace, pickBestNegativeSpace, typographyZoneFromNegative };

export type TypographyZonePrefs = {
  typographyFraction: number;
  preferLabels?: string[];
};

/** Best typography band from ranked negative space. */
export function resolveTypographyZones(
  subjects: SubjectAnalysis,
  prefs: TypographyZonePrefs
): {
  textZone: Rect;
  primaryTextZone: Rect;
  secondaryTextZone?: Rect;
} {
  const best = pickBestNegativeSpace(subjects.negativeSpace, prefs.preferLabels);
  const fallback: RankedNegativeSpace = {
    rect: { x: 36, y: 32, width: W - 72, height: Math.round(H * prefs.typographyFraction) },
    score: 0.5,
    label: "top-left-band",
  };
  const space = best ?? fallback;
  const textZone = typographyZoneFromNegative(space, prefs.typographyFraction);
  const primaryH = Math.round(textZone.height * 0.62);
  return {
    textZone,
    primaryTextZone: { ...textZone, height: primaryH },
    secondaryTextZone: {
      x: textZone.x,
      y: textZone.y + primaryH + 6,
      width: textZone.width,
      height: textZone.height - primaryH - 6,
    },
  };
}

/** Primary semantic subject for a slide role. */
export function primarySubjectForRole(
  anchors: SubjectAnchors,
  role: DoodleCafeSlideRole
): Rect {
  switch (role) {
    case "drink":
      return anchors.drink ?? anchors.heroDish ?? anchors.table!;
    case "atmosphere":
      return anchors.interior ?? anchors.people ?? anchors.heroDish!;
    case "community-cta":
      return anchors.people ?? anchors.table ?? anchors.heroDish!;
    case "food-steam":
    case "hero-payoff":
    case "hero-hook":
      return anchors.heroDish ?? anchors.secondaryDish!;
    default:
      return anchors.heroDish ?? anchors.drink ?? anchors.interior!;
  }
}

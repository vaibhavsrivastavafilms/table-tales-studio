import type { CompositionPlan, NarrativeDoodleSpec } from "@/lib/carousel-renderer/composition-types";
import { pointInZone } from "@/lib/carousel-renderer/geometry";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import type { PlacedDoodle, Rect } from "@/lib/carousel-renderer/types";

const MINI_SCALE = 0.38;
const MAX_MINI_SCALE = 0.58;

function clampScale(scale: number): number {
  return Math.min(MAX_MINI_SCALE, Math.max(MINI_SCALE, scale));
}

function center(r: Rect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function placeSemanticDoodle(spec: NarrativeDoodleSpec, plan: CompositionPlan): PlacedDoodle {
  const scale = clampScale(spec.scale ?? 0.48);
  const { anchors } = plan.subjects;
  const hero = anchors.heroDish ?? plan.focalPoint;
  const drink = anchors.drink ?? hero;
  const people = anchors.people;
  const table = anchors.table;
  const primary = plan.primaryTextZone;
  const secondary = plan.secondaryTextZone ?? primary;

  let x = 24;
  let y = 24;
  let rotation = 0;

  switch (spec.anchor) {
    case "above-hero-dish": {
      const c = center(hero);
      x = c.x - 24;
      y = hero.y - 68;
      rotation = -5;
      break;
    }
    case "point-to-hero-dish": {
      x = hero.x - 52;
      y = center(hero).y - 8;
      rotation = -26;
      break;
    }
    case "point-to-drink": {
      x = drink.x - 48;
      y = center(drink).y;
      rotation = -22;
      break;
    }
    case "beside-table-left": {
      x = (table?.x ?? hero.x) - 48;
      y = (table?.y ?? hero.y) + (table?.height ?? hero.height) - 100;
      rotation = 0;
      break;
    }
    case "beside-table-right": {
      x = (table?.x ?? hero.x) + (table?.width ?? hero.width) - 36;
      y = (people?.y ?? hero.y) + (people?.height ?? 200) - 80;
      rotation = 6;
      break;
    }
    case "near-emotional-copy":
      x = secondary.x + 8;
      y = secondary.y + secondary.height - 36;
      rotation = 4;
      break;
    case "near-insight-copy":
      x = primary.x - 40;
      y = primary.y + 8;
      rotation = -8;
      break;
    case "near-community":
      x = (people?.x ?? table?.x ?? 24);
      y = (people?.y ?? 900) + (people?.height ?? 120) - 60;
      rotation = -2;
      break;
    case "corner-tl":
      x = 18;
      y = 96;
      break;
    case "corner-tr":
      x = 982;
      y = 68;
      rotation = 12;
      break;
    case "corner-bl":
      x = 22;
      y = 1184;
      rotation = -4;
      break;
    case "corner-br":
      x = 962;
      y = 1164;
      rotation = 18;
      break;
  }

  return {
    type: spec.type,
    x: Math.round(x),
    y: Math.round(y),
    rotation,
    scale,
    opacity: spec.type === "coffee-stain" ? 0.2 : 0.85,
  };
}

function overlapsProtected(d: PlacedDoodle, plan: CompositionPlan): boolean {
  const protectedRects = [
    plan.subjects.anchors.heroDish,
    plan.subjects.anchors.drink,
    plan.subjects.anchors.people,
    plan.subjects.anchors.secondaryDish,
  ].filter((r): r is Rect => Boolean(r));

  const cx = d.x + 22;
  const cy = d.y + 22;
  return protectedRects.some((r) => pointInZone(cx, cy, r, 6));
}

/** Narrative doodles anchored to semantic subjects — never on hero food or faces. */
export function buildNarrativeDoodles(plan: CompositionPlan): PlacedDoodle[] {
  return plan.narrativeDoodles
    .map((spec) => placeSemanticDoodle(spec, plan))
    .filter((d) => !overlapsProtected(d, plan))
    .slice(0, Math.max(2, Math.round(plan.visualWeight.doodles * 40)));
}

export function buildDoodlesForRole(
  _role: DoodleCafeSlideRole,
  _slideIndex: number,
  _foodSafe: Rect,
  _doodleZones: Rect[],
  plan?: CompositionPlan
): PlacedDoodle[] {
  if (plan) return buildNarrativeDoodles(plan);
  return [];
}

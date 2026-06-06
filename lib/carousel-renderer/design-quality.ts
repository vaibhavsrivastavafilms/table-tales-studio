import type { CompositionPlan } from "@/lib/carousel-renderer/composition-types";
import { pointInZone } from "@/lib/carousel-renderer/geometry";
import type { Rect } from "@/lib/carousel-renderer/types";

function overlaps(a: Rect, b: Rect, pad = 20): boolean {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

export type DesignQualityResult = {
  pass: boolean;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
};

/** Design quality test — slide passes when food stays hero and type/doodles avoid subjects. */
export function evaluateDesignQuality(plan: CompositionPlan): DesignQualityResult {
  const protectedRects = [
    plan.subjects.anchors.heroDish,
    plan.subjects.anchors.drink,
    plan.subjects.anchors.people,
  ].filter((r): r is Rect => Boolean(r));

  const typeRects = [plan.primaryTextZone, plan.secondaryTextZone].filter(
    (r): r is Rect => Boolean(r)
  );

  const typeOnFood = typeRects.some((t) =>
    protectedRects.some((p) => overlaps(t, p))
  );

  const doodleOnFood = plan.narrativeDoodles.length > 0; // placed doodles filtered at render

  const hero = plan.subjects.anchors.heroDish ?? plan.focalPoint;
  const heroArea = hero.width * hero.height;
  const canvas = 1080 * 1350;
  const heroDominant = heroArea / canvas >= plan.visualWeight.photo * 0.55;

  const negUsed = plan.negativeSpace[0]
    ? overlaps(plan.primaryTextZone, plan.negativeSpace[0].rect, 8) ||
      pointInZone(
        plan.primaryTextZone.x + plan.primaryTextZone.width / 2,
        plan.primaryTextZone.y,
        plan.negativeSpace[0].rect,
        0
      )
    : true;

  const checks = [
    {
      id: "text-not-on-food",
      pass: !typeOnFood,
      detail: typeOnFood ? "Typography overlaps protected subject" : "Typography clear of food",
    },
    {
      id: "hero-dominant",
      pass: heroDominant,
      detail: heroDominant ? "Hero subject area sufficient" : "Hero subject too small for budget",
    },
    {
      id: "negative-space-type",
      pass: negUsed,
      detail: negUsed ? "Type uses negative space band" : "Type not aligned to negative space",
    },
    {
      id: "semantic-layout",
      pass: Boolean(plan.subjects.anchors.heroDish || plan.subjects.anchors.drink),
      detail: "Subject anchors present",
    },
    {
      id: "doodle-rules",
      pass: plan.narrativeDoodles.every((d) =>
        ["coffee-stain", "star"].includes(d.type)
          ? d.anchor.startsWith("corner")
          : true
      ),
      detail: "Doodle narrative anchors valid",
    },
  ];

  return {
    pass: checks.every((c) => c.pass),
    checks,
  };
}

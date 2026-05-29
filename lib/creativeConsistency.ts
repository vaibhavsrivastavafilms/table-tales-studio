import type { DynamicTypographyPlan } from "@/lib/aiTypographyEngine";
import type { CollageComposition } from "@/lib/editorialCollageEngine";
import type { DoodleRenderPlan } from "@/lib/doodleRenderEngine";
import type { SlideArtDirection } from "@/lib/slideArtDirector";

export type CreativeConsistencyMetrics = {
  visualNoiseScore: number;
  compositionBalance: number;
  editorialConfidence: number;
};

const NOISE_THRESHOLD = 0.72;
const BALANCE_THRESHOLD = 0.45;

function countTypographyBlocks(plan?: DynamicTypographyPlan | null): number {
  return plan?.blocks?.length ?? 0;
}

function countCollageLayers(collage?: CollageComposition | null): number {
  if (!collage) return 0;
  return collage.layers.filter(
    (l) => l.type !== "background" && l.type !== "shadow"
  ).length;
}

function countDoodles(doodles: DoodleRenderPlan | null): number {
  return doodles?.procedural?.elements?.length ?? 0;
}

export function scoreSlideConsistency(
  direction: SlideArtDirection
): CreativeConsistencyMetrics {
  const slideIndex = direction.slideIndex;
  const typeBlocks = countTypographyBlocks(direction.typographyPlan);
  const layers = countCollageLayers(direction.collage);
  const doodles = countDoodles(direction.doodles);
  const hasRedesign = Boolean(
    direction.redesign?.overlayUrl || direction.redesign?.loading
  );
  const hasAiOverlay = Boolean(direction.aiOverlay?.overlayUrl);
  const stickerEnergy = direction.emotional.stickerEnergy;
  const negativeSpace = direction.editorial?.negativeSpace ?? 0.35;

  let visualNoise = 0;
  visualNoise += Math.min(0.28, typeBlocks * 0.09);
  visualNoise += Math.min(0.22, Math.max(0, layers - 2) * 0.07);
  visualNoise += Math.min(0.24, doodles * 0.05);
  if (hasRedesign) visualNoise += 0.08;
  if (hasAiOverlay) visualNoise += 0.1;
  if (slideIndex === 4) visualNoise *= 0.82;
  if (slideIndex === 6) visualNoise *= 0.75;

  const heroWeight =
    slideIndex === 1 || slideIndex === 6
      ? 0.22
      : direction.editorial?.typeMode === "minimal"
        ? 0.12
        : 0.08;
  const balance =
    negativeSpace * 0.45 +
    heroWeight +
    (direction.layout?.captionZone ? 0.12 : 0) +
    (layers <= 3 ? 0.18 : layers <= 4 ? 0.08 : -0.12) -
    Math.min(0.2, doodles * 0.03);

  const editorialBoost = direction.editorial ? 0.12 : 0;
  const stickerPenalty =
    stickerEnergy > 0.75 && slideIndex !== 5 ? 0.08 : 0;
  const netDrag =
    visualNoise * 0.55 -
    balance * 0.35 -
    editorialBoost +
    stickerPenalty;
  const confidence = 1 - netDrag;

  return {
    visualNoiseScore: Math.min(1, Math.max(0, visualNoise)),
    compositionBalance: Math.min(1, Math.max(0, balance)),
    editorialConfidence: Math.min(1, Math.max(0, confidence)),
  };
}

function capTypographyPlan(
  plan: DynamicTypographyPlan,
  slideIndex: number
): DynamicTypographyPlan {
  const heroOnly =
    slideIndex === 4 ||
    slideIndex === 6 ||
    plan.blocks.length > 2;
  if (!heroOnly) return plan;

  const hero = plan.blocks.find(
    (b) => b.role === "hero" || b.role === "headline"
  );
  if (!hero) return plan;

  return {
    ...plan,
    blocks: [hero],
    legacy: {
      ...plan.legacy,
      scriptLine: slideIndex === 5 ? plan.legacy.scriptLine : undefined,
    },
  };
}

function simplifyCollage(collage: CollageComposition): CollageComposition {
  const keepTypes = new Set([
    "background",
    "cutout",
    "photo-bleed",
    "shadow",
    "redesign",
  ]);
  const layers = collage.layers.filter(
    (l) =>
      keepTypes.has(l.type) ||
      (l.type === "paper" && l.opacity > 0.2)
  );

  return {
    ...collage,
    layers: layers.slice(0, 6),
    depthShadow: "0 14px 32px rgba(0,0,0,0.22)",
  };
}

function simplifyDoodles(
  doodles: DoodleRenderPlan,
  slideIndex: number
): DoodleRenderPlan {
  const max =
    slideIndex === 5 ? 4 : slideIndex === 3 ? 3 : slideIndex === 1 ? 3 : 2;
  const elements = doodles.procedural.elements.slice(0, max);
  return {
    ...doodles,
    density: Math.min(doodles.density, 0.55),
    procedural: {
      ...doodles.procedural,
      elements,
    },
  };
}

export function applyCreativeConsistency(
  direction: SlideArtDirection
): SlideArtDirection {
  const metrics = scoreSlideConsistency(direction);
  const needsSimplify =
    metrics.visualNoiseScore >= NOISE_THRESHOLD ||
    metrics.compositionBalance <= BALANCE_THRESHOLD;

  if (!needsSimplify) {
    return { ...direction, consistency: metrics };
  }

  let next: SlideArtDirection = { ...direction, consistency: metrics };

  if (next.typographyPlan) {
    next = {
      ...next,
      typographyPlan: capTypographyPlan(next.typographyPlan, next.slideIndex),
    };
  }

  if (next.collage && countCollageLayers(next.collage) > 4) {
    next = { ...next, collage: simplifyCollage(next.collage) };
  }

  if (next.doodles && countDoodles(next.doodles) > 3) {
    next = {
      ...next,
      doodles: simplifyDoodles(next.doodles, next.slideIndex),
    };
  }

  if (next.redesign?.overlayUrl && next.slideIndex === 4) {
    next = {
      ...next,
      collage: next.collage
        ? {
            ...next.collage,
            layers: next.collage.layers.map((l) =>
              l.type === "redesign" ? { ...l, opacity: Math.min(l.opacity, 0.42) } : l
            ),
          }
        : next.collage,
    };
  }

  if (next.editorial) {
    next = {
      ...next,
      editorial: {
        ...next.editorial,
        doodleBudget: Math.min(next.editorial.doodleBudget, 0.5),
        overlapDepth: Math.min(next.editorial.overlapDepth, 2),
      },
    };
  }

  const after = scoreSlideConsistency(next);
  return {
    ...next,
    consistency: {
      visualNoiseScore: after.visualNoiseScore,
      compositionBalance: after.compositionBalance,
      editorialConfidence: Math.max(
        after.editorialConfidence,
        metrics.editorialConfidence * 0.92
      ),
    },
  };
}

export function applyConsistencyToMap(
  directions: Map<number, SlideArtDirection>
): Map<number, SlideArtDirection> {
  const out = new Map<number, SlideArtDirection>();
  for (const [idx, dir] of directions) {
    out.set(idx, applyCreativeConsistency(dir));
  }
  return out;
}

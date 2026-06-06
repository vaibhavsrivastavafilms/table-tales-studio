import {
  assignPhotosForCampaign,
  detectCarouselCampaign,
  enrichAssetsWithCampaign,
  getCampaignSlideSpec,
} from "@/lib/carousel-renderer/campaign-engine";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import type { PhotoAssignmentMeta } from "@/lib/carousel-renderer/project-types";
import type { TemplateSlideDef } from "@/lib/carousel-renderer/template-engine";
import type { PhotoAsset, PhotoCategory } from "@/lib/story-engine/types";

/** Per-photo creative scores (0–1 internally; UI shows 0–100). */
export type PhotoScore = {
  photoId: string;
  url: string;
  displayName: string;
  heroScore: number;
  appetiteScore: number;
  uniquenessScore: number;
  storytellingScore: number;
  visualImpactScore: number;
  overall: number;
  reasoning: string[];
};

export type RankedPhoto = PhotoScore & {
  rank: number;
  overallDisplay: number;
};

export type RolePick = {
  slideIndex: number;
  role: DoodleCafeSlideRole;
  label: string;
  photoId: string;
  displayName: string;
  scoreUsed: number;
  scoreLabel: string;
  reasoning: string;
};

export type HeroSelectionResult = {
  scores: PhotoScore[];
  rankings: RankedPhoto[];
  rolePicks: RolePick[];
  assignments: PhotoAssignmentMeta[];
};

const FOOD_CATEGORIES: PhotoCategory[] = ["food", "detail", "hero"];
const INTERIOR_CATEGORIES: PhotoCategory[] = ["interior", "wide"];

/** Narrative roles are filled in priority order so the hook always wins the best hero. */
const ROLE_ASSIGNMENT_ORDER: DoodleCafeSlideRole[] = [
  "hero-hook",
  "food-steam",
  "drink",
  "community-cta",
  "atmosphere",
  "hero-payoff",
  "quote",
  "brand-end",
];

const CATEGORY_DISPLAY: Record<PhotoCategory, string> = {
  food: "Food dish",
  drink: "Drink",
  interior: "Interior",
  people: "People moment",
  detail: "Food detail",
  wide: "Wide shot",
  hero: "Hero dish",
  other: "Photo",
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function toDisplayScore(n: number): number {
  return Math.round(clamp01(n) * 100);
}

export function photoDisplayName(asset: PhotoAsset): string {
  try {
    const path = asset.url.split("?")[0] ?? asset.url;
    const base = path.split("/").pop() ?? "";
    const stem = base.replace(/\.[a-z0-9]+$/i, "").trim();
    if (stem.length > 2 && !/^photo[_-]?\d+$/i.test(stem)) {
      return stem.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {
    /* ignore */
  }
  return CATEGORY_DISPLAY[asset.category] ?? "Photo";
}

function categoryUniqueness(asset: PhotoAsset, all: PhotoAsset[]): number {
  const peers = all.filter((a) => a.category === asset.category).length;
  const rarity = 1 / Math.max(1, peers);
  const bonus =
    asset.category === "hero" || asset.category === "detail" ? 0.08 : 0;
  return clamp01(0.42 + rarity * 0.38 + bonus);
}

function isFoodCategory(category: PhotoCategory): boolean {
  return FOOD_CATEGORIES.includes(category);
}

function isInteriorCategory(category: PhotoCategory): boolean {
  return INTERIOR_CATEGORIES.includes(category);
}

/**
 * Analyze one photo across visual dimensions (heuristic until vision API lands).
 */
export function scorePhoto(asset: PhotoAsset, allAssets: PhotoAsset[]): PhotoScore {
  const visualContrast = clamp01(
    0.32 +
      Math.abs(asset.brightness - 0.48) * 1.15 +
      (asset.brightness > 0.58 ? 0.12 : 0) +
      (asset.tags.includes("bright") ? 0.08 : 0)
  );

  const colorRichness = clamp01(
    asset.warmth * 0.52 + asset.compositionScore * 0.38 + asset.brightness * 0.1
  );

  const foodVisibility = isFoodCategory(asset.category)
    ? clamp01(0.5 + asset.heroPotential * 0.42 + asset.compositionScore * 0.08)
    : clamp01(asset.heroPotential * 0.28 + asset.compositionScore * 0.12);

  const platingQuality = isFoodCategory(asset.category)
    ? clamp01(asset.compositionScore * 0.62 + asset.heroPotential * 0.38)
    : clamp01(asset.compositionScore * 0.45);

  const depth = clamp01(
    asset.compositionScore * 0.55 +
      asset.brightness * 0.2 +
      (asset.tags.includes("moody") ? 0.18 : 0.1)
  );

  const uniquenessScore = categoryUniqueness(asset, allAssets);

  const appetiteAppeal = clamp01(
    isFoodCategory(asset.category)
      ? asset.heroPotential * 0.38 +
          asset.warmth * 0.34 +
          platingQuality * 0.28
      : asset.category === "drink"
        ? asset.compositionScore * 0.45 + asset.warmth * 0.35 + asset.heroPotential * 0.2
        : asset.heroPotential * 0.22 + asset.warmth * 0.15
  );

  const compositionQuality = clamp01(asset.compositionScore);

  const visualImpactScore = clamp01(
    visualContrast * 0.2 +
      colorRichness * 0.18 +
      foodVisibility * 0.16 +
      platingQuality * 0.14 +
      depth * 0.14 +
      compositionQuality * 0.18
  );

  const storytellingScore = clamp01(
    uniquenessScore * 0.32 +
      visualImpactScore * 0.34 +
      asset.heroPotential * 0.22 +
      (isInteriorCategory(asset.category) ? 0.12 : 0.06)
  );

  const heroScore = clamp01(
    asset.heroPotential * 0.34 +
      visualImpactScore * 0.28 +
      (isFoodCategory(asset.category) ? foodVisibility : 0.38) * 0.2 +
      appetiteAppeal * 0.18
  );

  const appetiteScore = clamp01(
    (isFoodCategory(asset.category) || asset.category === "detail" ? 1 : 0.38) *
      (appetiteAppeal * 0.48 + platingQuality * 0.32 + asset.heroPotential * 0.2)
  );

  const overall = clamp01(
    heroScore * 0.28 +
      appetiteScore * 0.22 +
      visualImpactScore * 0.2 +
      storytellingScore * 0.15 +
      uniquenessScore * 0.15
  );

  const reasoning: string[] = [];
  if (heroScore >= 0.72) reasoning.push("Strong hook candidate — high hero potential and visual punch");
  else if (heroScore >= 0.58) reasoning.push("Solid hero presence for opening slide");
  if (appetiteScore >= 0.7 && isFoodCategory(asset.category)) {
    reasoning.push("High appetite appeal — food visibility and warm plating");
  }
  if (asset.category === "drink" && appetiteScore >= 0.55) {
    reasoning.push("Drink-forward framing suits sip/crave slides");
  }
  if (isInteriorCategory(asset.category)) {
    reasoning.push("Interior/wide framing fits atmosphere and brand slides");
  }
  if (asset.category === "people") reasoning.push("People energy for community CTA");
  if (uniquenessScore >= 0.65) reasoning.push("Distinct from other uploads — adds variety");
  if (visualImpactScore >= 0.68) reasoning.push("High visual impact (contrast, color, composition)");
  if (reasoning.length === 0) {
    reasoning.push(
      `Balanced ${CATEGORY_DISPLAY[asset.category].toLowerCase()} — composition ${toDisplayScore(compositionQuality)}%`
    );
  }

  return {
    photoId: asset.id,
    url: asset.url,
    displayName: photoDisplayName(asset),
    heroScore,
    appetiteScore,
    uniquenessScore,
    storytellingScore,
    visualImpactScore,
    overall,
    reasoning,
  };
}

export function scoreAllPhotos(assets: PhotoAsset[]): PhotoScore[] {
  return assets.map((a) => scorePhoto(a, assets));
}

/** Tie-break by creative strength, never upload order. */
export function comparePhotoScores(a: PhotoScore, b: PhotoScore): number {
  if (b.overall !== a.overall) return b.overall - a.overall;
  if (b.heroScore !== a.heroScore) return b.heroScore - a.heroScore;
  if (b.visualImpactScore !== a.visualImpactScore) {
    return b.visualImpactScore - a.visualImpactScore;
  }
  return b.appetiteScore - a.appetiteScore;
}

function compareCandidates(
  a: { scored: PhotoScore; fit: number },
  b: { scored: PhotoScore; fit: number }
): number {
  if (b.fit !== a.fit) return b.fit - a.fit;
  return comparePhotoScores(a.scored, b.scored);
}

/** Restrict pool to category when narrative role requires it (atmosphere → interior, etc.). */
function poolForNarrativeRole(
  assets: PhotoAsset[],
  used: Set<string>,
  slide: TemplateSlideDef
): PhotoAsset[] {
  const unused = assets.filter((a) => !used.has(a.id));
  const pool = unused.length > 0 ? unused : assets;

  if (slide.role === "hero-hook") {
    return pool;
  }

  if (
    slide.photoCategory === "interior" ||
    slide.role === "atmosphere" ||
    slide.role === "quote"
  ) {
    const interiors = pool.filter((a) => isInteriorCategory(a.category));
    if (interiors.length > 0) return interiors;
  }

  if (slide.photoCategory === "drink" || slide.role === "drink") {
    const drinks = pool.filter((a) => a.category === "drink");
    if (drinks.length > 0) return drinks;
  }

  if (slide.photoCategory === "people" || slide.role === "community-cta") {
    const people = pool.filter((a) => a.category === "people");
    if (people.length > 0) return people;
  }

  if (slide.photoCategory === "food-close" || slide.role === "food-steam") {
    const food = pool.filter((a) => isFoodCategory(a.category));
    if (food.length > 0) return food;
  }

  if (slide.role === "brand-end" || slide.photoCategory === "any") {
    const brandPool = pool.filter((a) => isInteriorCategory(a.category));
    if (brandPool.length > 0) return brandPool;
  }

  return pool;
}

export function rankPhotosForDebug(assets: PhotoAsset[]): RankedPhoto[] {
  const scores = scoreAllPhotos(assets);
  return [...scores]
    .sort(comparePhotoScores)
    .map((s, i) => ({
      ...s,
      rank: i + 1,
      overallDisplay: toDisplayScore(s.overall),
    }));
}

function scoreLabelForCategory(
  photoCategory: TemplateSlideDef["photoCategory"]
): string {
  switch (photoCategory) {
    case "hero-food":
      return "hero score";
    case "food-close":
      return "appetite score";
    case "drink":
      return "drink fit";
    case "interior":
      return "atmosphere score";
    case "people":
      return "community score";
    default:
      return "brand fit";
  }
}

/** Role-specific fit — not upload order. */
function roleFitScore(
  scored: PhotoScore,
  asset: PhotoAsset,
  slide: TemplateSlideDef
): number {
  switch (slide.photoCategory) {
    case "hero-food":
      return scored.heroScore;
    case "food-close":
      return scored.appetiteScore;
    case "drink":
      return asset.category === "drink"
        ? scored.appetiteScore * 0.55 + scored.visualImpactScore * 0.45
        : scored.appetiteScore * 0.22 + scored.visualImpactScore * 0.15;
    case "interior":
      return isInteriorCategory(asset.category)
        ? scored.storytellingScore * 0.5 + scored.visualImpactScore * 0.5
        : scored.storytellingScore * 0.32 + scored.visualImpactScore * 0.2;
    case "people":
      return asset.category === "people"
        ? scored.storytellingScore * 0.5 + scored.heroScore * 0.35 + scored.uniquenessScore * 0.15
        : scored.storytellingScore * 0.18;
    case "any":
      return isInteriorCategory(asset.category)
        ? scored.storytellingScore * 0.42 + scored.heroScore * 0.28
        : scored.overall * 0.55;
    default:
      return scored.overall;
  }
}

function buildAssignmentReasoning(
  slide: TemplateSlideDef,
  scored: PhotoScore,
  fit: number,
  rankAmongAll: number
): string {
  const pct = toDisplayScore(fit);
  const dimension = scoreLabelForCategory(slide.photoCategory);
  const heroNote =
    slide.role === "hero-hook"
      ? " Strongest image wins slide 1 — not first upload."
      : "";
  return `Best ${slide.label.toLowerCase()} match via ${dimension} (${pct}). Ranked #${rankAmongAll} overall.${heroNote}`;
}

/**
 * Curated assignment: fill narrative roles in priority order, never sequential upload order.
 */
export function assignPhotosWithHeroEngine(
  assets: PhotoAsset[],
  slides: TemplateSlideDef[]
): HeroSelectionResult {
  const campaign = detectCarouselCampaign(assets);
  const workingAssets = enrichAssetsWithCampaign(assets, campaign);

  if (assets.length === 0) {
    const empty = slides.map(() => ({
      photoId: "",
      url: "",
      confidence: 0,
      reasoning: "No photos uploaded",
    }));
    return {
      scores: [],
      rankings: [],
      rolePicks: [],
      assignments: empty,
    };
  }

  const scores = scoreAllPhotos(workingAssets);
  const scoreById = new Map(scores.map((s) => [s.photoId, s]));
  const rankings = rankPhotosForDebug(workingAssets);
  const rankByPhotoId = new Map(rankings.map((r) => [r.photoId, r.rank]));

  const used = new Set<string>();
  const assignmentBySlideIndex = new Map<number, PhotoAssignmentMeta>();
  const rolePicks: RolePick[] = [];

  if (campaign) {
    const campaignAssignments = assignPhotosForCampaign(
      workingAssets,
      slides,
      campaign
    );
    if (campaignAssignments) {
      campaignAssignments.forEach((meta, slideIndex) => {
        if (!meta.photoId) return;
        assignmentBySlideIndex.set(slideIndex, meta);
        used.add(meta.photoId);
        const spec = getCampaignSlideSpec(slideIndex + 1, campaign);
        const slide = slides[slideIndex];
        if (slide && spec) {
          rolePicks.push({
            slideIndex,
            role: slide.role,
            label: spec.title,
            photoId: meta.photoId,
            displayName: photoDisplayName(
              workingAssets.find((a) => a.id === meta.photoId) ?? workingAssets[0]!
            ),
            scoreUsed: 0.92,
            scoreLabel: "campaign narrative",
            reasoning: meta.reasoning,
          });
        }
      });
    }
  }

  const slidesByRole = new Map(slides.map((s) => [s.role, s]));

  for (const role of ROLE_ASSIGNMENT_ORDER) {
    const slide = slidesByRole.get(role);
    if (!slide) continue;

    const slideIndex = slide.index - 1;
    if (assignmentBySlideIndex.has(slideIndex)) continue;

    const rolePool = poolForNarrativeRole(workingAssets, used, slide);
    const candidates = rolePool
      .map((asset) => {
        const scored = scoreById.get(asset.id)!;
        const fit = roleFitScore(scored, asset, slide);
        return { asset, scored, fit };
      })
      .sort(compareCandidates);

    let pick = candidates[0];
    if (!pick) {
      const reusePool = workingAssets
        .map((asset) => {
          const scored = scoreById.get(asset.id)!;
          return { asset, scored, fit: roleFitScore(scored, asset, slide) };
        })
        .sort(compareCandidates);
      pick = reusePool[0];
    }

    if (!pick) continue;

    used.add(pick.asset.id);
    const confidence = Math.min(0.99, Math.max(0.55, pick.fit));
    const reasoning = buildAssignmentReasoning(
      slide,
      pick.scored,
      pick.fit,
      rankByPhotoId.get(pick.asset.id) ?? scores.length
    );

    assignmentBySlideIndex.set(slide.index - 1, {
      photoId: pick.asset.id,
      url: pick.asset.url,
      confidence,
      reasoning,
    });

    rolePicks.push({
      slideIndex: slide.index - 1,
      role: slide.role,
      label: slide.label,
      photoId: pick.asset.id,
      displayName: pick.scored.displayName,
      scoreUsed: pick.fit,
      scoreLabel: scoreLabelForCategory(slide.photoCategory),
      reasoning,
    });
  }

  const assignments = slides.map((slide, slideIndex) => {
    const existing = assignmentBySlideIndex.get(slideIndex);
    if (existing) return existing;

    const remaining = workingAssets.filter((a) => !used.has(a.id));
    const pool = remaining.length > 0 ? remaining : workingAssets;
    const asset = pool[0]!;
    const scored = scoreById.get(asset.id)!;
    used.add(asset.id);
    return {
      photoId: asset.id,
      url: asset.url,
      confidence: 0.5,
      reasoning: `Fallback for ${slide.label}`,
    };
  });

  return { scores, rankings, rolePicks, assignments };
}

export function buildHeroSelectionReport(
  assets: PhotoAsset[],
  slides: TemplateSlideDef[]
): HeroSelectionResult {
  return assignPhotosWithHeroEngine(assets, slides);
}

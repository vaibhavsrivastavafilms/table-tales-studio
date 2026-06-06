import {
  FRESH_FEELGOOD_CAMPAIGN_ID,
  FRESH_FEELGOOD_CONSISTENCY_BLOCK,
  FRESH_FEELGOOD_SLIDES,
  FRESH_FEELGOOD_THEME,
  FRESH_FEELGOOD_ACCENT,
  type FreshFeelgoodSlideSpec,
} from "@/lib/carousel-renderer/campaigns/fresh-feelgood-food";
import type { CompositionPlan } from "@/lib/carousel-renderer/composition-types";
import { photoDisplayName } from "@/lib/carousel-renderer/hero-engine";
import type { PhotoAssignmentMeta } from "@/lib/carousel-renderer/project-types";
import type { TemplateSlideDef } from "@/lib/carousel-renderer/template-engine";
import {
  type Captions,
  SLIDE_KEYS,
} from "@/lib/slides";

import type { PhotoAsset } from "@/lib/story-engine/types";
import { inferPhotoCategoryFromUrl } from "@/lib/story-engine/photo/photo-intelligence";

export type CarouselCampaignId = typeof FRESH_FEELGOOD_CAMPAIGN_ID;

export type CarouselCampaign = {
  id: CarouselCampaignId;
  theme: string;
  accent: string;
  slides: readonly FreshFeelgoodSlideSpec[];
  minMatchCount: number;
};

export const FRESH_FEELGOOD_CAMPAIGN: CarouselCampaign = {
  id: FRESH_FEELGOOD_CAMPAIGN_ID,
  theme: FRESH_FEELGOOD_THEME,
  accent: FRESH_FEELGOOD_ACCENT,
  slides: FRESH_FEELGOOD_SLIDES,
  minMatchCount: 2,
};

function urlStem(url: string): string {
  try {
    const path = url.split("?")[0] ?? url;
    return (path.split("/").pop() ?? "").replace(/\.[a-z0-9]+$/i, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function assetSearchText(asset: PhotoAsset): string {
  return `${urlStem(asset.url)} ${photoDisplayName(asset).toLowerCase()} ${asset.category}`;
}

export function matchAssetToCampaignSlide(
  asset: PhotoAsset,
  campaign: CarouselCampaign = FRESH_FEELGOOD_CAMPAIGN
): FreshFeelgoodSlideSpec | null {
  const text = assetSearchText(asset);
  for (const spec of campaign.slides) {
    if (spec.matchers.some((m) => m.test(text))) return spec;
  }
  return null;
}

/** Enable campaign when enough uploads match named dishes (not sequential index). */
export function detectCarouselCampaign(
  assets: PhotoAsset[],
  campaign: CarouselCampaign = FRESH_FEELGOOD_CAMPAIGN
): CarouselCampaign | null {
  if (assets.length < 3) return null;
  const matched = new Set<number>();
  for (const asset of assets) {
    const spec = matchAssetToCampaignSlide(asset, campaign);
    if (spec) matched.add(spec.index);
  }
  return matched.size >= campaign.minMatchCount ? campaign : null;
}

export function getCampaignSlideSpec(
  slideIndex: number,
  campaign: CarouselCampaign = FRESH_FEELGOOD_CAMPAIGN
): FreshFeelgoodSlideSpec | null {
  if (slideIndex < 1 || slideIndex > campaign.slides.length) return null;
  return campaign.slides.find((s) => s.index === slideIndex) ?? null;
}

export function buildCampaignOverlayPrompt(
  slideIndex: number,
  campaign: CarouselCampaign = FRESH_FEELGOOD_CAMPAIGN
): string | null {
  const spec = getCampaignSlideSpec(slideIndex, campaign);
  if (!spec) return null;
  return [
    `Carousel theme: ${campaign.theme}.`,
    `Visual style: white hand-drawn doodles, yellow accent ${campaign.accent}, warm café editorial, clean composition.`,
    spec.doodlePrompt,
    FRESH_FEELGOOD_CONSISTENCY_BLOCK,
  ].join(" ");
}

export function applyCampaignToCompositionPlan(
  plan: CompositionPlan,
  slideIndex: number,
  campaign: CarouselCampaign = FRESH_FEELGOOD_CAMPAIGN
): CompositionPlan {
  const spec = getCampaignSlideSpec(slideIndex, campaign);
  if (!spec) return plan;
  return {
    ...plan,
    narrativeDoodles: spec.narrativeDoodles,
    visualWeight: {
      ...plan.visualWeight,
      doodles: Math.min(0.14, plan.visualWeight.doodles + 0.04),
    },
  };
}

/** Studio caption keys → campaign slide index (6-slide arc). */
const STUDIO_KEY_TO_CAMPAIGN_INDEX: Record<string, number> = {
  hook: 1,
  slide1: 2,
  slide2: 3,
  slide3: 4,
  slide4: 5,
  cta: 6,
};

export function campaignDefaultCaptions(
  campaign: CarouselCampaign = FRESH_FEELGOOD_CAMPAIGN
): Captions {
  const out = {} as Captions;
  for (const key of SLIDE_KEYS) {
    const idx = STUDIO_KEY_TO_CAMPAIGN_INDEX[key];
    const spec = idx ? getCampaignSlideSpec(idx, campaign) : null;
    if (!spec) {
      out[key] = "";
      continue;
    }
    out[key] = spec.subhead
      ? `${spec.headline}\n${spec.subhead}`
      : spec.headline;
  }
  return out;
}

export function mergeCaptionsWithCampaign(
  captions: Captions,
  campaign: CarouselCampaign | null
): Captions {
  if (!campaign) return captions;
  const defaults = campaignDefaultCaptions(campaign);
  const merged = { ...captions };
  for (const key of SLIDE_KEYS) {
    if (!merged[key]?.trim()) merged[key] = defaults[key];
  }
  return merged;
}

/**
 * Pin each campaign dish to its narrative slide (1–6). Slides 7–8 use fallback assignment.
 */
export function assignPhotosForCampaign(
  assets: PhotoAsset[],
  slides: TemplateSlideDef[],
  campaign: CarouselCampaign = FRESH_FEELGOOD_CAMPAIGN
): PhotoAssignmentMeta[] | null {
  if (assets.length === 0) return null;

  const assignments: PhotoAssignmentMeta[] = slides.map(() => ({
    photoId: "",
    url: "",
    confidence: 0,
    reasoning: "Unassigned",
  }));
  const used = new Set<string>();

  for (const spec of campaign.slides) {
    const slideIndex = spec.index - 1;
    if (slideIndex >= slides.length) continue;

    const candidates = assets
      .filter((a) => !used.has(a.id) && spec.matchers.some((m) => m.test(assetSearchText(a))))
      .sort((a, b) => {
        const aHits = spec.matchers.filter((m) => m.test(assetSearchText(a))).length;
        const bHits = spec.matchers.filter((m) => m.test(assetSearchText(b))).length;
        return bHits - aHits;
      });

    const pick = candidates[0];
    if (!pick) continue;

    used.add(pick.id);
    const slide = slides[slideIndex]!;
    assignments[slideIndex] = {
      photoId: pick.id,
      url: pick.url,
      confidence: 0.92,
      reasoning: `Campaign "${spec.title}": ${spec.dishId} narrative on slide ${spec.index} (${slide.label}) — not upload order.`,
    };
  }

  const filled = assignments.filter((a) => a.photoId).length;
  if (filled < campaign.minMatchCount) return null;

  return assignments;
}

/** Infer dish category from campaign match to improve photo intelligence. */
export function enrichAssetsWithCampaign(
  assets: PhotoAsset[],
  campaign: CarouselCampaign | null
): PhotoAsset[] {
  if (!campaign) return assets;
  return assets.map((asset) => {
    const spec = matchAssetToCampaignSlide(asset, campaign);
    if (!spec) return asset;

    let category = asset.category;
    if (/shake|frappe|cooler|drink/i.test(spec.dishId)) category = "drink";
    else if (/salad|bowl|fruit/i.test(spec.dishId)) category = "food";

    const inferred = inferPhotoCategoryFromUrl(asset.url);
    if (inferred) category = inferred;

    const heroBoost =
      spec.index === 1 || spec.index === 5 ? 0.08 : spec.index === 2 || spec.index === 4 ? 0.05 : 0.03;

    return {
      ...asset,
      category,
      heroPotential: Math.min(1, asset.heroPotential + heroBoost),
      tags: [...asset.tags, "campaign", spec.dishId],
    };
  });
}

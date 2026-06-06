import {
  detectCarouselCampaign,
  enrichAssetsWithCampaign,
} from "@/lib/carousel-renderer/campaign-engine";
import { assignPhotosFromAssets, expandCaptionsForEight } from "@/lib/carousel-renderer/photo-assignment";
import { composeRenderSlide } from "@/lib/carousel-renderer/slide-compositor";
import {
  CAROUSEL_ASPECT,
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
  type CarouselRenderProject,
  type CarouselTemplateId,
  type RenderSlide,
} from "@/lib/carousel-renderer/project-types";
import { getTemplate } from "@/lib/carousel-renderer/template-engine";
import { renderProjectToDocument } from "@/lib/carousel-renderer/document-adapter";
import type { CarouselDocument } from "@/lib/carousel-renderer/types";
import type { PhotoAsset } from "@/lib/story-engine/types";
import { analyzePhotos } from "@/lib/story-engine/photo/photo-intelligence";

export type BuildRenderProjectInput = {
  templateId: CarouselTemplateId;
  theme: string;
  style: string;
  photos: PhotoAsset[];
  captions: string[];
  brandName?: string;
  brandCta?: string;
  location?: string;
};

function uid(): string {
  return `carousel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Full pipeline: Photo Intelligence → Template → Compose slides → Render Project
 */
export function buildRenderProject(input: BuildRenderProjectInput): CarouselRenderProject {
  const template = getTemplate(input.templateId);
  const rawAssets =
    input.photos.length > 0
      ? input.photos
      : analyzePhotos([]).assets;
  const campaign = detectCarouselCampaign(rawAssets);
  const assets = enrichAssetsWithCampaign(rawAssets, campaign);

  const assignments = assignPhotosFromAssets(assets, template.slides);

  let captionLines = [...input.captions];
  if (campaign) {
    for (const spec of campaign.slides) {
      const i = spec.index - 1;
      if (!captionLines[i]?.trim()) {
        captionLines[i] = spec.subhead
          ? `${spec.headline}\n${spec.subhead}`
          : spec.headline;
      }
    }
  }
  const copy = expandCaptionsForEight(captionLines, template.slides);

  const assetById = new Map(assets.map((a) => [a.id, a]));

  const slides: RenderSlide[] = template.slides.map((def, i) => {
    const assignment = assignments[i]!;
    const copyBlock = copy[i]!;
    const photoAsset = assetById.get(assignment.photoId) ?? assets[i] ?? null;
    return composeRenderSlide({
      id: `slide_${def.index}`,
      index: def.index,
      role: def.role,
      photoId: assignment.photoId,
      photoUrl: assignment.url,
      photoAsset,
      headline: copyBlock.headline,
      body: copyBlock.subhead ?? "",
      subhead: copyBlock.subhead,
      brandName: input.brandName,
      brandCta: input.brandCta,
      location: input.location,
      photoConfidence: assignment.confidence,
      photoReasoning: assignment.reasoning,
      campaign,
    });
  });

  return {
    id: uid(),
    templateId: input.templateId,
    theme: campaign?.theme ?? input.theme,
    style: input.style,
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    slides,
    brandName: input.brandName,
    brandCta: input.brandCta,
    location: input.location,
    createdAt: new Date().toISOString(),
  };
}

/** Carousel JSON for React renderer + export rack. */
export function buildCarouselFromPipeline(
  input: BuildRenderProjectInput
): { project: CarouselRenderProject; document: CarouselDocument } {
  const project = buildRenderProject(input);
  return {
    project,
    document: renderProjectToDocument(project),
  };
}

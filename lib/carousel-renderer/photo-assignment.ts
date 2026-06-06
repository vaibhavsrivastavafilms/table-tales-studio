import { assignPhotosWithHeroEngine } from "@/lib/carousel-renderer/hero-engine";
import type { TemplateSlideDef } from "@/lib/carousel-renderer/template-engine";
import type { PhotoAssignmentMeta } from "@/lib/carousel-renderer/project-types";
import type { PhotoAsset } from "@/lib/story-engine/types";

/** Pick best photo per narrative role via Hero Selection Engine (not upload order). */
export function assignPhotosFromAssets(
  assets: PhotoAsset[],
  slides: TemplateSlideDef[]
): PhotoAssignmentMeta[] {
  return assignPhotosWithHeroEngine(assets, slides).assignments;
}

/** Legacy URL-only assignment when photo intelligence is unavailable. */
export function assignPhotosToSlides(
  photoUrls: string[],
  slides: TemplateSlideDef[]
): string[] {
  const meta = assignPhotosFromAssets(
    photoUrls.map((url, i) => ({
      id: `photo_${i + 1}`,
      url,
      category: "food" as const,
      heroPotential: i === 0 ? 0.9 : 0.5,
      brightness: 0.5,
      warmth: 0.5,
      compositionScore: 0.6,
      tags: [],
    })),
    slides
  );
  return meta.map((m) => m.url);
}

export function expandCaptionsForEight(
  captions: string[],
  defaults: TemplateSlideDef[]
): { headline: string; subhead?: string }[] {
  return defaults.map((def, i) => {
    const raw = captions[i] ?? captions[Math.min(i, captions.length - 1)] ?? "";
    const headline = raw.trim() || def.defaultHeadline;
    return {
      headline,
      subhead: def.defaultSubhead,
    };
  });
}

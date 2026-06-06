import { studioCaptionsToCarouselLines } from "@/lib/carousel-renderer/captions-bridge";
import { expandCaptionsForEight } from "@/lib/carousel-renderer/photo-assignment";
import { buildRenderProject } from "@/lib/carousel-renderer/pipeline";
import type { CarouselRenderProject } from "@/lib/carousel-renderer/project-types";
import { DOODLE_CAFE_TEMPLATE } from "@/lib/carousel-renderer/template-engine";
import type { CarouselProject } from "@/lib/story-engine/types";
import type { Captions } from "@/lib/slides";

const DOODLE_CAFE_THEME = "cozy-cafe-storytelling";

/** Map Story Engine project → Carousel Render Project (8-slide Doodle Café). */
export function storyProjectToRenderProject(
  project: CarouselProject,
  options?: {
    templateId?: "doodle-cafe";
    style?: string;
    brandName?: string;
    brandCta?: string;
    location?: string;
  }
): CarouselRenderProject {
  const template = DOODLE_CAFE_TEMPLATE;
  const captions = project.slides.map((s) =>
    [s.headline, s.body].filter(Boolean).join("\n")
  );
  while (captions.length < 8) captions.push("");

  const assets =
    project.photos.length > 0
      ? project.photos
      : project.slides
          .map((s, i) => {
            const url = s.visualPlan.photoPreference;
            if (!url) return null;
            return {
              id: s.visualPlan.preferredPhotoId ?? `photo_${i + 1}`,
              url,
              category: "food" as const,
              heroPotential: 0.7,
              brightness: 0.5,
              warmth: 0.5,
              compositionScore: s.visualPlan.confidence ?? 0.6,
              tags: [],
            };
          })
          .filter((a): a is NonNullable<typeof a> => a != null);

  return buildRenderProject({
    templateId: options?.templateId ?? "doodle-cafe",
    theme: project.brief.topic || DOODLE_CAFE_THEME,
    style: options?.style ?? "doodle-cafe",
    photos: assets,
    captions,
    brandName: options?.brandName ?? project.brief.brand,
    brandCta: options?.brandCta,
    location: options?.location,
  });
}

export function studioCaptionsToRenderProject(input: {
  captions: Captions;
  photos: import("@/lib/story-engine/types").PhotoAsset[];
  brandName?: string;
  brandCta?: string;
  location?: string;
  theme?: string;
}): CarouselRenderProject {
  const lines = studioCaptionsToCarouselLines(
    input.captions,
    input.brandName,
    input.brandCta
  );

  return buildRenderProject({
    templateId: "doodle-cafe",
    theme: input.theme ?? DOODLE_CAFE_THEME,
    style: "doodle-cafe",
    photos: input.photos,
    captions: lines,
    brandName: input.brandName,
    brandCta: input.brandCta,
    location: input.location,
  });
}

export { expandCaptionsForEight };

import type { CarouselRenderProject, RenderSlide } from "@/lib/carousel-renderer/project-types";
import { composeSlide, type ComposeSlideInput } from "@/lib/carousel-renderer/slide-compositor";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import {
  CAROUSEL_ASPECT,
  type CarouselDocument,
  type CarouselSlideJson,
} from "@/lib/carousel-renderer/types";
import { getTemplate } from "@/lib/carousel-renderer/template-engine";

function slideToJson(slide: RenderSlide): CarouselSlideJson {
  const input: ComposeSlideInput = {
    index: slide.index,
    role: slide.role as DoodleCafeSlideRole,
    photoUrl: slide.photoUrl,
    headline: slide.headline,
    subhead: slide.subhead ?? slide.body,
  };
  const composition = composeSlide(input);

  return {
    index: slide.index,
    role: slide.role,
    photoUrl: slide.photoUrl,
    headline: slide.headline,
    subhead: slide.subhead,
    composition,
  };
}

export function renderProjectToDocument(project: CarouselRenderProject): CarouselDocument {
  const template = getTemplate(project.templateId);
  return {
    id: project.id,
    templateId: project.templateId,
    templateName: template.name,
    width: project.width,
    height: project.height,
    aspectRatio: CAROUSEL_ASPECT,
    theme: project.theme,
    slides: project.slides.map(slideToJson),
    createdAt: project.createdAt,
  };
}

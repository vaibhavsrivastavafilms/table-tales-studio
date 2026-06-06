import { renderDoodleCafeSlide } from "@/lib/renderers/templates/doodle-cafe-renderer";
import { renderEditorialSlide } from "@/lib/renderers/templates/editorial-renderer";
import { renderLuxurySlide } from "@/lib/renderers/templates/luxury-renderer";
import { renderMinimalSlide } from "@/lib/renderers/templates/minimal-renderer";
import type { SlideRenderOutput, TemplateRenderInput } from "@/lib/renderers/types";
import type { TemplateId } from "@/lib/templates";

export type TemplateRendererFn = (input: TemplateRenderInput) => SlideRenderOutput;

const RENDERER_MAP: Record<string, TemplateRendererFn> = {
  "doodle-story": renderDoodleCafeSlide,
  "luxury-dining": renderLuxurySlide,
  "cinematic-dark": renderEditorialSlide,
  "street-food": renderMinimalSlide,
  "founder-story": renderEditorialSlide,
  "cozy-monsoon": renderEditorialSlide,
  "rich-relationship": renderEditorialSlide,
  "relationship-story": renderEditorialSlide,
};

export function getRendererForTemplate(
  templateId: TemplateId | string
): TemplateRendererFn {
  return RENDERER_MAP[templateId] ?? renderEditorialSlide;
}

export function templateUsesDoodleEngine(templateId: string): boolean {
  return templateId === "doodle-story";
}

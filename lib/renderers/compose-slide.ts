/**
 * Template rendering pipeline:
 * Photo → Photo Analysis → Layout → Doodle Layer → Typography → Composite spec
 */
import { getRendererForTemplate } from "@/lib/renderers/registry";
import type { SlideRenderOutput, TemplateRenderInput } from "@/lib/renderers/types";

export function composeSlideRender(input: TemplateRenderInput): SlideRenderOutput {
  const renderer = getRendererForTemplate(input.templateId);
  return renderer(input);
}

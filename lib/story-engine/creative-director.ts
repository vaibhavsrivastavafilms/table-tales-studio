import { applyVisualInstructionForSlide } from "@/lib/story-engine/visual-planner";
import { scoreCarouselProject } from "@/lib/story-engine/scoring-engine";
import { touchProject } from "@/lib/story-engine/story-engine";
import type {
  CarouselProject,
  EnhanceSlideInput,
  Slide,
} from "@/lib/story-engine/types";

function rewriteCopyHeuristic(slide: Slide, instruction: string): Slide {
  const lower = instruction.toLowerCase();
  let headline = slide.headline;
  let body = slide.body;

  if (/cinematic|moody|dramatic|film/.test(lower)) {
    headline = headline.replace(/\.$/, "");
    body = `Slow light. Deep contrast. ${body}`;
  }
  if (/luxury|premium|elegant/.test(lower)) {
    headline = headline.replace(/!/g, ".");
    body = body.replace(/!/g, ".");
    if (!/refined|curated|crafted/i.test(body)) {
      body = `Refined and intentional — ${body}`;
    }
  }
  if (/emotional|heart|feel/.test(lower)) {
    body = `Feel this first: ${body}`;
  }
  if (/curiosity|hook|scroll|stop/.test(lower) && slide.role === "hook") {
    headline = headline.endsWith("?") ? headline : `${headline}?`;
    body = `You won't scroll past this — ${body}`;
  }
  if (/cta|stronger|action|follow/.test(lower) && slide.role === "cta") {
    headline = /now|today/i.test(headline) ? headline : `${headline} — today`;
    body = `${body} Tap save. Share with one person who gets it.`;
  }
  if (/shorter|concise|tight/.test(lower)) {
    body = body.split(/[.!?]/)[0]?.trim() || body;
  }

  return { ...slide, headline, body };
}

/**
 * Rewrite a single slide — preserves role, position, and story framework.
 * Updates headline, body, and visual direction only.
 */
export function enhanceSlide(
  project: CarouselProject,
  slideId: string,
  instruction: string
): CarouselProject {
  const index = project.slides.findIndex((s) => s.id === slideId);
  if (index < 0) return project;

  const slide = project.slides[index]!;
  const rewritten = rewriteCopyHeuristic(slide, instruction);
  const visualPlan = applyVisualInstructionForSlide(rewritten, instruction);

  const slides = [...project.slides];
  slides[index] = {
    ...rewritten,
    visualPlan: {
      ...visualPlan,
      direction: instruction.trim().slice(0, 200),
    },
  };

  let next: CarouselProject = touchProject({
    ...project,
    slides,
  });
  next = { ...next, score: scoreCarouselProject(next) };
  return next;
}

export function enhanceSlideFromInput(input: EnhanceSlideInput): CarouselProject {
  return enhanceSlide(input.project, input.slideId, input.instruction);
}

export function mergeAiEnhancedSlide(
  project: CarouselProject,
  slideId: string,
  patch: { headline?: string; body?: string; visualDirection?: string }
): CarouselProject {
  const index = project.slides.findIndex((s) => s.id === slideId);
  if (index < 0) return project;

  const slide = project.slides[index]!;
  const slides = [...project.slides];
  slides[index] = {
    ...slide,
    headline: patch.headline?.trim() || slide.headline,
    body: patch.body?.trim() || slide.body,
    visualPlan: {
      ...slide.visualPlan,
      direction: patch.visualDirection?.trim() || slide.visualPlan.direction,
    },
  };

  let next = touchProject({ ...project, slides });
  next = { ...next, score: scoreCarouselProject(next) };
  return next;
}

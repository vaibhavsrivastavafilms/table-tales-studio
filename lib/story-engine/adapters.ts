import type { Captions, SlideKey } from "@/lib/slides";
import { SLIDE_KEYS } from "@/lib/slides";
import type { CarouselProject, Slide, SlideRole } from "@/lib/story-engine/types";

/** Legacy slide keys map 1:1 to story engine roles. */
export const SLIDE_KEY_TO_ROLE: Record<SlideKey, SlideRole> = {
  hook: "hook",
  slide1: "problem",
  slide2: "context",
  slide3: "insight",
  slide4: "transformation",
  cta: "cta",
};

export const ROLE_TO_SLIDE_KEY: Record<SlideRole, SlideKey> = {
  hook: "hook",
  problem: "slide1",
  context: "slide2",
  insight: "slide3",
  transformation: "slide4",
  cta: "cta",
};

export function slideToCaption(slide: Slide): string {
  const headline = slide.headline.trim();
  const body = slide.body.trim();
  if (headline && body && headline !== body) {
    return `${headline}\n${body}`;
  }
  return headline || body;
}

export function projectToCaptions(project: CarouselProject): Captions {
  const captions = {} as Captions;
  for (const key of SLIDE_KEYS) {
    captions[key] = "";
  }
  for (const slide of project.slides) {
    const key = ROLE_TO_SLIDE_KEY[slide.role];
    if (key) captions[key] = slideToCaption(slide);
  }
  return captions;
}

export function captionsToProjectPatch(
  project: CarouselProject,
  captions: Captions
): CarouselProject {
  const slides = project.slides.map((slide) => {
    const key = ROLE_TO_SLIDE_KEY[slide.role];
    const text = key ? captions[key]?.trim() : "";
    if (!text) return slide;
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    return {
      ...slide,
      headline: lines[0] ?? text,
      body: lines.slice(1).join(" ") || lines[0] || "",
    };
  });
  return {
    ...project,
    slides,
    updatedAt: new Date().toISOString(),
  };
}

export function getSlideIdForIndex(
  project: CarouselProject | null,
  slideIndex: number
): string | null {
  if (!project) return null;
  const key = SLIDE_KEYS[slideIndex];
  if (!key) return null;
  const role = SLIDE_KEY_TO_ROLE[key];
  return project.slides.find((s) => s.role === role)?.id ?? null;
}

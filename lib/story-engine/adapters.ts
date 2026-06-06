import {
  type Captions,
  SLIDE_KEYS,
  type SlideKey,
} from "@/lib/slides";

import { createEmptyCaptions } from "@/lib/draftStorage";
import { createEmptyProjectFields } from "@/lib/story-engine/persistence/migrate";
import { runStoryEnginePipeline } from "@/lib/story-engine/story-engine";
import type {
  CarouselProject,
  Slide,
  SlideRole,
  StoryFramework,
} from "@/lib/story-engine/types";

/** Legacy slide keys map to first N story roles by index. */
export const SLIDE_KEY_TO_INDEX: Record<SlideKey, number> = {
  hook: 0,
  slide1: 1,
  slide2: 2,
  slide3: 3,
  slide4: 4,
  cta: 5,
};

export const INDEX_TO_SLIDE_KEY = SLIDE_KEYS;

/** @deprecated use index mapping */
export const SLIDE_KEY_TO_ROLE: Record<SlideKey, SlideRole> = {
  hook: "hook",
  slide1: "problem",
  slide2: "context",
  slide3: "insight",
  slide4: "transformation",
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
  const captions = createEmptyCaptions();
  project.slides.forEach((slide, i) => {
    const key = INDEX_TO_SLIDE_KEY[i];
    if (key) captions[key] = slideToCaption(slide);
  });
  return captions;
}

export function captionsToProjectPatch(
  project: CarouselProject,
  captions: Captions
): CarouselProject {
  const slides = project.slides.map((slide, i) => {
    const key = INDEX_TO_SLIDE_KEY[i];
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

/** Bootstrap a project from legacy captions-only editor state. */
export function hydrateProjectFromCaptions(
  captions: Captions,
  options?: { framework?: StoryFramework; topic?: string }
): CarouselProject {
  const baseline = runStoryEnginePipeline({
    topic: options?.topic ?? "Imported carousel",
    framework: options?.framework ?? "transformation",
  }).project;

  return captionsToProjectPatch(
    {
      ...baseline,
      ...createEmptyProjectFields(),
    },
    captions
  );
}

export function getSlideIdForIndex(
  project: CarouselProject | null,
  slideIndex: number
): string | null {
  if (!project) return null;
  return project.slides[slideIndex]?.id ?? null;
}

export function getSlideIndexForKey(
  project: CarouselProject | null,
  key: SlideKey
): number {
  return SLIDE_KEY_TO_INDEX[key] ?? 0;
}

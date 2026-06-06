import { INDEX_TO_SLIDE_KEY, projectToCaptions } from "@/lib/story-engine/adapters";
import {
  type Captions,
  SLIDE_KEYS,
  type SlideKey,
} from "@/lib/slides";

import type {
  CarouselProject,
  CarouselRenderModel,
  RenderedSlideView,
  Slide,
} from "@/lib/story-engine/types";

function placeholderSlide(index: number): Slide {
  const role = `slide_${index}`;
  return {
    id: `placeholder_${index}`,
    role,
    headline: "",
    body: "",
    visualPlan: {
      visualType: "hero",
      layout: "center",
      overlayStyle: "editorial",
    },
  };
}

/**
 * Derive all UI-facing carousel state from project JSON.
 * Maps first N project slides to legacy 6 slide keys by index.
 */
export function renderCarousel(project: CarouselProject): CarouselRenderModel {
  const captions = projectToCaptions(project);

  const slides: RenderedSlideView[] = SLIDE_KEYS.map((key, index) => {
    const slide = project.slides[index] ?? placeholderSlide(index);
    return {
      index,
      slide,
      displayText: captions[key as SlideKey],
      captionKey: key,
    };
  });

  return {
    project,
    slides,
    score: project.score,
  };
}

export type CarouselEditorSlice = {
  captions: Captions;
  project: CarouselProject;
  score: CarouselProject["score"];
  selectedSlide: RenderedSlideView | null;
};

export function renderCarouselForEditor(
  project: CarouselProject,
  selectedIndex = 0
): CarouselEditorSlice {
  const model = renderCarousel(project);
  return {
    captions: model.slides.reduce((acc, row) => {
      acc[row.captionKey as keyof Captions] = row.displayText;
      return acc;
    }, {} as Captions),
    project: model.project,
    score: model.score,
    selectedSlide: model.slides[selectedIndex] ?? null,
  };
}

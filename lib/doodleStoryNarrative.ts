import type { Captions } from "@/lib/slides";
import { createEmptyCaptions } from "@/lib/draftStorage";
import { generateEditorialCarouselCopy } from "@/lib/editorialCopy";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export function generateDoodleStoryNarrative(input: {
  analysis: VisualAnalysis;
  brandCta?: string;
}): { hook: string; slides: string[]; cta: string; captions: Captions } {
  const { analysis, brandCta } = input;
  const copy = generateEditorialCarouselCopy({ analysis, brandCta });
  const hook = copy.hook;
  const slides = copy.slides;
  const cta = copy.cta;

  const captions: Captions = {
    ...createEmptyCaptions(),
    hook,
    slide1: slides[0],
    slide2: slides[1],
    slide3: slides[2],
    slide4: slides[3],
    cta,
  };

  return { hook, slides, cta, captions };
}

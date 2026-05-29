import { generateDoodleStoryCaptions } from "@/lib/editorialDoodleStoryMode";
import type { Captions } from "@/lib/slides";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export function generateDoodleStoryNarrative(input: {
  analysis: VisualAnalysis;
  brandCta?: string;
}): { hook: string; slides: string[]; cta: string; captions: Captions } {
  const captions = generateDoodleStoryCaptions(input);
  return {
    hook: captions.hook,
    slides: [
      captions.slide1,
      captions.slide2,
      captions.slide3,
      captions.slide4,
    ],
    cta: captions.cta,
    captions,
  };
}

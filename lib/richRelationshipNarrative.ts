import type { Captions } from "@/lib/slides";
import { createEmptyCaptions } from "@/lib/draftStorage";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import {
  getRelationshipCaption,
  getRelationshipHook,
  getRelationshipCta,
} from "@/lib/foodLanguage";

export function generateRichRelationshipNarrative(input: {
  analysis: VisualAnalysis;
  brandCta?: string;
}): { hook: string; slides: string[]; cta: string; captions: Captions } {
  const { analysis, brandCta } = input;

  const hook = getRelationshipHook(analysis);
  const slides = [
    getRelationshipCaption(analysis, "warm"),
    getRelationshipCaption(analysis, "contrast"),
    getRelationshipCaption(analysis, "witty"),
    getRelationshipCaption(analysis, "memory"),
    "",
  ];
  const cta = brandCta?.trim() || getRelationshipCta(analysis);

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

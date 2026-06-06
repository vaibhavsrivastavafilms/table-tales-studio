import { generateDoodleStoryCaptions } from "@/lib/editorialDoodleStoryMode";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type EditorialBeat =
  | "hook"
  | "sensory"
  | "moment"
  | "witty"
  | "share"
  | "cta";

export function generateEditorialCarouselCopy(input: {
  analysis: VisualAnalysis;
  brandCta?: string;
}): {
  hook: string;
  slides: string[];
  cta: string;
} {
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
  };
}

export function formatEditorialCaption(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }
  const words = trimmed.split(/\s+/);
  if (words.length <= 3) return [trimmed.toUpperCase()];
  const third = Math.ceil(words.length / 3);
  return [
    words.slice(0, third).join(" ").toUpperCase(),
    words.slice(third, third * 2).join(" ").toUpperCase(),
    words.slice(third * 2).join(" ").toUpperCase(),
  ].filter(Boolean);
}

export function editorialHighlightWords(): string[] {
  return [];
}

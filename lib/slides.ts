export const SLIDE_KEYS = [
  "hook",
  "slide1",
  "slide2",
  "slide3",
  "slide4",
  "cta",
] as const;

export type SlideKey = (typeof SLIDE_KEYS)[number];

export type Captions = Record<SlideKey, string>;

export const SLIDE_COUNT = SLIDE_KEYS.length;

/** Doodle Café carousel renderer outputs 8 Instagram slides. */
export const DOODLE_CAFE_SLIDE_COUNT = 8;

export function slideCountForTemplate(templateId?: string): number {
  return templateId === "doodle-story" ? DOODLE_CAFE_SLIDE_COUNT : SLIDE_COUNT;
}

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

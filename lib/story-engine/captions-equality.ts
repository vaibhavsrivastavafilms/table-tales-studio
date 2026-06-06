import { SLIDE_KEYS, type Captions } from "@/lib/slides";

/** Shallow compare caption fields — stable for skip-no-op store updates. */
export function captionsAreEqual(a: Captions, b: Captions): boolean {
  for (const key of SLIDE_KEYS) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

"use client";

import { useCallback } from "react";
import { captionsAreEqual } from "@/lib/story-engine/captions-equality";
import {
  selectCaptions,
  useCarouselProjectStore,
} from "@/lib/story-engine/store";
import type { Captions } from "@/lib/slides";

/**
 * Captions read from store cache (stable reference until project/captions change).
 * Writes go only through patchCaptions — never dual-write with React setState.
 */
export function useCarouselCaptions(): [
  Captions,
  (next: Captions | ((prev: Captions) => Captions)) => void,
] {
  const captions = useCarouselProjectStore(selectCaptions);
  const patchCaptions = useCarouselProjectStore((s) => s.patchCaptions);

  const setCaptions = useCallback(
    (next: Captions | ((prev: Captions) => Captions)) => {
      const prev = useCarouselProjectStore.getState().captions;
      const resolved = typeof next === "function" ? next(prev) : next;
      if (typeof next === "function" && captionsAreEqual(prev, resolved)) {
        return;
      }
      patchCaptions(resolved);
    },
    [patchCaptions]
  );

  return [captions, setCaptions];
}

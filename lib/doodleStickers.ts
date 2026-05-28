import { buildDoodleComposition } from "@/lib/doodleComposition";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";

/** @deprecated Use buildDoodleComposition */
export type DoodleStoryLayout = ReturnType<typeof buildDoodleComposition>;

export function generateDoodleStoryLayout(input: {
  caption: string;
  slideIndex: number;
  mood?: string;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
}): DoodleStoryLayout {
  return buildDoodleComposition({
    caption: input.caption,
    slideIndex: input.slideIndex,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
    mood: input.mood,
  });
}

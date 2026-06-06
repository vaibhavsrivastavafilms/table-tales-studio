import type { Rect } from "@/lib/carousel-renderer/types";

/** Semantic regions detected (or inferred) in a restaurant photo. */
export type SubjectAnchors = {
  heroDish?: Rect;
  secondaryDish?: Rect;
  drink?: Rect;
  garnish?: Rect;
  table?: Rect;
  people?: Rect;
  interior?: Rect;
  logoArea?: Rect;
};

export type RankedNegativeSpace = {
  rect: Rect;
  score: number;
  label: string;
};

export type SubjectAnalysis = {
  anchors: SubjectAnchors;
  negativeSpace: RankedNegativeSpace[];
  confidence: number;
  reasoning: string[];
  /** Union rect of protected subjects — legacy foodSafe */
  protectedRegion: Rect;
  objectPosition: string;
};

/** Future Gemini Vision response shape (not wired yet). */
export type GeminiSubjectDetection = {
  subjects: Array<{
    id: keyof SubjectAnchors;
    box: { x: number; y: number; w: number; h: number };
    confidence: number;
  }>;
  negativeRegions?: Array<{ box: { x: number; y: number; w: number; h: number }; score: number }>;
};

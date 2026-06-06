/**
 * Future path: Gemini Vision → SubjectAnchors
 *
 * 1. POST image bytes + prompt to Gemini 2.x with structured JSON schema
 * 2. Map normalized 0–1 boxes → 1080×1350 rects
 * 3. Merge with heuristic analyzeSubjects() when confidence low
 *
 * Env: GEMINI_API_KEY (server-only)
 */

import type { GeminiSubjectDetection } from "@/lib/carousel-renderer/subject-types";
import type { PhotoAsset } from "@/lib/story-engine/types";

export const GEMINI_SUBJECT_PROMPT = `Detect restaurant photo subjects. Return JSON only.
Subjects: heroDish, secondaryDish, drink, garnish, table, people, interior.
Boxes normalized 0-1 (x,y,w,h). List quiet negativeSpace regions for text overlay.`;

export type GeminiSubjectOptions = {
  apiKey?: string;
  model?: string;
};

/**
 * Placeholder — returns null until Vision API is wired.
 * Call site should fall back to analyzeSubjectsFromAsset().
 */
export async function detectSubjectsWithGemini(
  _asset: PhotoAsset,
  _options?: GeminiSubjectOptions
): Promise<GeminiSubjectDetection | null> {
  return null;
}

export function isGeminiSubjectDetectionEnabled(): boolean {
  return (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_GEMINI_SUBJECTS === "true" &&
    Boolean(process.env.GEMINI_API_KEY)
  );
}

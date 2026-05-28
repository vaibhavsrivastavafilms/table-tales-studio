import type { Captions } from "@/lib/slides";
import { createEmptyCaptions } from "@/lib/draftStorage";

const FALLBACK_CAPTIONS: Captions = {
  hook: "Street food isn't just food, it's emotion.",
  slide1: "Every corner has a story to tell.",
  slide2: "From spicy bites to sweet delights.",
  slide3: "Flavors that bring people together.",
  slide4: "Some meals become memories forever.",
  cta: "Tag your foodie crew & explore your city.",
};

export type GenerateStoryPayload = {
  template: string;
  imageCount: number;
};

export type GenerateStoryResult =
  | { ok: true; captions: Captions }
  | { ok: false; error: string; captions: Captions };

function normalizeCaptions(data: unknown): Captions {
  const base = createEmptyCaptions();
  if (!data || typeof data !== "object") return base;

  const record = data as Record<string, unknown>;
  for (const key of Object.keys(base) as (keyof Captions)[]) {
    if (typeof record[key] === "string") {
      base[key] = record[key];
    }
  }
  return base;
}

export async function generateStory(
  payload: GenerateStoryPayload
): Promise<GenerateStoryResult> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return {
        ok: false,
        error: "Invalid response from story API.",
        captions: FALLBACK_CAPTIONS,
      };
    }

    const captions = normalizeCaptions(data);

    if (!res.ok) {
      return {
        ok: false,
        error: "Story generation unavailable. Using fallback captions.",
        captions,
      };
    }

    return { ok: true, captions };
  } catch {
    return {
      ok: false,
      error: "Network error while generating story.",
      captions: FALLBACK_CAPTIONS,
    };
  }
}

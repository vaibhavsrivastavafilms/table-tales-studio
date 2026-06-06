import {
  cacheKey,
  dataUrlToBlobUrl,
  getCachedOverlayUrl,
  setCachedOverlayUrl,
} from "@/lib/aiDesignCache";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import type { EditorialLayoutPlan } from "@/lib/editorialLayouts";
import { withPipelineTimeout } from "@/lib/pipelineInstrumentation";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type EditorialRedesignAsset = {
  slideIndex: number;
  overlayUrl: string | null;
  collageUrl: string | null;
  backgroundUrl: string | null;
  source: "ai" | "procedural" | "loading";
  loading?: boolean;
};

export function buildRedesignPrompt(input: {
  slideIndex: number;
  caption: string;
  composition: EditorialLayoutPlan;
  analysis: VisualAnalysis;
  mode: AiDesignModeId;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
}): string {
  const ref = input.styleReference;
  const vision = input.styleVision;
  const dna = vision?.styleDna;

  const comp = input.composition.composition;
  const minimal = comp === "minimal-editorial";

  const lines = [
    "Professional food photography retouch for a premium Instagram editorial carousel.",
    `Slide ${input.slideIndex} mood: ${input.mood ?? input.analysis.mood ?? "warm cinematic"}.`,
    `Frame intent: ${comp}, natural ${input.composition.backgroundTreatment} backdrop.`,
    "CRITICAL: Keep the exact same dish, plating, ingredients, and restaurant identity as the source photo.",
    "Realistic only — no surreal food, no fantasy props, no melted shapes, no AI artifacts.",
    minimal
      ? "Subtle grade: soft light, gentle depth, generous negative space, quiet luxury."
      : comp === "collage"
        ? "Editorial depth: one soft paper layer, gentle shadow under subject, restrained warmth."
        : "Hero framing: subject dominates frame, cinematic lighting, clean edges.",
    "Enhance: composition, depth, mood lighting, subtle layering — not illustration.",
    "Do NOT add readable text, logos, watermarks, or busy sticker clutter in the image.",
    input.slideIndex === 5
      ? "Allow at most 1–2 small hand-drawn accent marks near edges only."
      : "No doodles or stickers in the image.",
  ];

  if (ref) {
    lines.push(
      `Match reference energy: ${ref.aesthetic}, stickers ${ref.stickerStyle}, composition ${ref.compositionStyle}, tone ${ref.emotionalTone}.`
    );
  }
  if (dna) {
    lines.push(
      `Reference rhythm — spacing ${dna.spacing}, density ${dna.density}, hierarchy ${dna.hierarchy}, stickers ${dna.stickers}.`
    );
  }
  if (vision?.inspiredBySummary) {
    lines.push(`Inspired by: ${vision.inspiredBySummary}`);
  }

  return lines.join(" ");
}

export async function fetchEditorialRedesign(body: {
  prompt: string;
  slideIndex: number;
  mode: AiDesignModeId;
  composition: EditorialLayoutPlan["composition"];
  imageUrl: string;
}): Promise<{
  imageUrl: string | null;
  skipped?: boolean;
  error?: string;
}> {
  const res = await fetch("/api/ai-redesign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    imageUrl?: string;
    skipped?: boolean;
    error?: string;
  };
  if (!res.ok) {
    return { imageUrl: null, error: data.error ?? "Redesign failed" };
  }
  if (data.skipped || !data.imageUrl) {
    return { imageUrl: null, skipped: true, error: data.error };
  }
  return { imageUrl: data.imageUrl };
}

export async function generateSlideRedesign(
  slideIndex: number,
  caption: string,
  imageUrl: string,
  input: {
    mode: AiDesignModeId;
    composition: EditorialLayoutPlan;
    analysis: VisualAnalysis;
    styleReference?: StyleReference | null;
    styleVision?: StyleVisionResult | null;
    mood?: string;
  },
  signal?: AbortSignal
): Promise<EditorialRedesignAsset> {
  const prompt = buildRedesignPrompt({
    slideIndex,
    caption,
    composition: input.composition,
    analysis: input.analysis,
    mode: input.mode,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
    mood: input.mood,
  });

  const key = `redesign|${cacheKey({
    mode: input.mode,
    slideIndex,
    caption: prompt.slice(0, 80),
    mood: input.mood ?? input.analysis.mood ?? "editorial",
  })}|${imageUrl.slice(0, 48)}`;
  const cached = getCachedOverlayUrl(key);
  if (cached) {
    return {
      slideIndex,
      overlayUrl: cached,
      collageUrl: cached,
      backgroundUrl: null,
      source: "ai",
    };
  }

  if (signal?.aborted) {
    return {
      slideIndex,
      overlayUrl: null,
      collageUrl: null,
      backgroundUrl: null,
      source: "procedural",
    };
  }

  try {
    const result = await withPipelineTimeout(
      `redesign-slide-${slideIndex}`,
      20_000,
      () =>
        fetchEditorialRedesign({
          prompt,
          slideIndex,
          mode: input.mode,
          composition: input.composition.composition,
          imageUrl,
        }),
      { imageUrl: null, skipped: true, error: "Redesign timed out" }
    );

    if (!result.imageUrl) {
      return {
        slideIndex,
        overlayUrl: null,
        collageUrl: null,
        backgroundUrl: null,
        source: "procedural",
      };
    }

    const blob = dataUrlToBlobUrl(result.imageUrl) ?? result.imageUrl;
    setCachedOverlayUrl(key, blob);

    return {
      slideIndex,
      overlayUrl: blob,
      collageUrl: blob,
      backgroundUrl: null,
      source: "ai",
    };
  } catch (err) {
    console.warn("[TableTales:pipeline] redesign slide failed", {
      slideIndex,
      message: err instanceof Error ? err.message : String(err),
    });
    return {
      slideIndex,
      overlayUrl: null,
      collageUrl: null,
      backgroundUrl: null,
      source: "procedural",
    };
  }
}

export async function runEditorialRedesignPipeline(
  slides: { slideIndex: number; caption: string; imageUrl: string }[],
  input: {
    mode: AiDesignModeId;
    compositions: Map<number, EditorialLayoutPlan>;
    analysis: VisualAnalysis;
    styleReference?: StyleReference | null;
    styleVision?: StyleVisionResult | null;
    mood?: string;
  },
  options?: {
    concurrency?: number;
    signal?: AbortSignal;
    onSlide?: (asset: EditorialRedesignAsset) => void;
  }
): Promise<Map<number, EditorialRedesignAsset>> {
  const out = new Map<number, EditorialRedesignAsset>();
  const queue = [...slides];
  const concurrency = options?.concurrency ?? 2;

  async function worker() {
    while (queue.length > 0) {
      if (options?.signal?.aborted) return;
      const item = queue.shift();
      if (!item) return;

      const composition =
        input.compositions.get(item.slideIndex) ??
        input.compositions.values().next().value;
      if (!composition) continue;

      const pending: EditorialRedesignAsset = {
        slideIndex: item.slideIndex,
        overlayUrl: null,
        collageUrl: null,
        backgroundUrl: null,
        source: "loading",
        loading: true,
      };
      out.set(item.slideIndex, pending);
      options?.onSlide?.(pending);

      try {
        const asset = await generateSlideRedesign(
          item.slideIndex,
          item.caption,
          item.imageUrl,
          {
            mode: input.mode,
            composition,
            analysis: input.analysis,
            styleReference: input.styleReference,
            styleVision: input.styleVision,
            mood: input.mood,
          },
          options?.signal
        );
        out.set(item.slideIndex, asset);
        options?.onSlide?.(asset);
      } catch (err) {
        console.warn("[TableTales:pipeline] redesign worker slide failed", {
          slideIndex: item.slideIndex,
          message: err instanceof Error ? err.message : String(err),
        });
        const fallback: EditorialRedesignAsset = {
          slideIndex: item.slideIndex,
          overlayUrl: null,
          collageUrl: null,
          backgroundUrl: null,
          source: "procedural",
        };
        out.set(item.slideIndex, fallback);
        options?.onSlide?.(fallback);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  const settled = await Promise.allSettled(workers);
  for (const result of settled) {
    if (result.status === "rejected") {
      console.warn("[TableTales:pipeline] redesign worker failed", {
        message:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  }
  return out;
}

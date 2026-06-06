import {
  interpretCreativePrompt,
  mergeAiMutationHints,
} from "@/lib/creativePromptInterpreter";
import { applyCreativeConsistency } from "@/lib/creativeConsistency";
import { guardCaptionText } from "@/lib/creativeGuardrails";
import type { SlideMutationSpec } from "@/lib/creativeMutationTypes";
export type { SlideMutationSpec } from "@/lib/creativeMutationTypes";
import type { SlideEditorPrefs } from "@/lib/slideEditorPrefs";
import type { SlideArtDirection } from "@/lib/slideArtDirector";
import { DOODLE_STORY_STYLE } from "@/lib/editorialDoodleStoryMode";
import type { DynamicTypographyPlan } from "@/lib/aiTypographyEngine";
import type { EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";

export type SlideMutationResult = {
  direction: SlideArtDirection;
  prefs: SlideEditorPrefs;
  caption?: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function mulEmotional(
  emotional: EmotionalStyleProfile,
  spec: SlideMutationSpec
): EmotionalStyleProfile {
  const e = spec.emotional ?? {};
  const dMul = spec.doodleDensityMul ?? 1;
  return {
    ...emotional,
    doodleDensity: clamp(
      (e.doodleDensity ?? emotional.doodleDensity) * dMul,
      0.08,
      1
    ),
    typographyScale: clamp(
      (e.typographyScale ?? emotional.typographyScale) *
        (spec.typographyScaleMul ?? 1),
      0.75,
      1.35
    ),
    overlayWarmth: clamp(
      (e.overlayWarmth ?? emotional.overlayWarmth) * (spec.warmthMul ?? 1),
      0.2,
      1.2
    ),
    gradientStrength: clamp(
      e.gradientStrength ?? emotional.gradientStrength,
      0.35,
      0.95
    ),
    stickerEnergy: clamp(
      e.stickerEnergy ?? emotional.stickerEnergy,
      0.15,
      1
    ),
    photoContrast: clamp(
      e.photoContrast ?? emotional.photoContrast,
      0.95,
      1.15
    ),
    photoSaturation: clamp(
      e.photoSaturation ?? emotional.photoSaturation,
      0.85,
      1.2
    ),
    grain: clamp(e.grain ?? emotional.grain, 0.02, 0.14),
  };
}

function patchTypographyPlan(
  plan: DynamicTypographyPlan | undefined,
  scaleMul: number,
  clutterReduction: number
): DynamicTypographyPlan | undefined {
  if (!plan?.blocks?.length) return plan;
  const maxBlocks =
    clutterReduction > 0.3 ? 2 : clutterReduction > 0.15 ? 3 : plan.blocks.length;
  const blocks = plan.blocks.slice(0, maxBlocks).map((b) => ({
    ...b,
    fontSize: Math.round(b.fontSize * scaleMul),
    opacity: clamp(b.opacity * (1 + clutterReduction * 0.05), 0.5, 1),
  }));
  return { ...plan, blocks };
}

function patchCollage(
  direction: SlideArtDirection,
  spec: SlideMutationSpec
): SlideArtDirection {
  if (!direction.collage) return direction;
  const clutter = spec.clutterReduction ?? 0;
  const focal = spec.focalScaleMul ?? 1;
  const redesignMul = spec.redesignIntensityMul ?? 1;

  const layers = direction.collage.layers
    .filter((l) => {
      if (clutter < 0.25) return true;
      return l.type !== "paper" && l.type !== "photo-stack";
    })
    .map((l) => {
      if (l.type === "cutout" || l.type === "photo-bleed") {
        return {
          ...l,
          width: l.width * focal,
          height: l.height * focal,
          scale: l.scale * focal,
        };
      }
      if (l.type === "redesign") {
        return { ...l, opacity: clamp(l.opacity * redesignMul, 0.35, 0.78) };
      }
      return l;
    });

  return {
    ...direction,
    collage: { ...direction.collage, layers },
  };
}

function patchDoodles(
  direction: SlideArtDirection,
  spec: SlideMutationSpec
): SlideArtDirection {
  if (!direction.doodles) return direction;
  const mul = spec.doodleDensityMul ?? 1;
  const clutter = spec.clutterReduction ?? 0;
  const maxCount = clutter > 0.35 ? 2 : clutter > 0.2 ? 3 : 6;
  const elements = direction.doodles.procedural.elements.slice(0, maxCount);

  return {
    ...direction,
    doodles: {
      ...direction.doodles,
      density: clamp(direction.doodles.density * mul, 0.06, 0.58),
      procedural: {
        ...direction.doodles.procedural,
        elements,
        density: clamp(direction.doodles.procedural.density * mul, 0.4, 1),
      },
    },
  };
}

function shortenCaption(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 2) {
    const words = text.trim().split(/\s+/);
    return words.slice(0, 8).join(" ");
  }
  return lines.slice(0, 2).join("\n");
}

function ctaCaption(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes("SEE YOU") || upper.includes("GOOD FOOD")) return text;
  return "GOOD FOOD.\nGOOD MOOD.\nSEE YOU SOON.";
}

function buildPhotoFilter(base: string, spec: SlideMutationSpec): string {
  const warmth = spec.warmthMul ?? 1;
  const parts = [base];
  if (warmth > 1.05) parts.push("sepia(0.08)", "brightness(0.97)");
  if ((spec.emotional?.photoContrast ?? 1) > 1.03) {
    parts.push("contrast(1.05)");
  }
  if (spec.photoFilterSuffix) parts.push(spec.photoFilterSuffix);
  if ((spec.tags ?? []).includes("cinematic")) {
    parts.push("brightness(0.94)");
  }
  return parts.join(" ");
}

export function applySlideMutation(
  direction: SlideArtDirection,
  prefs: SlideEditorPrefs,
  spec: SlideMutationSpec,
  caption: string
): SlideMutationResult {
  let next: SlideArtDirection = {
    ...direction,
    emotional: mulEmotional(direction.emotional, spec),
  };

  if (direction.editorial && spec.editorial) {
    const ed = spec.editorial;
    next = {
      ...next,
      editorial: {
        ...direction.editorial,
        ...ed,
        doodleBudget: ed.doodleBudget
          ? clamp(direction.editorial.doodleBudget * ed.doodleBudget, 0.06, 0.55)
          : direction.editorial.doodleBudget,
        negativeSpace: ed.negativeSpace
          ? clamp(direction.editorial.negativeSpace + ed.negativeSpace, 0.35, 0.88)
          : direction.editorial.negativeSpace,
        asymmetryBias: ed.asymmetryBias
          ? clamp(
              direction.editorial.asymmetryBias + ed.asymmetryBias,
              0.35,
              0.85
            )
          : direction.editorial.asymmetryBias,
        collageDensity:
          ed.collageDensity !== undefined
            ? clamp(
                direction.editorial.collageDensity + ed.collageDensity,
                0.12,
                0.55
              )
            : direction.editorial.collageDensity,
        cutoutScale: ed.cutoutScale
          ? clamp(
              direction.editorial.cutoutScale * ed.cutoutScale,
              0.9,
              1.55
            )
          : direction.editorial.cutoutScale,
      },
    };
  }

  next = patchCollage(next, spec);
  next = patchDoodles(next, spec);

  next = {
    ...next,
    typographyPlan: patchTypographyPlan(
      direction.typographyPlan,
      spec.typographyScaleMul ?? 1,
      spec.clutterReduction ?? 0
    ),
    typography: {
      ...direction.typography,
      scale:
        direction.typography.scale * (spec.typographyScaleMul ?? 1),
    },
    photoFilter: buildPhotoFilter(
      direction.photoFilter || DOODLE_STORY_STYLE.photoFilter,
      spec
    ),
    reveal: 0.78,
    phase: "type",
  };

  const prefsOut: SlideEditorPrefs = {
    ...prefs,
    ...spec.prefs,
    overlayIntensity: clamp(
      prefs.overlayIntensity * (spec.overlayIntensityMul ?? 1),
      0.5,
      1.25
    ),
    typographyScale: clamp(
      prefs.typographyScale * (spec.typographyScaleMul ?? 1),
      0.8,
      1.28
    ),
    stickerDensity: clamp(
      prefs.stickerDensity * (spec.doodleDensityMul ?? 1),
      0.35,
      1.35
    ),
    doodlesEnabled:
      spec.prefs?.doodlesEnabled ?? prefs.doodlesEnabled,
  };

  let captionOut: string | undefined;
  if (spec.captionMode === "shorten") {
    captionOut = guardCaptionText(shortenCaption(caption));
  } else if (spec.captionMode === "cta") {
    captionOut = guardCaptionText(ctaCaption(caption));
  }

  next = applyCreativeConsistency(next);

  return {
    direction: next,
    prefs: prefsOut,
    caption: captionOut,
  };
}

export function cloneArtDirection(dir: SlideArtDirection): SlideArtDirection {
  return JSON.parse(JSON.stringify(dir)) as SlideArtDirection;
}

export async function fetchAiMutationHints(
  prompt: string,
  context: {
    slideIndex: number;
    caption: string;
    mood?: string;
  }
): Promise<Partial<SlideMutationSpec> | null> {
  try {
    const res = await fetch("/api/slide-creative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, ...context }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { hints?: Partial<SlideMutationSpec> };
    return data.hints ?? null;
  } catch {
    return null;
  }
}

export async function enhanceSlideFromPrompt(input: {
  prompt: string;
  direction: SlideArtDirection;
  prefs: SlideEditorPrefs;
  caption: string;
  useAi?: boolean;
}): Promise<SlideMutationResult> {
  let spec = interpretCreativePrompt(input.prompt);

  if (input.useAi) {
    const hints = await fetchAiMutationHints(input.prompt, {
      slideIndex: input.direction.slideIndex,
      caption: input.caption,
    });
    spec = mergeAiMutationHints(spec, hints);
  }

  return applySlideMutation(
    input.direction,
    input.prefs,
    spec,
    input.caption
  );
}

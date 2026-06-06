import type { SlideMutationSpec } from "@/lib/creativeMutationTypes";

type Rule = {
  match: RegExp;
  spec: SlideMutationSpec;
};

function mergeSpec(
  base: SlideMutationSpec,
  add: SlideMutationSpec
): SlideMutationSpec {
  const tags = [...new Set([...(base.tags ?? []), ...(add.tags ?? [])])];
  const emotional = { ...base.emotional, ...add.emotional };
  const editorial = { ...base.editorial, ...add.editorial };
  const prefs = { ...base.prefs, ...add.prefs };
  return {
    ...base,
    ...add,
    tags,
    emotional,
    editorial,
    prefs,
    doodleDensityMul:
      (base.doodleDensityMul ?? 1) * (add.doodleDensityMul ?? 1),
    typographyScaleMul:
      (base.typographyScaleMul ?? 1) * (add.typographyScaleMul ?? 1),
    overlayIntensityMul:
      (base.overlayIntensityMul ?? 1) * (add.overlayIntensityMul ?? 1),
    redesignIntensityMul:
      (base.redesignIntensityMul ?? 1) * (add.redesignIntensityMul ?? 1),
    warmthMul: (base.warmthMul ?? 1) * (add.warmthMul ?? 1),
    clutterReduction: Math.min(
      1,
      (base.clutterReduction ?? 0) + (add.clutterReduction ?? 0)
    ),
    focalScaleMul: (base.focalScaleMul ?? 1) * (add.focalScaleMul ?? 1),
  };
}

const RULES: Rule[] = [
  {
    match: /cinematic|moodier|moody|darker|film|drama/i,
    spec: {
      tags: ["cinematic"],
      emotional: {
        gradientStrength: 0.88,
        photoContrast: 1.06,
        photoSaturation: 0.94,
        doodleDensity: 0.88,
      },
      editorial: { negativeSpace: 0.08 },
      clutterReduction: 0.22,
      warmthMul: 0.96,
      focalScaleMul: 1.06,
    },
  },
  {
    match: /luxury|premium|high[- ]?end|refined|elegant/i,
    spec: {
      tags: ["luxury"],
      emotional: {
        doodleDensity: 0.55,
        stickerEnergy: 0.45,
        typographyScale: 0.92,
        overlayWarmth: 0.72,
      },
      editorial: { doodleBudget: 0.65, negativeSpace: 0.18 },
      prefs: { stickerDensity: 0.55, doodlesEnabled: false },
      clutterReduction: 0.35,
      doodleDensityMul: 0.45,
    },
  },
  {
    match: /minimal|less text|breathing|quiet|cleaner|simpl/i,
    spec: {
      tags: ["minimal"],
      emotional: { typographyScale: 0.9, doodleDensity: 0.7 },
      editorial: { typeMode: "minimal", negativeSpace: 0.22 },
      prefs: { typographyScale: 0.92 },
      clutterReduction: 0.4,
      doodleDensityMul: 0.7,
    },
  },
  {
    match: /pinterest|scrapbook|collage|asymmetr|floating/i,
    spec: {
      tags: ["pinterest"],
      editorial: {
        collageDensity: 0.12,
        asymmetryBias: 0.14,
        overlapDepth: 1,
      },
      emotional: { stickerEnergy: 0.72 },
      doodleDensityMul: 1.12,
    },
  },
  {
    match: /emotional|softer|gentler|warmheart|feeling/i,
    spec: {
      tags: ["emotional"],
      emotional: {
        overlayWarmth: 1.12,
        stickerEnergy: 0.58,
        typographyScale: 1.02,
      },
      warmthMul: 1.1,
      prefs: { overlayIntensity: 1.05 },
    },
  },
  {
    match: /doodle|steam|sketch|hand[- ]?drawn|accent/i,
    spec: {
      tags: ["doodles"],
      emotional: { doodleDensity: 1.28, stickerEnergy: 0.85 },
      editorial: { doodleBudget: 1.35 },
      prefs: { doodlesEnabled: true, stickerDensity: 1.2 },
      doodleDensityMul: 1.35,
    },
  },
  {
    match: /bigger type|typography|headline|larger text/i,
    spec: {
      tags: ["typography"],
      emotional: { typographyScale: 1.18 },
      prefs: { typographyScale: 1.14 },
      typographyScaleMul: 1.16,
      editorial: { typeMode: "hero-micro" },
    },
  },
  {
    match: /less text|shorter caption|reduce copy/i,
    spec: {
      tags: ["less-copy"],
      captionMode: "shorten",
      clutterReduction: 0.2,
    },
  },
  {
    match: /clutter|busy|overcrowd|simplify|reduce clutter/i,
    spec: {
      tags: ["clean"],
      clutterReduction: 0.45,
      doodleDensityMul: 0.75,
      emotional: { doodleDensity: 0.72, stickerEnergy: 0.55 },
    },
  },
  {
    match: /café|cafe|tungsten|warm light|cozy/i,
    spec: {
      tags: ["cafe"],
      warmthMul: 1.14,
      emotional: { overlayWarmth: 1.15, photoSaturation: 1.06 },
      editorial: { backgroundTreatment: "dark-cinematic" },
    },
  },
  {
    match: /focus.*(food|dish|noodle|plate|subject)|hero subject/i,
    spec: {
      tags: ["focus-food"],
      focalScaleMul: 1.12,
      editorial: { cutoutScale: 1.08, negativeSpace: 0.1 },
      clutterReduction: 0.15,
    },
  },
  {
    match: /cta|call to action|ending|see you|save this/i,
    spec: {
      tags: ["cta"],
      emotional: { typographyScale: 1.14 },
      typographyScaleMul: 1.12,
      editorial: { typographyStyle: "hero-giant", typeMode: "hero-only" },
      captionMode: "cta",
    },
  },
  {
    match: /depth|layer|dimension|parallax/i,
    spec: {
      tags: ["depth"],
      overlayIntensityMul: 1.08,
      emotional: { gradientStrength: 0.75, photoContrast: 1.04 },
      redesignIntensityMul: 1.1,
    },
  },
  {
    match: /glow|soft light|highlight/i,
    spec: {
      tags: ["glow"],
      emotional: { overlayWarmth: 1.08, gradientStrength: 0.62 },
      overlayIntensityMul: 1.06,
    },
  },
  {
    match: /editorial|magazine|campaign/i,
    spec: {
      tags: ["editorial"],
      editorial: {
        typographyStyle: "editorial-bold",
        negativeSpace: 0.12,
      },
      emotional: { typographyScale: 1.06 },
    },
  },
];

export function interpretCreativePrompt(raw: string): SlideMutationSpec {
  const prompt = raw.trim();
  if (!prompt) return { tags: [] };

  let spec: SlideMutationSpec = { tags: ["custom"], sourcePrompt: prompt };

  for (const rule of RULES) {
    if (rule.match.test(prompt)) {
      spec = mergeSpec(spec, rule.spec);
    }
  }

  return spec;
}

export function interpretQuickAction(prompt: string): SlideMutationSpec {
  return interpretCreativePrompt(prompt);
}

/** Merge AI JSON hints onto procedural spec. */
export function mergeAiMutationHints(
  base: SlideMutationSpec,
  hints: Partial<SlideMutationSpec> | null | undefined
): SlideMutationSpec {
  if (!hints) return base;
  return mergeSpec(base, { ...hints, tags: [...(base.tags ?? []), "ai"] });
}

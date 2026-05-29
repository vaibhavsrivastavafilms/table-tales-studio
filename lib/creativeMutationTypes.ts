import type { SlideEditorPrefs } from "@/lib/slideEditorPrefs";
import type { EditorialLayoutPlan } from "@/lib/editorialLayouts";

export type SlideMutationSpec = {
  tags?: string[];
  sourcePrompt?: string;
  emotional?: Partial<{
    doodleDensity: number;
    typographyScale: number;
    overlayWarmth: number;
    gradientStrength: number;
    stickerEnergy: number;
    photoContrast: number;
    photoSaturation: number;
    grain: number;
  }>;
  editorial?: Partial<
    Pick<
      EditorialLayoutPlan,
      | "doodleBudget"
      | "negativeSpace"
      | "typeMode"
      | "typographyStyle"
      | "backgroundTreatment"
      | "collageDensity"
      | "asymmetryBias"
      | "overlapDepth"
      | "cutoutScale"
    >
  >;
  prefs?: Partial<SlideEditorPrefs>;
  doodleDensityMul?: number;
  typographyScaleMul?: number;
  overlayIntensityMul?: number;
  redesignIntensityMul?: number;
  warmthMul?: number;
  clutterReduction?: number;
  focalScaleMul?: number;
  captionMode?: "shorten" | "cta" | "none";
  photoFilterSuffix?: string;
};

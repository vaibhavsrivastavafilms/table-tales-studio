import type { AiSlideDesign } from "@/lib/aiOverlayRenderer";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { composeEditorialSlide, type EditorialSlideComposition } from "@/lib/editorialCompositionEngine";
import { planDoodleRender, type DoodleRenderPlan } from "@/lib/doodleRenderEngine";
import { resolveEmotionalStyle, type EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";
import { composeTypographyLayout, type TypographyComposition } from "@/lib/aiTypographyEngine";
import { redesignLayout, type LayoutRedesign } from "@/lib/layoutRedesignEngine";
import { buildVisualHierarchy, type VisualHierarchy } from "@/lib/visualHierarchyEngine";
import { getLockedPhotoTreatment, getLockedOverlayLayers } from "@/lib/doodleCafeLock";
import { getTemplateConfig, isDoodleStoryTemplate, type TemplateId } from "@/lib/templates";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type RevealPhase = "idle" | "layout" | "type" | "doodles" | "complete";

export type SlideArtDirection = {
  slideIndex: number;
  emotional: EmotionalStyleProfile;
  layout: LayoutRedesign;
  hierarchy: VisualHierarchy;
  composition: EditorialSlideComposition;
  typography: TypographyComposition;
  doodles: DoodleRenderPlan | null;
  aiOverlay: AiSlideDesign | null;
  reveal: number;
  phase: RevealPhase;
  photoFilter: string;
  overlayLayers: ReturnType<typeof getLockedOverlayLayers>;
  accentColor: string;
  highlightColor: string;
  showQr?: boolean;
  showPin?: boolean;
};

export function directSlideArt(input: {
  slideIndex: number;
  caption: string;
  templateId: TemplateId;
  analysis: VisualAnalysis;
  mode?: AiDesignModeId;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
  width?: number;
  height?: number;
  aiOverlay?: AiSlideDesign | null;
  reveal?: number;
}): SlideArtDirection {
  const mode = input.mode ?? "doodle-cafe-story";
  const emotional = resolveEmotionalStyle({
    templateId: input.templateId,
    analysis: input.analysis,
    mode,
    mood: input.mood,
  });

  const layout = redesignLayout({
    slideIndex: input.slideIndex,
    width: input.width,
    height: input.height,
    analysis: input.analysis,
    emotional,
  });

  const hierarchy = buildVisualHierarchy(layout, emotional);
  const composition = composeEditorialSlide({
    slideIndex: input.slideIndex,
    layout,
    emotional,
    analysis: input.analysis,
    styleReference: input.styleReference,
    width: input.width,
    height: input.height,
  });

  const typography = composeTypographyLayout({
    caption: input.caption,
    slideIndex: input.slideIndex,
    layout,
    emotional,
  });

  const doodles = isDoodleStoryTemplate(input.templateId)
    ? planDoodleRender({
        caption: input.caption,
        slideIndex: input.slideIndex,
        width: input.width,
        height: input.height,
        analysis: input.analysis,
        emotional,
        layout,
        mode,
        styleReference: input.styleReference,
        styleVision: input.styleVision,
        mood: input.mood,
      })
    : null;

  const templateVisual = getTemplateConfig(input.templateId).visual;
  const photo = getLockedPhotoTreatment({
    ...templateVisual,
    imageContrast: emotional.photoContrast,
    imageSaturation: emotional.photoSaturation,
    grainOpacity: emotional.grain,
    glowStrength: templateVisual.glowStrength,
  });

  const reveal = input.reveal ?? 1;
  let phase: RevealPhase = "complete";
  if (reveal < 0.25) phase = "layout";
  else if (reveal < 0.55) phase = "type";
  else if (reveal < 0.85) phase = "doodles";
  else phase = "complete";

  return {
    slideIndex: input.slideIndex,
    emotional,
    layout,
    hierarchy,
    composition,
    typography,
    doodles,
    aiOverlay: input.aiOverlay ?? null,
    reveal,
    phase,
    photoFilter: photo.filter,
    overlayLayers: getLockedOverlayLayers(),
    accentColor: emotional.accentColor,
    highlightColor: emotional.highlightColor,
    showQr: doodles?.procedural.showQr,
    showPin: doodles?.procedural.showPin,
  };
}

import type { CreatorMemory } from "@/lib/creatorMemory";
import {
  type CreatorDirection,
  DEFAULT_CREATOR_DIRECTION,
  hookIntensityFromBalance,
  labelStoryGoal,
  pacingFromEnergy,
} from "@/lib/creatorDirection";
import { generateCreativeDirection, formatCreativeDirection } from "@/lib/directorMode";
import type { DirectorProfile } from "@/lib/directorProfile";
import { getRetentionPattern, type RetentionPattern } from "@/lib/retentionEngine";
import { resolveStoryArc, type StoryArc } from "@/lib/storyArc";
import {
  type StyleReference,
  summarizeStyleReference,
} from "@/lib/styleReference";

import type { StyleVisionResult } from "@/lib/styleVision";
import { suggestTemplateWithStyle, type TemplateSuggestion } from "@/lib/templateIntelligence";
import { arcPacingHint, getTemplateBehavior } from "@/lib/templateBehavior";
import { analyzeTextPlacement, type TextPlacementPlan } from "@/lib/textPlacement";
import type { TemplateId } from "@/lib/templates";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type CreativeDirectionResult = {
  direction: CreatorDirection;
  templateId: TemplateId;
  suggestion: TemplateSuggestion;
  arc: StoryArc;
  retentionPattern: RetentionPattern;
  placement: TextPlacementPlan;
  hookStrategy: string;
  pacingStrategy: string;
  emotionalArc: string;
  captionRhythm: string;
  ctaStyle: string;
  slideProgression: string[];
  viewerPsychology: string;
  productionNotes: string[];
  profilePatch: Partial<DirectorProfile>;
};

export function applyDirectionToProfile(
  direction: CreatorDirection,
  templateId: TemplateId
): Partial<DirectorProfile> {
  const toneMap: Record<CreatorDirection["emotion"], DirectorProfile["storytellingTone"]> = {
    warm: "cinematic",
    cozy: "emotional",
    premium: "luxury",
    sensual: "luxury",
    exciting: "street",
    emotional: "emotional",
    nostalgic: "emotional",
    "dark-cinematic": "cinematic",
  };

  return {
    preferredTemplate: templateId,
    hookIntensity: hookIntensityFromBalance(direction.viralityBalance),
    storytellingTone: toneMap[direction.emotion] ?? "cinematic",
    captionDensity: direction.captionDensity,
    pacingStyle: pacingFromEnergy(direction.energy),
    ctaStyle:
      direction.viralityBalance >= 70
        ? "high-conversion"
        : direction.viralityBalance <= 30
          ? "subtle"
          : "creator",
  };
}

export function buildCreativeDirection(input: {
  analysis: VisualAnalysis;
  direction?: CreatorDirection;
  memory: Pick<
    CreatorMemory,
    "captionTone" | "nichePreference" | "viralMode" | "platformMode"
  >;
  templateId: TemplateId;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  forceTemplateId?: TemplateId;
}): CreativeDirectionResult {
  const direction = input.direction ?? DEFAULT_CREATOR_DIRECTION;
  const suggestion = suggestTemplateWithStyle(
    input.analysis,
    input.styleReference,
    input.forceTemplateId ?? input.templateId
  );
  const templateId = input.forceTemplateId ?? input.templateId;
  const arc = resolveStoryArc(direction.storyGoal, templateId);
  const behavior = getTemplateBehavior(templateId, direction);
  const placement = analyzeTextPlacement({
    analysis: input.analysis,
    styleReference: input.styleReference,
  });
  const retentionPattern = getRetentionPattern(
    input.analysis.energy,
    pacingFromEnergy(direction.energy),
    hookIntensityFromBalance(direction.viralityBalance)
  );

  const prodDir = generateCreativeDirection(
    templateId,
    input.memory.viralMode,
    input.memory.nichePreference
  );
  const productionNotes = [
    ...formatCreativeDirection(prodDir),
    behavior.pacingNote,
    arcPacingHint(arc.id),
  ];

  if (input.styleVision) {
    productionNotes.push(
      `Reference (${Math.round(input.styleVision.confidence * 100)}%): ${input.styleVision.inspiredBySummary}`
    );
  } else if (input.styleReference) {
    productionNotes.push(`Style language: ${summarizeStyleReference(input.styleReference)}`);
  }

  const viewerPsychology = [
    `${labelStoryGoal(direction.storyGoal)} for ${direction.audience.replace(/-/g, " ")}.`,
    arc.emotionalArc,
    placement.negativeSpaceScore > 0.65
      ? "High save potential — clean frames + curiosity gaps."
      : "Dense story — reward completion swipes.",
  ].join(" ");

  return {
    direction,
    templateId,
    suggestion,
    arc,
    retentionPattern,
    placement,
    hookStrategy: `${arc.hookBeat} ${retentionPattern.label}.`,
    pacingStrategy: `${pacingFromEnergy(direction.energy)} · ${behavior.pacingNote}`,
    emotionalArc: arc.emotionalArc,
    captionRhythm:
      direction.captionDensity === "minimal"
        ? "Sparse poetic lines — one thought per slide."
        : direction.captionDensity === "dense"
          ? "Punchy stacked beats — retention-first rhythm."
          : "Balanced cinematic cadence — hook, build, payoff.",
    ctaStyle:
      direction.viralityBalance >= 70
        ? "High-conversion social CTA — save, share, tag."
        : direction.viralityBalance <= 30
          ? "Subtle invitation — experience in person."
          : "Creator-forward community CTA.",
    slideProgression: arc.slideProgression,
    viewerPsychology,
    productionNotes,
    profilePatch: applyDirectionToProfile(direction, templateId),
  };
}

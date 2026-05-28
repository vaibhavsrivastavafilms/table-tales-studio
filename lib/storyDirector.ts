import type { CreatorMemory } from "@/lib/creatorMemory";
import {
  getDirectorProfileSnapshot,
  loadDirectorProfile,
  type DirectorProfile,
} from "@/lib/directorProfile";
import {
  applyGenerationVariation,
  getRecentGenerationPhrases,
  recordGenerationHistory,
} from "@/lib/generationVariation";
import { generateNarrative } from "@/lib/narrativeEngine";
import { getPrimaryNarrative } from "@/lib/storyAngles";
import { applySignatureLanguage } from "@/lib/signatureLanguage";
import { adaptCaptionsToStyle } from "@/lib/styleCaptions";
import type { StyleReference } from "@/lib/styleReference";
import { summarizeStyleReference } from "@/lib/styleReference";
import {
  explainTemplateChoice,
  suggestTemplateWithStyle,
  type TemplateSuggestion,
} from "@/lib/templateIntelligence";
import { getTemplateConfig, type TemplateId } from "@/lib/templates";
import { analyzeImageSet, type VisualAnalysis } from "@/lib/visualAnalysis";
import type { Captions } from "@/lib/slides";

export type VisualStoryBrief = {
  detectedTemplate: string;
  narrativeAngle: string;
  mood: string;
  cuisine?: string;
  confidence: number;
  reason: string;
  directorTone?: string;
  referenceStyle?: string;
};

export type StoryDirectorResult = {
  analysis: VisualAnalysis;
  suggestion: TemplateSuggestion;
  brief: VisualStoryBrief;
  captions: Captions;
};

export function formatVisualSummary(brief: VisualStoryBrief): string {
  const parts = [
    `detected style: ${brief.detectedTemplate}`,
    `narrative: ${brief.narrativeAngle}`,
    `mood: ${brief.mood}`,
  ];
  if (brief.cuisine) parts.push(`cuisine: ${brief.cuisine}`);
  if (brief.directorTone) parts.push(`director tone: ${brief.directorTone}`);
  if (brief.referenceStyle) parts.push(`reference style: ${brief.referenceStyle}`);
  parts.push(`reason: ${brief.reason}`);
  return parts.join("; ");
}

function resolveTemplateId(
  suggestion: TemplateSuggestion,
  memory: Pick<CreatorMemory, "preferredTemplateId">,
  profile: DirectorProfile,
  forceTemplateId?: TemplateId
): TemplateId {
  if (forceTemplateId) return forceTemplateId;
  if (memory.preferredTemplateId) return memory.preferredTemplateId;
  if (profile.sessionCount >= 3 && suggestion.confidence < 0.88) {
    return profile.preferredTemplate;
  }
  return suggestion.template;
}

function templateDisplayName(
  templateId: TemplateId,
  suggestion: TemplateSuggestion
): string {
  if (templateId === suggestion.template) return suggestion.displayName;
  return getTemplateConfig(templateId).name;
}

function finalizeCaptions(
  captions: Captions,
  profile: DirectorProfile,
  analysis: VisualAnalysis,
  options?: { isRegenerate?: boolean; previousCaptions?: Captions }
): Captions {
  let next = captions;
  next = applyGenerationVariation(next, {
    profile,
    analysis,
    previousCaptions: options?.previousCaptions,
    isRegenerate: options?.isRegenerate,
  });
  next = applySignatureLanguage(next, profile, getRecentGenerationPhrases());
  recordGenerationHistory(next);
  return next;
}

export async function runVisualStoryPipeline(input: {
  imageUrls: string[];
  fileNames?: string[];
  memory: Pick<
    CreatorMemory,
    | "captionTone"
    | "nichePreference"
    | "viralMode"
    | "platformMode"
    | "preferredTemplateId"
  >;
  brandCta?: string;
  hookPattern?: string;
  forceTemplateId?: TemplateId;
  profile?: DirectorProfile;
  isRegenerate?: boolean;
  previousCaptions?: Captions;
  styleReference?: StyleReference | null;
}): Promise<StoryDirectorResult> {
  const profile = input.profile ?? getDirectorProfileSnapshot();
  const sources = input.imageUrls.map((url, i) => ({
    url,
    name: input.fileNames?.[i],
  }));

  const analysis = await analyzeImageSet(sources);
  const narrative = getPrimaryNarrative(analysis);
  const suggestion = suggestTemplateWithStyle(
    analysis,
    input.styleReference,
    input.forceTemplateId
  );

  const templateId = resolveTemplateId(
    suggestion,
    input.memory,
    profile,
    input.forceTemplateId
  );

  const generated = generateNarrative({
    analysis,
    memory: input.memory,
    templateId,
    brandCta: input.brandCta,
    hookPattern: input.hookPattern,
    profile,
    styleReference: input.styleReference,
  });

  let captions = finalizeCaptions(generated.captions, profile, analysis, {
    isRegenerate: input.isRegenerate,
    previousCaptions: input.previousCaptions,
  });
  captions = adaptCaptionsToStyle(captions, input.styleReference);

  const brief: VisualStoryBrief = {
    detectedTemplate: templateDisplayName(templateId, suggestion),
    narrativeAngle: narrative.primary,
    mood: input.styleReference?.emotionalTone ?? analysis.mood ?? "warm cinematic",
    cuisine: analysis.cuisine,
    confidence: suggestion.confidence,
    reason: explainTemplateChoice(analysis, templateId),
    directorTone: profile.storytellingTone,
    referenceStyle: input.styleReference
      ? summarizeStyleReference(input.styleReference)
      : undefined,
  };

  return {
    analysis,
    suggestion: { ...suggestion, template: templateId },
    brief,
    captions,
  };
}

/** Regenerate using stored analysis — preserves mood and director personality. */
export function regeneratePersonalizedStory(input: {
  analysis: VisualAnalysis;
  memory: Pick<
    CreatorMemory,
    "captionTone" | "nichePreference" | "viralMode" | "platformMode"
  >;
  templateId: TemplateId;
  brandCta?: string;
  hookPattern?: string;
  previousCaptions: Captions;
  profile?: DirectorProfile;
  styleReference?: StyleReference | null;
}): StoryDirectorResult {
  const profile = input.profile ?? loadDirectorProfile();
  const narrative = getPrimaryNarrative(input.analysis);
  const suggestion = suggestTemplateWithStyle(
    input.analysis,
    input.styleReference,
    input.templateId
  );

  const generated = generateNarrative({
    analysis: input.analysis,
    memory: input.memory,
    templateId: input.templateId,
    brandCta: input.brandCta,
    hookPattern: input.hookPattern,
    profile,
    styleReference: input.styleReference,
  });

  let captions = finalizeCaptions(generated.captions, profile, input.analysis, {
    isRegenerate: true,
    previousCaptions: input.previousCaptions,
  });
  captions = adaptCaptionsToStyle(captions, input.styleReference);

  const brief: VisualStoryBrief = {
    detectedTemplate: templateDisplayName(input.templateId, suggestion),
    narrativeAngle: narrative.primary,
    mood:
      input.styleReference?.emotionalTone ??
      input.analysis.mood ??
      "warm cinematic",
    cuisine: input.analysis.cuisine,
    confidence: suggestion.confidence,
    reason: explainTemplateChoice(input.analysis, input.templateId),
    directorTone: profile.storytellingTone,
    referenceStyle: input.styleReference
      ? summarizeStyleReference(input.styleReference)
      : undefined,
  };

  return {
    analysis: input.analysis,
    suggestion: { ...suggestion, template: input.templateId },
    brief,
    captions,
  };
}

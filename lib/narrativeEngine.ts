import type { CreatorMemory } from "@/lib/creatorMemory";
import { intensityToViralMode } from "@/lib/directorLearning";
import type { DirectorProfile } from "@/lib/directorProfile";
import { describeDish, enhanceFoodCaption } from "@/lib/foodLanguage";
import type { PlatformModeId } from "@/lib/platformModes";
import { getPlatformMode } from "@/lib/platformModes";
import {
  injectRetentionHooks,
  getRetentionPattern,
  optimizeCarouselFlow,
} from "@/lib/retentionEngine";
import type { Captions } from "@/lib/slides";
import { createEmptyCaptions } from "@/lib/draftStorage";
import { getPrimaryNarrative } from "@/lib/storyAngles";
import type { TemplateId } from "@/lib/templates";
import { getTemplateConfig } from "@/lib/templates";
import type { StyleReference } from "@/lib/styleReference";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import { generateRichRelationshipNarrative } from "@/lib/richRelationshipNarrative";
import { generateDoodleStoryNarrative } from "@/lib/doodleStoryNarrative";
import { isDoodleStoryTemplate, isRichRelationshipTemplate } from "@/lib/templates";
import { enhanceHookLocally } from "@/lib/viralHooks";

export type GeneratedNarrative = {
  hook: string;
  slides: string[];
  cta: string;
  captions: Captions;
};

function buildHook(
  analysis: VisualAnalysis,
  templateId: TemplateId,
  profile: DirectorProfile,
  viralSeed?: string
): string {
  const narrative = getPrimaryNarrative(analysis);
  const template = getTemplateConfig(templateId).name;
  const angle =
    profile.favoriteNarrativeAngles[0] ?? narrative.primary;

  const hooks: Record<string, string> = {
    "hidden gem discovery": `Nobody talks about this ${analysis.cuisine ?? "spot"} — until now.`,
    "luxury dining experience": `This isn't dinner. It's a ${template} ritual.`,
    "monsoon café mood": `Rain outside. Warmth inside. ${analysis.dishType ?? "Coffee"} like memory.`,
    "chef craftsmanship": `Watch the hands. That's where the ${template} story lives.`,
    "street energy": `One stall. One line. One obsession.`,
    "founder passion story": `We didn't open a restaurant. We opened a promise.`,
  };

  const viralHooks: Record<DirectorProfile["hookIntensity"], string> = {
    viral: `People are driving miles for this ${analysis.cuisine ?? "dish"}.`,
    balanced: hooks[angle] ?? hooks[narrative.primary] ?? `Your ${analysis.mood ?? "cinematic"} story starts here.`,
    soft: `Something gentle waits inside this ${analysis.ambience ?? "room"}.`,
  };

  const base = viralSeed?.trim() || viralHooks[profile.hookIntensity];
  return enhanceHookLocally(base, intensityToViralMode(profile.hookIntensity));
}

export function generateSlideFlow(
  analysis: VisualAnalysis,
  memory: Pick<CreatorMemory, "captionTone" | "nichePreference">,
  templateId: TemplateId,
  profile: DirectorProfile
): string[] {
  const tone = memory.captionTone;
  const dishLine = describeDish(analysis, tone, profile);
  const templateName = getTemplateConfig(templateId).name;

  const slides = [
    enhanceFoodCaption(
      `Steam rises. ${analysis.lighting ?? "Light"} paints every edge.`,
      analysis,
      tone,
      profile
    ),
    dishLine,
    `${analysis.ambience ?? "The room"} holds its breath — ${analysis.mood ?? "cinematic"} energy builds.`,
    `What makes this ${templateName} moment impossible to fake: craft you can taste.`,
    `You'll remember this longer than the caption — ${analysis.visualTone ?? "warm frames"}.`,
    "",
  ];

  if (profile.captionDensity === "minimal") {
    return slides.map((s) => (s.length > 72 ? `${s.slice(0, 68).trim()}…` : s));
  }
  return slides;
}

export function generateCTA(
  analysis: VisualAnalysis,
  platformMode: PlatformModeId,
  profile: DirectorProfile,
  brandCta?: string
): string {
  if (brandCta?.trim()) return brandCta.trim();
  const pm = getPlatformMode(platformMode);

  if (profile.ctaStyle === "subtle") {
    return `When you're ready — experience it in person.`;
  }
  if (profile.ctaStyle === "high-conversion") {
    return `Save · Share · Tag someone who needs this ${analysis.cuisine ?? "find"}.`;
  }
  if (analysis.streetFoodScore > 0.6) {
    return `Tag your crew — this ${analysis.cuisine ?? "spot"} is worth the detour.`;
  }
  if (analysis.luxuryScore > 0.6) {
    return `Reserve the experience · ${pm.label}`;
  }
  return `Follow for the next chapter of this ${analysis.mood ?? "story"}.`;
}

export function generateHook(
  analysis: VisualAnalysis,
  templateId: TemplateId,
  profile: DirectorProfile
): string {
  return buildHook(analysis, templateId, profile);
}

export function generateNarrative(input: {
  analysis: VisualAnalysis;
  memory: Pick<
    CreatorMemory,
    "captionTone" | "nichePreference" | "viralMode" | "platformMode"
  >;
  templateId: TemplateId;
  profile: DirectorProfile;
  brandCta?: string;
  hookPattern?: string;
  styleReference?: StyleReference | null;
}): GeneratedNarrative {
  const { analysis, memory, templateId, brandCta, hookPattern, profile, styleReference } =
    input;

  if (isDoodleStoryTemplate(templateId)) {
    const doodle = generateDoodleStoryNarrative({ analysis, brandCta });
    if (hookPattern?.trim()) {
      doodle.captions.hook = hookPattern.trim();
      doodle.hook = hookPattern.trim();
    }
    return {
      hook: doodle.hook,
      slides: doodle.slides,
      cta: doodle.cta,
      captions: doodle.captions,
    };
  }

  if (isRichRelationshipTemplate(templateId)) {
    const rich = generateRichRelationshipNarrative({
      analysis,
      brandCta,
    });
    if (hookPattern?.trim()) {
      rich.captions.hook = hookPattern.trim();
      rich.hook = hookPattern.trim();
    }
    return {
      hook: rich.hook,
      slides: rich.slides,
      cta: rich.cta,
      captions: rich.captions,
    };
  }

  const hook = hookPattern?.trim()
    ? enhanceHookLocally(
        hookPattern,
        intensityToViralMode(profile.hookIntensity)
      )
    : generateHook(analysis, templateId, profile);

  const slides = generateSlideFlow(analysis, memory, templateId, profile);
  const cta = generateCTA(analysis, memory.platformMode, profile, brandCta);

  let captions: Captions = {
    ...createEmptyCaptions(),
    hook,
    slide1: slides[0] ?? "",
    slide2: slides[1] ?? "",
    slide3: slides[2] ?? "",
    slide4: slides[3] ?? "",
    cta,
  };

  const pattern = getRetentionPattern(
    analysis.energy,
    profile.pacingStyle,
    profile.hookIntensity
  );
  let flowDensity = profile.captionDensity;
  if (styleReference?.captionDensity === "minimal") flowDensity = "minimal";
  else if (styleReference?.captionDensity === "dense") flowDensity = "dense";

  captions = injectRetentionHooks(
    captions,
    pattern,
    flowDensity,
    profile.hookIntensity
  );
  captions = optimizeCarouselFlow(captions, flowDensity);

  return {
    hook: captions.hook,
    slides: [
      captions.slide1,
      captions.slide2,
      captions.slide3,
      captions.slide4,
    ],
    cta: captions.cta,
    captions,
  };
}

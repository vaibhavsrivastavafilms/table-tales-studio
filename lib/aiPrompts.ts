const TEMPLATE_GUIDES: Record<string, string> = {
  "Street Food": `
Platform: Instagram carousel · Street food storytelling
Tone: raw, energetic, sensory, community-driven
Pacing: fast hook → vivid bites → emotional beat → social CTA
`,
  "Cinematic Dark": `
Platform: Instagram editorial · Cinematic food narrative
Tone: moody, poetic, film-like, premium contrast
Pacing: cinematic hook → tension slides → reveal → memorable CTA
`,
  "Founder Story": `
Platform: Founder / brand story carousel
Tone: authentic, visionary, personal, mission-led
Pacing: origin hook → struggle → insight → invitation CTA
`,
  "Luxury Dining": `
Platform: Luxury dining · Fine food editorial
Tone: refined, aspirational, slow luxury, sensory elegance
Pacing: elegant hook → craft details → experience → exclusive CTA
`,
  "Rich Relationship": `
Platform: Instagram emotional editorial · Warm food photography
Tone: simple, witty, human, relationship metaphors, comfort-food storytelling
Pacing: split hook (top burst + bottom ribbon) → short emotional beats → warm CTA
Use short lines. Two-beat hooks. No corporate language.
`,
};

import { getViralHookGuide, type ViralHookMode } from "@/lib/viralHooks";
import {
  getPlatformModeGuide,
  parsePlatformMode,
  type PlatformModeId,
} from "@/lib/platformModes";
import { getSeasonalPrompt, getTrendPromptAugmentation } from "@/lib/trends";

export type StoryPromptOptions = {
  viralMode?: ViralHookMode;
  captionTone?: string;
  platformMode?: PlatformModeId;
  brandCta?: string;
  hookPattern?: string;
  /** Summarized visual analysis for OpenAI — optional until Vision is wired */
  visualSummary?: string;
};

export function buildStoryPrompt(
  template: string,
  imageCount: number,
  options: StoryPromptOptions = {}
): string {
  const guide =
    TEMPLATE_GUIDES[template] ??
    TEMPLATE_GUIDES["Street Food"];

  const viralGuide = getViralHookGuide(options.viralMode ?? "viral");
  const platformGuide = getPlatformModeGuide(
    parsePlatformMode(options.platformMode)
  );
  const trends = getTrendPromptAugmentation();
  const seasonal = getSeasonalPrompt();
  const tone = options.captionTone?.trim() || "cinematic";
  const brandCta = options.brandCta?.trim();
  const hookPattern = options.hookPattern?.trim();
  const visualSummary = options.visualSummary?.trim();

  const storySlides = Math.max(1, imageCount - 2);

  return `
You are a world-class short-form food storyteller for Instagram.

${guide}

Virality engine (${options.viralMode ?? "viral"} mode):
${viralGuide}

${platformGuide}

Creator tone preference: ${tone}
${brandCta ? `Preferred CTA style: ${brandCta}` : ""}
${hookPattern ? `Hook pattern to echo: ${hookPattern}` : ""}
${visualSummary ? `Visual analysis from uploads: ${visualSummary}` : ""}
${seasonal}

${trends}

Write a ${imageCount}-slide carousel script with:
- 1 scroll-stopping HOOK (max 18 words)
- ${storySlides} story slides with emotional pacing (max 16 words each)
- 1 CTA slide that feels natural, not salesy (max 14 words)

Rules:
- Use second person sparingly; prefer cinematic present tense
- Each line must stand alone on a slide
- Build curiosity slide-to-slide
- Food reels energy: visual, sensory, specific
- No hashtags, no emojis, no quotes

Return ONLY valid JSON:
{
  "hook": "",
  "slide1": "",
  "slide2": "",
  "slide3": "",
  "slide4": "",
  "cta": ""
}
`.trim();
}

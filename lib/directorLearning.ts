import type { Captions } from "@/lib/slides";
import { SLIDE_KEYS } from "@/lib/slides";
import type { TemplateId } from "@/lib/templates";
import type { ViralHookMode } from "@/lib/viralHooks";
import {
  type CaptionDensityPref,
  type CtaStyle,
  type DirectorProfile,
  type HookIntensity,
  type PacingStyle,
  type StorytellingTone,
  loadDirectorProfile,
  mergeNarrativeAngle,
  saveDirectorProfile,
} from "@/lib/directorProfile";
import { learnSignatureFromCaptions } from "@/lib/signatureLanguage";

const DEBOUNCE_MS = 900;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPatch: Partial<DirectorProfile> = {};

export type DirectorLearningEvent =
  | { type: "template"; templateId: TemplateId }
  | { type: "viral_mode"; mode: ViralHookMode }
  | { type: "captions"; captions: Captions }
  | { type: "narrative_angle"; angle: string }
  | { type: "cta"; text: string }
  | { type: "session" };

function templateToTone(templateId: TemplateId): StorytellingTone {
  switch (templateId) {
    case "luxury-dining":
      return "luxury";
    case "street-food":
      return "street";
    case "founder-story":
      return "emotional";
    case "rich-relationship":
    case "doodle-story":
      return "emotional";
    default:
      return "cinematic";
  }
}

function viralToIntensity(mode: ViralHookMode): HookIntensity {
  if (mode === "viral" || mode === "funny") return "viral";
  if (mode === "emotional" || mode === "aesthetic") return "soft";
  return "balanced";
}

/** Inverse of viralToIntensity for hook enhancement — balanced avoids viral prefixes. */
export function intensityToViralMode(intensity: HookIntensity): ViralHookMode {
  switch (intensity) {
    case "viral":
      return "viral";
    case "soft":
      return "emotional";
    case "balanced":
      return "aesthetic";
    default:
      return "aesthetic";
  }
}

function averageCaptionLength(captions: Captions): number {
  const lines = SLIDE_KEYS.map((k) => captions[k].trim()).filter(Boolean);
  if (!lines.length) return 0;
  return lines.reduce((sum, l) => sum + l.length, 0) / lines.length;
}

function inferCaptionDensity(avg: number): CaptionDensityPref {
  if (avg < 42) return "minimal";
  if (avg > 78) return "dense";
  return "balanced";
}

function inferPacing(avg: number, hookLen: number): PacingStyle {
  if (hookLen > 55 || avg > 70) return "high-retention";
  if (avg < 45) return "slow-burn";
  return "dynamic";
}

function inferCtaStyle(cta: string): CtaStyle {
  const lower = cta.toLowerCase();
  if (/save|share|tag|follow|dm|link/i.test(lower)) return "high-conversion";
  if (/reserve|book|visit|experience/i.test(lower)) return "subtle";
  return "creator";
}

function mergePatch(patch: Partial<DirectorProfile>): void {
  pendingPatch = { ...pendingPatch, ...patch };
}

function flushLearning(): void {
  if (!Object.keys(pendingPatch).length) return;
  saveDirectorProfile(pendingPatch);
  pendingPatch = {};
}

export function scheduleDirectorLearning(event: DirectorLearningEvent): void {
  if (typeof window === "undefined") return;

  const profile = loadDirectorProfile();

  switch (event.type) {
    case "template":
      mergePatch({
        preferredTemplate: event.templateId,
        storytellingTone: templateToTone(event.templateId),
      });
      break;
    case "viral_mode":
      mergePatch({ hookIntensity: viralToIntensity(event.mode) });
      break;
    case "narrative_angle":
      mergeNarrativeAngle(event.angle);
      return;
    case "cta": {
      const style = inferCtaStyle(event.text);
      if (style !== profile.ctaStyle) mergePatch({ ctaStyle: style });
      break;
    }
    case "session":
      mergePatch({ sessionCount: profile.sessionCount + 1 });
      flushLearning();
      return;
    case "captions": {
      const avg = averageCaptionLength(event.captions);
      if (avg > 0) {
        mergePatch({
          captionDensity: inferCaptionDensity(avg),
          pacingStyle: inferPacing(avg, event.captions.hook.length),
        });
      }
      learnSignatureFromCaptions(event.captions);
      break;
    }
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flushLearning();
  }, DEBOUNCE_MS);
}

export function learnFromStoryGenerated(
  captions: Captions,
  context: { templateId: TemplateId; viralMode: ViralHookMode; narrativeAngle?: string }
): void {
  scheduleDirectorLearning({ type: "template", templateId: context.templateId });
  scheduleDirectorLearning({ type: "viral_mode", mode: context.viralMode });
  if (context.narrativeAngle) {
    scheduleDirectorLearning({ type: "narrative_angle", angle: context.narrativeAngle });
  }
  if (captions.cta.trim()) {
    scheduleDirectorLearning({ type: "cta", text: captions.cta });
  }
  scheduleDirectorLearning({ type: "captions", captions });
}

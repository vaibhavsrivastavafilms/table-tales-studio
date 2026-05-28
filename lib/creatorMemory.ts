import type { ExportFormat } from "@/lib/exportSlides";
import type { TemplateId } from "@/lib/templates";
import type { ViralHookMode } from "@/lib/viralHooks";

const STORAGE_KEY = "tts:creator:memory";

export type CreatorType =
  | "food-blogger"
  | "restaurant"
  | "content-creator"
  | "brand";

export type CaptionTone = "cinematic" | "playful" | "luxury" | "raw" | "founder";
export type StorytellingStyle = "carousel" | "reel" | "founder" | "editorial";
export type NichePreference =
  | "street-food"
  | "fine-dining"
  | "coffee"
  | "bakery"
  | "general";

export type CreatorMemory = {
  preferredTemplateId: TemplateId | null;
  captionTone: CaptionTone;
  exportFormat: ExportFormat;
  storytellingStyle: StorytellingStyle;
  nichePreference: NichePreference;
  preferredCtaStyle: string;
  viralMode: ViralHookMode;
  sessionCount: number;
  lastActiveAt: string | null;
  lastProjectTitle: string | null;
  onboardingComplete: boolean;
  creatorType: CreatorType | null;
  onboardingStep: number;
  triedDemo: boolean;
};

const DEFAULT_MEMORY: CreatorMemory = {
  preferredTemplateId: null,
  captionTone: "cinematic",
  exportFormat: "jpeg",
  storytellingStyle: "carousel",
  nichePreference: "general",
  preferredCtaStyle: "community",
  viralMode: "viral",
  sessionCount: 0,
  lastActiveAt: null,
  lastProjectTitle: null,
  onboardingComplete: false,
  creatorType: null,
  onboardingStep: 0,
  triedDemo: false,
};

function safeParse(raw: string | null): CreatorMemory {
  if (!raw) return { ...DEFAULT_MEMORY };
  try {
    const parsed = JSON.parse(raw) as Partial<CreatorMemory>;
    return { ...DEFAULT_MEMORY, ...parsed };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

export function loadCreatorMemory(): CreatorMemory {
  if (typeof window === "undefined") return { ...DEFAULT_MEMORY };
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveCreatorMemory(patch: Partial<CreatorMemory>): CreatorMemory {
  const next = {
    ...loadCreatorMemory(),
    ...patch,
    lastActiveAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function completeOnboarding(prefs: {
  creatorType: CreatorType;
  storytellingStyle: StorytellingStyle;
  templateId: TemplateId;
  captionTone?: CaptionTone;
  nichePreference?: NichePreference;
}): CreatorMemory {
  return saveCreatorMemory({
    onboardingComplete: true,
    onboardingStep: 5,
    creatorType: prefs.creatorType,
    storytellingStyle: prefs.storytellingStyle,
    preferredTemplateId: prefs.templateId,
    captionTone: prefs.captionTone ?? "cinematic",
    nichePreference: prefs.nichePreference ?? "general",
    triedDemo: true,
  });
}

export function needsOnboarding(): boolean {
  return !loadCreatorMemory().onboardingComplete;
}

export function recordCreatorSession(projectTitle?: string): CreatorMemory {
  const mem = loadCreatorMemory();
  return saveCreatorMemory({
    sessionCount: mem.sessionCount + 1,
    lastProjectTitle: projectTitle ?? mem.lastProjectTitle,
  });
}

export function recordTemplateUse(templateId: TemplateId): void {
  saveCreatorMemory({ preferredTemplateId: templateId });
}

export function recordExportPreference(format: ExportFormat): void {
  saveCreatorMemory({ exportFormat: format });
}

export function recordViralMode(mode: ViralHookMode): void {
  saveCreatorMemory({ viralMode: mode });
}

export function markDemoTried(): void {
  saveCreatorMemory({ triedDemo: true });
}

export type WelcomeBackMessage = {
  headline: string;
  subline: string;
  smartDefaults: {
    templateId: TemplateId | null;
    exportFormat: ExportFormat;
    viralMode: ViralHookMode;
    captionTone: CaptionTone;
  };
};

export function getWelcomeBackMessage(): WelcomeBackMessage | null {
  const mem = loadCreatorMemory();
  if (!mem.onboardingComplete || mem.sessionCount < 2) return null;

  const daysSince =
    mem.lastActiveAt != null
      ? (Date.now() - new Date(mem.lastActiveAt).getTime()) / 86_400_000
      : 999;

  const returning = daysSince > 0.5;
  const projectHint = mem.lastProjectTitle
    ? `Pick up "${mem.lastProjectTitle}" or start fresh.`
    : "Your workflow is restored — templates and tone remembered.";

  return {
    headline: returning ? "Welcome back, creator." : "Good to see you again.",
    subline: projectHint,
    smartDefaults: {
      templateId: mem.preferredTemplateId,
      exportFormat: mem.exportFormat,
      viralMode: mem.viralMode,
      captionTone: mem.captionTone,
    },
  };
}

export function applySmartDefaults(): Partial<CreatorMemory> {
  const mem = loadCreatorMemory();
  return {
    preferredTemplateId: mem.preferredTemplateId,
    exportFormat: mem.exportFormat,
    viralMode: mem.viralMode,
    captionTone: mem.captionTone,
    storytellingStyle: mem.storytellingStyle,
  };
}

import type { CreatorDirection } from "@/lib/creatorDirection";
import { DEFAULT_CREATOR_DIRECTION } from "@/lib/creatorDirection";
import type { ExportFormat } from "@/lib/exportSlides";
import type { PlatformModeId } from "@/lib/platformModes";
import type { QuickWorkflowId } from "@/lib/quickWorkflows";
import type { TemplateId } from "@/lib/templates";
import type { HookCategory, ViralHookMode } from "@/lib/viralHooks";
import { isSupabaseConfigured, createBrowserClient } from "@/lib/supabase";

const STORAGE_KEY = "tts:creator:memory";
const MAX_RECENT_WORKFLOWS = 8;

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

export type HookStyle =
  | "curiosity"
  | "emotional"
  | "authority"
  | "storytelling"
  | "nostalgia";

export type WorkflowUsageEntry = {
  id: QuickWorkflowId | "custom";
  label: string;
  usedAt: string;
  count: number;
};

export type CreatorMemory = {
  preferredTemplateId: TemplateId | null;
  captionTone: CaptionTone;
  exportFormat: ExportFormat;
  storytellingStyle: StorytellingStyle;
  nichePreference: NichePreference;
  preferredCtaStyle: string;
  viralMode: ViralHookMode;
  hookStyle: HookStyle;
  platformMode: PlatformModeId;
  recentWorkflows: WorkflowUsageEntry[];
  exportsThisWeek: number;
  exportsWeekStartedAt: string | null;
  strongestHookCategory: HookCategory | null;
  sessionCount: number;
  lastActiveAt: string | null;
  lastProjectTitle: string | null;
  onboardingComplete: boolean;
  creatorType: CreatorType | null;
  onboardingStep: number;
  triedDemo: boolean;
  /** Last reference-carousel aesthetic summary */
  lastStyleAesthetic: string | null;
  preferredCompositionStyle: string | null;
  styleReferenceUseCount: number;
  creatorDirection: CreatorDirection;
};

const DEFAULT_MEMORY: CreatorMemory = {
  preferredTemplateId: null,
  captionTone: "cinematic",
  exportFormat: "jpeg",
  storytellingStyle: "carousel",
  nichePreference: "general",
  preferredCtaStyle: "community",
  viralMode: "viral",
  hookStyle: "curiosity",
  platformMode: "instagram-carousel",
  recentWorkflows: [],
  exportsThisWeek: 0,
  exportsWeekStartedAt: null,
  strongestHookCategory: null,
  sessionCount: 0,
  lastActiveAt: null,
  lastProjectTitle: null,
  onboardingComplete: false,
  creatorType: null,
  onboardingStep: 0,
  triedDemo: false,
  lastStyleAesthetic: null,
  preferredCompositionStyle: null,
  styleReferenceUseCount: 0,
  creatorDirection: DEFAULT_CREATOR_DIRECTION,
};

const listeners = new Set<() => void>();
let cachedMemory: CreatorMemory = DEFAULT_MEMORY;
let clientCacheReady = false;

function safeParse(raw: string | null): CreatorMemory {
  if (!raw) {
    return {
      ...DEFAULT_MEMORY,
      recentWorkflows: [],
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CreatorMemory>;
    return {
      ...DEFAULT_MEMORY,
      ...parsed,
      recentWorkflows: Array.isArray(parsed.recentWorkflows)
        ? parsed.recentWorkflows
        : [],
      creatorDirection: {
        ...DEFAULT_CREATOR_DIRECTION,
        ...(parsed.creatorDirection as Partial<CreatorDirection> | undefined),
      },
    };
  } catch {
    return {
      ...DEFAULT_MEMORY,
      recentWorkflows: [],
    };
  }
}

function readFromStorage(): CreatorMemory {
  if (typeof window === "undefined") return DEFAULT_MEMORY;
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function memoryEquals(a: CreatorMemory, b: CreatorMemory): boolean {
  return (
    a.preferredTemplateId === b.preferredTemplateId &&
    a.captionTone === b.captionTone &&
    a.exportFormat === b.exportFormat &&
    a.storytellingStyle === b.storytellingStyle &&
    a.nichePreference === b.nichePreference &&
    a.preferredCtaStyle === b.preferredCtaStyle &&
    a.viralMode === b.viralMode &&
    a.hookStyle === b.hookStyle &&
    a.platformMode === b.platformMode &&
    a.exportsThisWeek === b.exportsThisWeek &&
    a.exportsWeekStartedAt === b.exportsWeekStartedAt &&
    a.strongestHookCategory === b.strongestHookCategory &&
    a.sessionCount === b.sessionCount &&
    a.lastActiveAt === b.lastActiveAt &&
    a.lastProjectTitle === b.lastProjectTitle &&
    a.onboardingComplete === b.onboardingComplete &&
    a.creatorType === b.creatorType &&
    a.onboardingStep === b.onboardingStep &&
    a.triedDemo === b.triedDemo &&
    a.lastStyleAesthetic === b.lastStyleAesthetic &&
    a.preferredCompositionStyle === b.preferredCompositionStyle &&
    a.styleReferenceUseCount === b.styleReferenceUseCount &&
    JSON.stringify(a.creatorDirection) === JSON.stringify(b.creatorDirection) &&
    JSON.stringify(a.recentWorkflows) === JSON.stringify(b.recentWorkflows)
  );
}

function emitMemoryUpdate(next: CreatorMemory): void {
  if (memoryEquals(cachedMemory, next)) return;
  cachedMemory = next;
  listeners.forEach((listener) => listener());
}

function ensureClientCache(): void {
  if (typeof window === "undefined" || clientCacheReady) return;
  clientCacheReady = true;
  cachedMemory = readFromStorage();
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) return;
  const next = safeParse(event.newValue);
  emitMemoryUpdate(next);
}

if (typeof window !== "undefined") {
  ensureClientCache();
  window.addEventListener("storage", handleStorageEvent);
}

/** Stable SSR / hydration fallback — do not mutate. */
export function getServerCreatorMemory(): CreatorMemory {
  return DEFAULT_MEMORY;
}

/** Snapshot for useSyncExternalStore — stable reference until memory changes. */
export function getCreatorMemorySnapshot(): CreatorMemory {
  ensureClientCache();
  return cachedMemory;
}

export function subscribeCreatorMemory(onStoreChange: () => void): () => void {
  ensureClientCache();
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function loadCreatorMemory(): CreatorMemory {
  if (typeof window === "undefined") return DEFAULT_MEMORY;
  ensureClientCache();
  return cachedMemory;
}

function weekStartIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString();
}

function bumpWeeklyExports(mem: CreatorMemory): CreatorMemory {
  const weekStart = weekStartIso();
  if (mem.exportsWeekStartedAt !== weekStart) {
    return { ...mem, exportsThisWeek: 1, exportsWeekStartedAt: weekStart };
  }
  return { ...mem, exportsThisWeek: mem.exportsThisWeek + 1 };
}

export function saveCreatorMemory(patch: Partial<CreatorMemory>): CreatorMemory {
  ensureClientCache();
  const next: CreatorMemory = {
    ...cachedMemory,
    ...patch,
    lastActiveAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedMemory = next;
    listeners.forEach((listener) => listener());
    void syncCreatorMemoryToCloud(next);
  }
  return next;
}

/** Optional Supabase sync when a session exists — never blocks UI. */
async function syncCreatorMemoryToCloud(mem: CreatorMemory): Promise<void> {
  if (!isSupabaseConfigured() || typeof window === "undefined") return;
  try {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: "creator_memory_sync",
      metadata: {
        templateId: mem.preferredTemplateId,
        viralMode: mem.viralMode,
        platformMode: mem.platformMode,
        niche: mem.nichePreference,
      },
    });
  } catch {
    /* silent — local-first */
  }
}

export function getCreatorMemory(): CreatorMemory {
  return getCreatorMemorySnapshot();
}

export function trackWorkflowUsage(
  workflowId: QuickWorkflowId | "custom",
  label: string
): CreatorMemory {
  const mem = loadCreatorMemory();
  const existing = mem.recentWorkflows.find((w) => w.id === workflowId);
  const entry: WorkflowUsageEntry = existing
    ? { ...existing, count: existing.count + 1, usedAt: new Date().toISOString() }
    : { id: workflowId, label, usedAt: new Date().toISOString(), count: 1 };

  const recent = [
    entry,
    ...mem.recentWorkflows.filter((w) => w.id !== workflowId),
  ].slice(0, MAX_RECENT_WORKFLOWS);

  return saveCreatorMemory({ recentWorkflows: recent });
}

export function getSuggestedWorkflow(): QuickWorkflowId | null {
  const mem = loadCreatorMemory();
  const top = mem.recentWorkflows[0];
  if (top && top.id !== "custom") return top.id;

  const nicheMap: Record<NichePreference, QuickWorkflowId> = {
    "street-food": "street-food-doc",
    "fine-dining": "luxury-dining-campaign",
    coffee: "monsoon-cafe",
    bakery: "emotional-food-reel",
    general: "viral-restaurant-launch",
  };
  return nicheMap[mem.nichePreference] ?? "viral-restaurant-launch";
}

export function recordHookCategory(category: HookCategory): void {
  saveCreatorMemory({ strongestHookCategory: category });
}

export function recordHookStyle(style: HookStyle): void {
  saveCreatorMemory({ hookStyle: style });
}

export function recordPlatformMode(mode: PlatformModeId): void {
  saveCreatorMemory({ platformMode: mode });
}

export function recordCaptionTone(tone: CaptionTone): void {
  saveCreatorMemory({ captionTone: tone });
}

export function recordCtaStyle(style: string): void {
  saveCreatorMemory({ preferredCtaStyle: style.slice(0, 40) });
}

export function recordExportCompleted(): void {
  const mem = loadCreatorMemory();
  saveCreatorMemory(bumpWeeklyExports(mem));
}

export type CreatorInsightsData = {
  favoriteTemplate: TemplateId | null;
  topWorkflow: string | null;
  exportsThisWeek: number;
  strongestHookCategory: HookCategory | null;
  storytellingStyle: StorytellingStyle;
  captionTone: CaptionTone;
};

export function getCreatorInsights(): CreatorInsightsData {
  const mem = loadCreatorMemory();
  return {
    favoriteTemplate: mem.preferredTemplateId,
    topWorkflow: mem.recentWorkflows[0]?.label ?? null,
    exportsThisWeek: mem.exportsThisWeek,
    strongestHookCategory: mem.strongestHookCategory,
    storytellingStyle: mem.storytellingStyle,
    captionTone: mem.captionTone,
  };
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

export function recordCreatorDirection(
  patch: Partial<CreatorDirection>
): CreatorMemory {
  const mem = loadCreatorMemory();
  return saveCreatorMemory({
    creatorDirection: { ...mem.creatorDirection, ...patch },
    platformMode: patch.platform ?? mem.platformMode,
  });
}

export function recordStyleReference(style: {
  aesthetic: string;
  compositionStyle: string;
  captionDensity?: "minimal" | "balanced" | "dense";
}): CreatorMemory {
  const mem = loadCreatorMemory();
  const tone =
    style.captionDensity === "minimal"
      ? "luxury"
      : style.captionDensity === "dense"
        ? "playful"
        : mem.captionTone;

  return saveCreatorMemory({
    lastStyleAesthetic: style.aesthetic.slice(0, 120),
    preferredCompositionStyle: style.compositionStyle.slice(0, 80),
    styleReferenceUseCount: mem.styleReferenceUseCount + 1,
    captionTone: tone,
  });
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

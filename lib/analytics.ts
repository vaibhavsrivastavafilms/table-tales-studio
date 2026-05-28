import { isBrowser } from "@/lib/browser";
import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export type AnalyticsEvent =
  | "project_created"
  | "export_generated"
  | "template_used"
  | "ai_generation"
  | "session_active";

const STORAGE_KEY = "table-tales-analytics";

type LocalAnalytics = {
  projectsCreated: number;
  exportsGenerated: number;
  templatesUsed: Record<string, number>;
  aiGenerations: number;
  sessions: number;
  lastTemplate?: string;
};

function readLocal(): LocalAnalytics {
  if (!isBrowser()) {
    return emptyAnalytics();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAnalytics();
    return { ...emptyAnalytics(), ...JSON.parse(raw) };
  } catch {
    return emptyAnalytics();
  }
}

function emptyAnalytics(): LocalAnalytics {
  return {
    projectsCreated: 0,
    exportsGenerated: 0,
    templatesUsed: {},
    aiGenerations: 0,
    sessions: 0,
  };
}

function writeLocal(data: LocalAnalytics): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function trackEvent(
  event: AnalyticsEvent,
  metadata?: Record<string, string>
): Promise<void> {
  const local = readLocal();

  switch (event) {
    case "project_created":
      local.projectsCreated += 1;
      break;
    case "export_generated":
      local.exportsGenerated += 1;
      break;
    case "template_used":
      if (metadata?.templateId) {
        local.templatesUsed[metadata.templateId] =
          (local.templatesUsed[metadata.templateId] ?? 0) + 1;
        local.lastTemplate = metadata.templateId;
      }
      break;
    case "ai_generation":
      local.aiGenerations += 1;
      break;
    case "session_active":
      local.sessions += 1;
      break;
  }

  writeLocal(local);

  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: event,
      metadata: metadata ?? {},
    });
  } catch (error) {
    logger.warn("trackEvent cloud sync skipped", { event, error: String(error) });
  }
}

export type AnalyticsSummary = {
  totalProjects: number;
  totalExports: number;
  favoriteTemplate: string;
  aiGenerations: number;
};

export async function getAnalyticsSummary(
  cloudProjectCount?: number
): Promise<AnalyticsSummary> {
  const local = readLocal();

  const favorite = Object.entries(local.templatesUsed).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  return {
    totalProjects: cloudProjectCount ?? local.projectsCreated,
    totalExports: local.exportsGenerated,
    favoriteTemplate: favorite ?? local.lastTemplate ?? "street-food",
    aiGenerations: local.aiGenerations,
  };
}

export function getTodayExportCount(): number {
  if (!isBrowser()) return 0;
  const key = `table-tales-exports-${new Date().toISOString().slice(0, 10)}`;
  return Number(localStorage.getItem(key) ?? "0");
}

export function incrementTodayExportCount(): void {
  if (!isBrowser()) return;
  const key = `table-tales-exports-${new Date().toISOString().slice(0, 10)}`;
  const next = getTodayExportCount() + 1;
  localStorage.setItem(key, String(next));
}

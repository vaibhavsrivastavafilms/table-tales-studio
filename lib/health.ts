import { getPendingExportBufferSize } from "@/lib/exportSlides";
import { isSupabaseConfigured } from "@/lib/supabase";

export type HealthSeverity = "info" | "warn";

export type HealthSignal = {
  id: string;
  severity: HealthSeverity;
  message: string;
};

type HealthCounters = {
  imageLoadFailures: number;
  exportFailures: number;
  aiTimeouts: number;
  syncTimeouts: number;
};

const counters: HealthCounters = {
  imageLoadFailures: 0,
  exportFailures: 0,
  aiTimeouts: 0,
  syncTimeouts: 0,
};

export function recordHealthEvent(
  event: keyof HealthCounters,
  count = 1
): void {
  counters[event] += count;
}

export function resetHealthCounters(): void {
  counters.imageLoadFailures = 0;
  counters.exportFailures = 0;
  counters.aiTimeouts = 0;
  counters.syncTimeouts = 0;
}

export async function probeSupabaseLatencyMs(): Promise<number | null> {
  if (!isSupabaseConfigured() || typeof window === "undefined") return null;
  try {
    const start = performance.now();
    const res = await fetch("/api", { method: "HEAD", cache: "no-store" });
    if (!res.ok && res.status !== 404) return null;
    return Math.round(performance.now() - start);
  } catch {
    recordHealthEvent("syncTimeouts");
    return null;
  }
}

export function getHealthWarnings(): HealthSignal[] {
  const signals: HealthSignal[] = [];
  const buffer = getPendingExportBufferSize();

  if (buffer > 12) {
    signals.push({
      id: "memory-pressure",
      severity: "warn",
      message: "Heavy export session — clearing buffer after render.",
    });
  }

  if (counters.imageLoadFailures >= 2) {
    signals.push({
      id: "image-load",
      severity: "warn",
      message: "Some images failed to load — re-upload if export looks blank.",
    });
  }

  if (counters.exportFailures >= 2) {
    signals.push({
      id: "export-fail",
      severity: "warn",
      message: "Recent export issues detected — wait for preview, then retry.",
    });
  }

  if (counters.aiTimeouts >= 2) {
    signals.push({
      id: "ai-timeout",
      severity: "info",
      message: "AI is slow — captions may use offline fallbacks.",
    });
  }

  if (counters.syncTimeouts >= 2 && isSupabaseConfigured()) {
    signals.push({
      id: "sync-timeout",
      severity: "info",
      message: "Cloud sync delayed — your draft is safe locally.",
    });
  }

  return signals.slice(0, 2);
}

import type { ExportProgress } from "@/lib/exportSlides";

export type ExportPipelinePhase =
  | "idle"
  | "preflight"
  | "rendering"
  | "packaging"
  | "complete"
  | "cancelled"
  | "failed";

export type ExportTimelineSnapshot = {
  sessionId: string;
  phase: ExportPipelinePhase;
  currentSlot: number;
  totalSlots: number;
  exportedCount: number;
  elapsedMs: number;
  estimatedRemainingMs: number | null;
  pipelineLabel: string;
};

const DEFAULT_SLOT_MS = 2200;

export class ExportTimeline {
  private sessionId: string;
  private phase: ExportPipelinePhase = "idle";
  private totalSlots = 0;
  private currentSlot = 0;
  private exportedCount = 0;
  private startedAt = 0;
  private slotDurations: number[] = [];
  private lastSlotAt = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  start(totalSlots: number): ExportTimelineSnapshot {
    this.phase = "preflight";
    this.totalSlots = Math.max(1, totalSlots);
    this.currentSlot = 0;
    this.exportedCount = 0;
    this.startedAt = Date.now();
    this.lastSlotAt = this.startedAt;
    this.slotDurations = [];
    return this.snapshot();
  }

  beginRendering(): ExportTimelineSnapshot {
    this.phase = "rendering";
    this.lastSlotAt = Date.now();
    return this.snapshot();
  }

  advance(progress: ExportProgress, didExport: boolean): ExportTimelineSnapshot {
    const now = Date.now();
    if (this.currentSlot > 0 && this.lastSlotAt > 0) {
      this.slotDurations.push(now - this.lastSlotAt);
    }
    this.currentSlot = progress.current;
    this.totalSlots = progress.total;
    if (didExport) this.exportedCount += 1;
    this.lastSlotAt = now;
    this.phase = "rendering";
    return this.snapshot();
  }

  beginPackaging(): ExportTimelineSnapshot {
    this.phase = "packaging";
    return this.snapshot();
  }

  complete(): ExportTimelineSnapshot {
    this.phase = "complete";
    this.currentSlot = this.totalSlots;
    return this.snapshot();
  }

  cancel(): ExportTimelineSnapshot {
    this.phase = "cancelled";
    return this.snapshot();
  }

  fail(): ExportTimelineSnapshot {
    this.phase = "failed";
    return this.snapshot();
  }

  private estimateRemainingMs(): number | null {
    const remaining = this.totalSlots - this.currentSlot;
    if (remaining <= 0) return 0;

    const avg =
      this.slotDurations.length > 0
        ? this.slotDurations.reduce((a, b) => a + b, 0) /
          this.slotDurations.length
        : DEFAULT_SLOT_MS;

    return Math.round(remaining * avg);
  }

  private pipelineLabel(): string {
    switch (this.phase) {
      case "preflight":
        return "Validating render pipeline…";
      case "rendering":
        return `Rendering slide ${Math.min(this.currentSlot, this.totalSlots)} of ${this.totalSlots}`;
      case "packaging":
        return "Packaging carousel archive…";
      case "complete":
        return "Render complete";
      case "cancelled":
        return "Render cancelled";
      case "failed":
        return "Render interrupted";
      default:
        return "Render pipeline idle";
    }
  }

  snapshot(): ExportTimelineSnapshot {
    return {
      sessionId: this.sessionId,
      phase: this.phase,
      currentSlot: this.currentSlot,
      totalSlots: this.totalSlots,
      exportedCount: this.exportedCount,
      elapsedMs: this.startedAt ? Date.now() - this.startedAt : 0,
      estimatedRemainingMs: this.estimateRemainingMs(),
      pipelineLabel: this.pipelineLabel(),
    };
  }
}

export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function formatEta(ms: number | null): string | null {
  if (ms == null) return null;
  if (ms <= 0) return "finishing";
  if (ms < 1000) return "<1s left";
  return `~${formatElapsed(ms)} left`;
}

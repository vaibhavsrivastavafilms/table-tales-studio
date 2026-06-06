import type { UploadStage } from "@/lib/uploadDiagnostics";

/** UI-facing upload phases (maps pipeline stages for display). */
export type UploadUiPhase =
  | "idle"
  | "uploading"
  | "optimizing"
  | "fallback"
  | "failed";

export function pipelineStageToUi(stage: UploadStage): UploadUiPhase {
  switch (stage) {
    case "validating":
    case "uploading":
      return "uploading";
    case "optimizing":
      return "optimizing";
    case "fallback":
      return "fallback";
    case "done":
      return "idle";
    default:
      return "uploading";
  }
}

export function uploadUiPhaseLabel(phase: UploadUiPhase): string | null {
  switch (phase) {
    case "uploading":
      return "Uploading images…";
    case "optimizing":
      return "Optimizing photos…";
    case "fallback":
      return "Saving local previews…";
    case "failed":
      return "Upload failed";
    case "idle":
    default:
      return null;
  }
}

export function isUploadBusy(phase: UploadUiPhase): boolean {
  return (
    phase === "uploading" ||
    phase === "optimizing" ||
    phase === "fallback"
  );
}

/** Approximate upload pipeline progress for the top progress bar. */
export function uploadPhasePercent(phase: UploadUiPhase): number {
  switch (phase) {
    case "uploading":
      return 38;
    case "optimizing":
      return 72;
    case "fallback":
      return 88;
    default:
      return 0;
  }
}

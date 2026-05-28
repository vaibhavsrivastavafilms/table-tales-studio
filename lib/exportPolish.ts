import type { ExportPipelinePhase } from "@/lib/exportTimeline";

export function cinematicPipelineLabel(
  phase: ExportPipelinePhase,
  currentSlot: number,
  totalSlots: number
): string {
  switch (phase) {
    case "preflight":
      return "Preparing cinematic render pipeline…";
    case "rendering":
      return `Rendering cinematic frames… (${Math.min(currentSlot, totalSlots)}/${totalSlots})`;
    case "packaging":
      return "Packaging story sequence…";
    case "complete":
      return "Instagram-ready export complete";
    case "cancelled":
      return "Render cancelled — session cleared";
    case "failed":
      return "Render interrupted — try again";
    default:
      return "Studio render idle";
  }
}

export function exportConfidenceMessage(exportedCount: number, total: number): string {
  if (exportedCount >= total) {
    return "All slides passed retina QA — ready to post.";
  }
  if (exportedCount > 0) {
    return `${exportedCount} of ${total} frames locked — export in progress.`;
  }
  return "Validating slide composition before export…";
}

export function finalizingExportLabel(format: "jpeg" | "png" | "zip"): string {
  if (format === "zip") return "Finalizing carousel ZIP pack…";
  if (format === "png") return "Finalizing lossless PNG export…";
  return "Finalizing Instagram-ready JPG export…";
}

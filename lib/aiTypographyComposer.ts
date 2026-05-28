import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { formatEditorialCaption } from "@/lib/editorialCopy";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import type { AiLayoutPlan } from "@/lib/aiEditorialLayout";

export type TypographyLayer = {
  lines: string[];
  scriptLine?: string;
  align: "left" | "center";
  highlightMode: "last-word-block";
  scale: number;
  zone: "top" | "bottom" | "floating";
};

export function composeTypography(input: {
  caption: string;
  slideIndex: number;
  layout: AiLayoutPlan;
  mode: AiDesignModeId;
  analysis: VisualAnalysis;
}): TypographyLayer {
  const lines = formatEditorialCaption(input.caption);
  const scale =
    input.layout.density > 0.85 ? 1.05 : input.layout.density < 0.6 ? 0.92 : 1;

  let scriptLine: string | undefined;
  if (input.slideIndex === 4 && !input.caption.toLowerCase().includes("psh")) {
    scriptLine = "Psh!";
  }
  if (input.slideIndex === 5) {
    scriptLine = "SAVE THIS SPOT!";
  }

  if (input.mode === "handwritten-memory-reel" && input.slideIndex === 2) {
    scriptLine = scriptLine ?? "a little memory";
  }

  if (input.analysis.mood?.includes("rain") && input.slideIndex === 3) {
    scriptLine = scriptLine ?? "Rain outside. Coffee inside.";
  }

  return {
    lines,
    scriptLine,
    align: input.layout.captionPlacement === "top-left" ? "left" : "left",
    highlightMode: "last-word-block",
    scale,
    zone:
      input.layout.captionPlacement === "bottom-card"
        ? "bottom"
        : "top",
  };
}

import type { LayoutRedesign, SlideLayoutVariant } from "@/lib/layoutRedesignEngine";
import type { EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";
import { formatEditorialCaption } from "@/lib/editorialCopy";

export type TypographyStyle =
  | "headline-block"
  | "poetic-minimal"
  | "sticker-burst"
  | "handwritten-note"
  | "magazine-stack";

export type TypographyComposition = {
  style: TypographyStyle;
  lines: string[];
  scriptLine?: string;
  align: "left" | "center";
  scale: number;
  highlightMode: "last-word-block" | "underline" | "yellow-block";
  letterSpacing: number;
  lineHeight: number;
};

function styleForVariant(variant: SlideLayoutVariant): TypographyStyle {
  switch (variant) {
    case "giant-type":
      return "headline-block";
    case "minimal-poetic":
      return "poetic-minimal";
    case "center-emotional":
      return "handwritten-note";
    case "doodle-heavy":
      return "sticker-burst";
    case "cinematic-pause":
      return "poetic-minimal";
    default:
      return "magazine-stack";
  }
}

export function composeTypographyLayout(input: {
  caption: string;
  slideIndex: number;
  layout: LayoutRedesign;
  emotional: EmotionalStyleProfile;
}): TypographyComposition {
  const lines = formatEditorialCaption(input.caption);
  const style = styleForVariant(input.layout.variant);
  const scale =
    input.emotional.typographyScale * (style === "headline-block" ? 1.08 : 1);

  let scriptLine: string | undefined;
  if (input.slideIndex === 4 && !input.caption.toLowerCase().includes("psh")) {
    scriptLine = "Psh!";
  }
  if (input.slideIndex === 5) scriptLine = "SAVE THIS SPOT!";

  return {
    style,
    lines,
    scriptLine,
    align: input.layout.variant === "center-emotional" ? "center" : "left",
    scale,
    highlightMode: "last-word-block",
    letterSpacing: style === "headline-block" ? -0.02 : 0,
    lineHeight: style === "poetic-minimal" ? 1.35 : 1.12,
  };
}

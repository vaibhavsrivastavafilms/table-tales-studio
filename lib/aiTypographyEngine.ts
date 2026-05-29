import type { LayoutRedesign, SlideLayoutVariant } from "@/lib/layoutRedesignEngine";
import type { EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";
import type { EditorialLayoutPlan } from "@/lib/editorialLayouts";
import { formatEditorialCaption } from "@/lib/editorialCopy";
import {
  DOODLE_STORY_STYLE,
  doodleStoryArcFrame,
} from "@/lib/editorialDoodleStoryMode";

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
  if (
    input.slideIndex === 5 &&
    input.emotional.stickerEnergy > 0.6 &&
    !input.caption.toLowerCase().includes("save")
  ) {
    scriptLine = "save this";
  }

  const doodleStory = input.emotional.id === "editorial-doodle";

  return {
    style,
    lines,
    scriptLine: doodleStory && input.slideIndex === 5 ? undefined : scriptLine,
    align: input.layout.variant === "center-emotional" ? "center" : "left",
    scale: doodleStory ? scale * 1.02 : scale,
    highlightMode: doodleStory ? "yellow-block" : "last-word-block",
    letterSpacing: style === "headline-block" ? -0.03 : 0,
    lineHeight: style === "poetic-minimal" ? 1.35 : 1.08,
  };
}

export type TypographyBlockRole =
  | "hero"
  | "headline"
  | "body"
  | "micro"
  | "script"
  | "vertical"
  | "floating-label";

export type TypographyBlock = {
  id: string;
  role: TypographyBlockRole;
  text: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  fontSize: number;
  fontWeight: number;
  align: "left" | "center" | "right";
  opacity: number;
  transform?: string;
};

export type DynamicTypographyPlan = {
  blocks: TypographyBlock[];
  legacy: TypographyComposition;
};

function trimLine(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function heroPlacement(
  slideIndex: number,
  composition: EditorialLayoutPlan["composition"],
  layout: LayoutRedesign,
  w: number,
  h: number
): { x: number; y: number } {
  if (slideIndex === 1 || slideIndex === 6) {
    return { x: w * 0.08, y: h * 0.07 };
  }
  if (composition === "minimal-editorial") {
    return { x: w * 0.1, y: h * 0.1 };
  }
  if (layout.visualWeight === "bottom") {
    return { x: w * 0.1, y: h * 0.68 };
  }
  return { x: w * 0.1, y: h * 0.12 };
}

export function composeDynamicTypography(input: {
  caption: string;
  slideIndex: number;
  layout: LayoutRedesign;
  emotional: EmotionalStyleProfile;
  editorial: EditorialLayoutPlan;
  width?: number;
  height?: number;
}): DynamicTypographyPlan {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const legacy = composeTypographyLayout(input);
  const rawLines = legacy.lines.filter((l) => l.trim().length > 0);
  const blocks: TypographyBlock[] = [];
  const storyRole = doodleStoryArcFrame(input.slideIndex).role;
  const doodleStory = input.emotional.id === "editorial-doodle";

  const maxWords =
    storyRole === "cinematic-cta" || storyRole === "hero-hook" ? 6 : 8;
  const heroLine = trimLine(rawLines[0] ?? input.caption, maxWords);
  const supportLine =
    doodleStory &&
    input.editorial.typeMode === "hero-micro" &&
    rawLines[1] &&
    storyRole !== "drink-pause"
      ? trimLine(rawLines[1], 4)
      : null;

  const heroScale =
    input.editorial.typographyStyle === "hero-giant"
      ? input.slideIndex === 1 || input.slideIndex === 6
        ? doodleStory
          ? 1.48
          : 1.38
        : 1.16
      : input.editorial.typeMode === "minimal"
        ? 0.86
        : 1.02;

  const place = heroPlacement(
    input.slideIndex,
    input.editorial.composition,
    input.layout,
    w,
    h
  );

  if (heroLine) {
    blocks.push({
      id: "hero-line",
      role:
        input.slideIndex === 1 || input.slideIndex === 6 ? "hero" : "headline",
      text: heroLine,
      x: place.x,
      y: place.y,
      width: w * 0.84,
      rotation:
        input.editorial.allowScriptAccent &&
        input.editorial.typographyStyle === "handwritten-scribble"
          ? -2
          : 0,
      fontSize: Math.round(
        (input.editorial.typeMode === "minimal" ? 18 : 24) * heroScale
      ),
      fontWeight: input.slideIndex === 1 || input.slideIndex === 6 ? 800 : 700,
      align: input.slideIndex === 4 ? "center" : "left",
      opacity: 1,
    });
  }

  if (supportLine && input.editorial.typeMode === "hero-micro") {
    const belowHero = place.y + Math.round(28 * heroScale) + 8;
    blocks.push({
      id: "support-micro",
      role: "micro",
      text: supportLine,
      x: place.x + 2,
      y: Math.min(h * 0.82, belowHero),
      width: w * 0.8,
      rotation: 0,
      fontSize: 10,
      fontWeight: 500,
      align: "left",
      opacity: 0.72,
    });
  }

  if (
    doodleStory &&
    legacy.scriptLine &&
    input.editorial.allowScriptAccent &&
    input.slideIndex === 5
  ) {
    blocks.push({
      id: "script",
      role: "script",
      text: legacy.scriptLine,
      x: w * 0.58,
      y: h * 0.18,
      width: w * 0.32,
      rotation: -6,
      fontSize: 14,
      fontWeight: 500,
      align: "left",
      opacity: 0.85,
      transform: "rotate(-6deg)",
    });
  }

  const capped = blocks.slice(0, doodleStory ? DOODLE_STORY_STYLE.maxTypographyGroups : 4);
  return { blocks: capped, legacy };
}

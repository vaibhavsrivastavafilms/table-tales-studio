import type { CompositionPlan } from "@/lib/carousel-renderer/composition-engine";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import type { TypographyBlock } from "@/lib/carousel-renderer/types";

export const CAFE_TYPO = {
  brushYellow: "#f4c430",
  cream: "#fff8f0",
  espresso: "#1a120c",
  display: '"Georgia", "Times New Roman", serif',
  sans: '"Helvetica Neue", Arial, sans-serif',
} as const;

function splitLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function primaryBrush(
  lines: string[],
  zone: TypographyBlock["zone"],
  brushColor: string = CAFE_TYPO.brushYellow
): TypographyBlock {
  return {
    kind: "brush-sticker",
    hierarchy: "primary",
    lines,
    zone,
    align: "left",
    color: CAFE_TYPO.espresso,
    backgroundColor: brushColor,
    fontFamily: CAFE_TYPO.display,
    fontSize: Math.min(40, Math.max(28, Math.round(zone.width / 14))),
    lineHeight: 1.04,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    rotation: zone.rotation ?? -1.5,
  };
}

function primaryEditorial(lines: string[], zone: TypographyBlock["zone"], size = 36): TypographyBlock {
  return {
    kind: "editorial-lines",
    hierarchy: "primary",
    lines,
    zone,
    align: zone.x > 400 ? "right" : "left",
    color: CAFE_TYPO.cream,
    fontFamily: CAFE_TYPO.display,
    fontSize: size,
    lineHeight: 1.1,
    textTransform: "uppercase",
    rotation: zone.rotation ?? 0,
  };
}

function secondaryLine(lines: string[], zone: TypographyBlock["zone"]): TypographyBlock {
  return {
    kind: "subheadline",
    hierarchy: "secondary",
    lines,
    zone,
    align: "left",
    color: `${CAFE_TYPO.cream}cc`,
    fontFamily: CAFE_TYPO.sans,
    fontSize: 18,
    lineHeight: 1.25,
    letterSpacing: "0.06em",
    textTransform: "none",
  };
}

function tertiarySlideMeta(zone: TypographyBlock["zone"], label: string): TypographyBlock {
  return {
    kind: "body",
    hierarchy: "tertiary",
    lines: [label],
    zone,
    align: "center",
    color: `${CAFE_TYPO.cream}99`,
    fontFamily: CAFE_TYPO.sans,
    fontSize: 13,
    lineHeight: 1,
    letterSpacing: "0.08em",
    textTransform: "none",
  };
}

function quotePrimary(lines: string[], zone: TypographyBlock["zone"]): TypographyBlock {
  return {
    kind: "quote",
    hierarchy: "primary",
    lines,
    zone,
    align: "center",
    color: CAFE_TYPO.cream,
    fontFamily: CAFE_TYPO.display,
    fontSize: 32,
    lineHeight: 1.32,
    textTransform: "none",
  };
}

function ctaSecondary(lines: string[], zone: TypographyBlock["zone"]): TypographyBlock {
  return {
    kind: "cta",
    hierarchy: "secondary",
    lines,
    zone,
    align: "left",
    color: CAFE_TYPO.espresso,
    backgroundColor: CAFE_TYPO.brushYellow,
    fontFamily: CAFE_TYPO.sans,
    fontSize: 22,
    lineHeight: 1.2,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  };
}

function brandPrimary(lines: string[], zone: TypographyBlock["zone"]): TypographyBlock {
  return {
    kind: "brand",
    hierarchy: "primary",
    lines,
    zone,
    align: "center",
    color: CAFE_TYPO.cream,
    fontFamily: CAFE_TYPO.display,
    fontSize: 36,
    lineHeight: 1.15,
    textTransform: "uppercase",
  };
}

/**
 * Typography from composition plan — primary / secondary / tertiary in dedicated zones.
 */
export function buildTypographyFromComposition(
  plan: CompositionPlan,
  headline: string,
  subhead?: string,
  options?: {
    brandName?: string;
    brandCta?: string;
    location?: string;
    accentColor?: string;
  }
): TypographyBlock[] {
  const brushAccent = options?.accentColor ?? CAFE_TYPO.brushYellow;
  const primaryLines = splitLines(headline);
  const subLines = subhead ? splitLines(subhead) : [];
  const blocks: TypographyBlock[] = [];

  blocks.push(tertiarySlideMeta(plan.tertiaryTextZone, plan.hierarchy.tertiary));

  switch (plan.layoutId) {
    case "HookLayout":
      blocks.push(
        primaryBrush(
          primaryLines.length ? primaryLines : ["NOT JUST FOOD.", "IT'S A WHOLE FEELING."],
          plan.primaryTextZone,
          brushAccent
        )
      );
      if (plan.secondaryTextZone && subLines.length) {
        blocks.push(secondaryLine(subLines, plan.secondaryTextZone));
      }
      break;
    case "AtmosphereLayout":
      blocks.push(
        primaryEditorial(
          primaryLines.length ? primaryLines : ["COFFEE.", "CONVERSATIONS.", "COMFORT."],
          plan.primaryTextZone,
          34
        )
      );
      break;
    case "FoodCloseupLayout":
      blocks.push(
        primaryEditorial(
          primaryLines.length ? primaryLines : ["STEAM RISES.", "CRAVINGS FOLLOW."],
          plan.primaryTextZone,
          26
        )
      );
      break;
    case "DrinkLayout":
      blocks.push(
        primaryEditorial(
          primaryLines.length ? primaryLines : ["SIP.", "CHILL.", "REPEAT."],
          plan.primaryTextZone,
          30
        )
      );
      break;
    case "CommunityLayout":
      blocks.push(
        primaryEditorial(
          primaryLines.length ? primaryLines : ["THE BEST KINDS OF", "TALKS HAPPEN HERE."],
          plan.primaryTextZone,
          30
        )
      );
      if (plan.secondaryTextZone) {
        blocks.push(
          ctaSecondary(
            subLines.length ? subLines : ["SAVE THIS SPOT →"],
            plan.secondaryTextZone
          )
        );
      }
      break;
    case "QuoteLayout":
      blocks.push(
        quotePrimary(
          primaryLines.length
            ? primaryLines
            : ["Good food is", "the conversation", "you remember."],
          plan.primaryTextZone
        )
      );
      break;
    case "PayoffLayout":
      blocks.push(
        primaryBrush(
          primaryLines.length ? primaryLines : ["GOOD FOOD.", "GOOD MOOD."],
          plan.primaryTextZone,
          brushAccent
        )
      );
      if (plan.secondaryTextZone && subLines.length) {
        blocks.push(secondaryLine(subLines, plan.secondaryTextZone));
      }
      break;
    case "BrandLayout":
      blocks.push(
        brandPrimary(
          [
            options?.brandName?.trim() || "TABLE TALES",
            options?.location?.trim() || primaryLines[0] || "CAFÉ",
          ],
          plan.primaryTextZone
        )
      );
      if (plan.secondaryTextZone) {
        blocks.push(
          ctaSecondary(
            subLines.length
              ? subLines
              : [options?.brandCta?.trim() || "FOLLOW FOR THE NEXT CHAPTER →"],
            plan.secondaryTextZone
          )
        );
      }
      break;
    default:
      blocks.push(primaryEditorial(primaryLines, plan.primaryTextZone));
  }

  return blocks;
}

/** Legacy entry — prefers composition plan when provided. */
export function buildTypographyForRole(
  role: DoodleCafeSlideRole,
  headline: string,
  subhead: string | undefined,
  captionZone: TypographyBlock["zone"],
  options?: { brandName?: string; brandCta?: string; location?: string; plan?: CompositionPlan }
): TypographyBlock[] {
  if (options?.plan) {
    return buildTypographyFromComposition(options.plan, headline, subhead, options);
  }
  return buildTypographyFromComposition(
    {
      layoutId: "HookLayout",
      role,
      subjects: {
        anchors: {},
        negativeSpace: [],
        confidence: 0,
        reasoning: ["legacy-fallback"],
        protectedRegion: { x: 100, y: 300, width: 800, height: 600 },
        objectPosition: "center center",
      },
      focalPoint: { x: 100, y: 300, width: 800, height: 600 },
      typographyZones: {
        textZone: captionZone,
        primaryTextZone: captionZone,
        tertiaryTextZone: { x: 980, y: 28, width: 48, height: 36 },
      },
      textZone: captionZone,
      primaryTextZone: captionZone,
      tertiaryTextZone: { x: 980, y: 28, width: 48, height: 36 },
      negativeSpace: [],
      doodleZones: [],
      narrativeDoodles: [],
      visualWeight: { photo: 0.75, typography: 0.15, doodles: 0.1 },
      hierarchy: { primary: headline, secondary: subhead ?? "", tertiary: "1" },
      objectPosition: "center center",
      photoFrame: { x: 0, y: 0, width: 1080, height: 1350 },
      topScrimHeight: 120,
      bottomScrimHeight: 0,
      textPlacement: "top-left",
    },
    headline,
    subhead,
    options
  );
}

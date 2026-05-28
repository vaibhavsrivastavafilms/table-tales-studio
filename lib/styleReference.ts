import type { TemplateVisualTreatment } from "@/lib/templates";

export type StyleReference = {
  aesthetic: string;
  typographyStyle: string;
  stickerStyle: string;
  compositionStyle: string;
  textPlacement: {
    top?: boolean;
    bottom?: boolean;
    centered?: boolean;
    floatingCards?: boolean;
  };
  colorPalette: string[];
  overlayStyle: string;
  shadowStyle: string;
  borderRadius: number;
  captionDensity: "minimal" | "balanced" | "dense";
  emotionalTone: string;
  editorialFeel: string;
};

export type BlendedSlideStyle = {
  visual: Partial<TemplateVisualTreatment>;
  accentColor?: string;
  captionAlignment: "left" | "center" | "right";
  bottomFadeOpacity?: number;
  borderRadius: number;
  overlayGradient?: string;
  useEditorialLayout: boolean;
  shadowDepth: "soft" | "medium" | "deep";
};

export const DEFAULT_STYLE_REFERENCE: StyleReference = {
  aesthetic: "cinematic food editorial",
  typographyStyle: "bold sans hierarchy",
  stickerStyle: "minimal badge",
  compositionStyle: "center-weighted caption band",
  textPlacement: { bottom: true, centered: true },
  colorPalette: ["#0b0f1a", "#f7c600", "#ffffff"],
  overlayStyle: "gradient vignette",
  shadowStyle: "soft lift",
  borderRadius: 16,
  captionDensity: "balanced",
  emotionalTone: "warm cinematic",
  editorialFeel: "magazine carousel",
};

export function summarizeStyleReference(style: StyleReference): string {
  const placement = [
    style.textPlacement.floatingCards ? "floating cards" : null,
    style.textPlacement.top ? "top captions" : null,
    style.textPlacement.bottom ? "bottom band" : null,
    style.textPlacement.centered ? "centered type" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    style.aesthetic,
    style.stickerStyle,
    placement || style.compositionStyle,
    style.emotionalTone,
  ]
    .filter(Boolean)
    .join(" — ");
}

export function densityToCaptionTone(
  density: StyleReference["captionDensity"]
): "cinematic" | "playful" | "luxury" | "raw" | "founder" {
  if (density === "minimal") return "luxury";
  if (density === "dense") return "playful";
  return "cinematic";
}

export function blendStyleWithTemplate(
  templateVisual: TemplateVisualTreatment,
  templateAccent: string,
  templateAlignment: "left" | "center" | "right",
  templateBottomFade: number,
  templateOverlay: string,
  reference: StyleReference | null | undefined,
  forceEditorial?: boolean
): BlendedSlideStyle {
  if (!reference) {
    return {
      visual: templateVisual,
      captionAlignment: templateAlignment,
      bottomFadeOpacity: templateBottomFade,
      borderRadius: 16,
      useEditorialLayout: !!forceEditorial,
      shadowDepth: "medium",
    };
  }

  const refDense = reference.captionDensity === "dense";
  const refMinimal = reference.captionDensity === "minimal";

  const visual: Partial<TemplateVisualTreatment> = {
    overlayIntensity: clamp(
      (templateVisual.overlayIntensity + (refMinimal ? -0.12 : refDense ? 0.08 : 0)) / 1,
      0.45,
      0.95
    ),
    captionDensity: refMinimal
      ? "sparse"
      : refDense
        ? "dense"
        : templateVisual.captionDensity,
    imageContrast: clamp(
      templateVisual.imageContrast +
        (reference.emotionalTone.includes("viral") ? 0.06 : 0),
      1,
      1.18
    ),
    imageSaturation: clamp(
      templateVisual.imageSaturation +
        (reference.colorPalette.some((c) => isWarmHex(c)) ? 0.06 : -0.02),
      0.88,
      1.2
    ),
    grainOpacity: clamp(
      templateVisual.grainOpacity +
        (reference.editorialFeel.includes("raw") ? 0.04 : 0),
      0,
      0.14
    ),
    glowStrength: clamp(
      templateVisual.glowStrength +
        (reference.shadowStyle.includes("deep") ? 0.12 : 0),
      0.2,
      0.65
    ),
    badgeStyle: mapStickerToBadge(reference.stickerStyle, templateVisual.badgeStyle),
    motionFeel:
      reference.compositionStyle.includes("asymmetric") ||
      reference.textPlacement.floatingCards
        ? "editorial"
        : templateVisual.motionFeel,
  };

  let captionAlignment = templateAlignment;
  if (reference.textPlacement.centered) captionAlignment = "center";
  else if (reference.textPlacement.top && !reference.textPlacement.bottom) {
    captionAlignment = "left";
  }

  const accentColor = reference.colorPalette[0] ?? templateAccent;
  const useEditorialLayout =
    !!forceEditorial ||
    !!reference.textPlacement.floatingCards ||
    reference.stickerStyle.includes("sticker") ||
    reference.stickerStyle.includes("comic") ||
    reference.editorialFeel.includes("editorial");

  return {
    visual: { ...templateVisual, ...visual },
    accentColor: pickAccent(accentColor, templateAccent),
    captionAlignment,
    bottomFadeOpacity: clamp(
      templateBottomFade +
        (reference.overlayStyle.includes("light") ? -0.08 : refDense ? 0.05 : 0),
      0.65,
      0.98
    ),
    borderRadius: clamp(reference.borderRadius, 8, 28),
    overlayGradient: blendOverlayHint(templateOverlay, reference.overlayStyle),
    useEditorialLayout,
    shadowDepth: reference.shadowStyle.includes("deep")
      ? "deep"
      : reference.shadowStyle.includes("soft")
        ? "soft"
        : "medium",
  };
}

function mapStickerToBadge(
  sticker: string,
  fallback: TemplateVisualTreatment["badgeStyle"]
): TemplateVisualTreatment["badgeStyle"] {
  if (sticker.includes("comic") || sticker.includes("burst")) return "comic-sticker";
  if (sticker.includes("elegant") || sticker.includes("minimal")) return "elegant";
  if (sticker.includes("documentary")) return "documentary";
  return fallback;
}

function pickAccent(refAccent: string, templateAccent: string): string {
  if (refAccent.startsWith("#") && refAccent.length >= 4) return refAccent;
  return templateAccent;
}

function blendOverlayHint(templateOverlay: string, overlayStyle: string): string {
  if (overlayStyle.includes("light") || overlayStyle.includes("airy")) {
    return templateOverlay.replace(/0\.9\)/g, "0.75)").replace(/0\.85\)/g, "0.7)");
  }
  if (overlayStyle.includes("heavy") || overlayStyle.includes("cinematic")) {
    return templateOverlay;
  }
  return templateOverlay;
}

function isWarmHex(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return r > g && r > b * 0.9;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type CaptionPlacementPref = "top" | "bottom";

export type CaptionAlignmentPref = "left" | "center" | "right";

export type SlideEditorPrefs = {
  doodlesEnabled: boolean;
  overlayIntensity: number;
  captionPlacement: CaptionPlacementPref;
  typographyScale: number;
  captionAlignment: CaptionAlignmentPref;
  stickerDensity: number;
};

export const DEFAULT_SLIDE_PREFS: SlideEditorPrefs = {
  doodlesEnabled: true,
  overlayIntensity: 1,
  captionPlacement: "top",
  typographyScale: 1,
  captionAlignment: "left",
  stickerDensity: 1,
};

export function prefsForSlide(
  map: Record<number, Partial<SlideEditorPrefs>>,
  slideIndex: number
): SlideEditorPrefs {
  const p = map[slideIndex];
  return {
    doodlesEnabled: p?.doodlesEnabled ?? DEFAULT_SLIDE_PREFS.doodlesEnabled,
    overlayIntensity: p?.overlayIntensity ?? DEFAULT_SLIDE_PREFS.overlayIntensity,
    captionPlacement:
      p?.captionPlacement ?? DEFAULT_SLIDE_PREFS.captionPlacement,
    typographyScale: p?.typographyScale ?? DEFAULT_SLIDE_PREFS.typographyScale,
    captionAlignment:
      p?.captionAlignment ?? DEFAULT_SLIDE_PREFS.captionAlignment,
    stickerDensity: p?.stickerDensity ?? DEFAULT_SLIDE_PREFS.stickerDensity,
  };
}

export type CaptionPlacementPref = "top" | "bottom";

export type SlideEditorPrefs = {
  doodlesEnabled: boolean;
  overlayIntensity: number;
  captionPlacement: CaptionPlacementPref;
};

export const DEFAULT_SLIDE_PREFS: SlideEditorPrefs = {
  doodlesEnabled: true,
  overlayIntensity: 1,
  captionPlacement: "top",
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
  };
}

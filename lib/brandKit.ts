export type TypographyPreset = "editorial" | "bold" | "minimal" | "luxury";

export type BrandKit = {
  accentColor: string;
  secondaryColor: string;
  typographyPreset: TypographyPreset;
  watermarkText: string;
  brandCta: string;
  introLine: string;
  logoDataUrl: string | null;
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  accentColor: "#f7c600",
  secondaryColor: "#0b0f1a",
  typographyPreset: "editorial",
  watermarkText: "",
  brandCta: "",
  introLine: "",
  logoDataUrl: null,
};

function brandKey(projectId: string | null): string {
  return projectId
    ? `tts:brand:project:${projectId}`
    : "tts:brand:global";
}

export function loadBrandKit(projectId: string | null): BrandKit {
  if (typeof window === "undefined") return { ...DEFAULT_BRAND_KIT };
  try {
    const raw = localStorage.getItem(brandKey(projectId));
    if (!raw) return { ...DEFAULT_BRAND_KIT };
    return { ...DEFAULT_BRAND_KIT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_BRAND_KIT };
  }
}

export function saveBrandKit(
  projectId: string | null,
  patch: Partial<BrandKit>
): BrandKit {
  const next = { ...loadBrandKit(projectId), ...patch };
  if (typeof window !== "undefined") {
    localStorage.setItem(brandKey(projectId), JSON.stringify(next));
  }
  return next;
}

export function resolveSlideAccent(
  templateAccent: string,
  brandKit: BrandKit
): string {
  return brandKit.accentColor?.trim() || templateAccent;
}

export function resolveWatermarkText(
  brandKit: BrandKit,
  showPlanWatermark: boolean
): string | null {
  if (brandKit.watermarkText?.trim()) return brandKit.watermarkText.trim();
  if (showPlanWatermark) return "Made with Table Tales Studio";
  return null;
}

export const TYPOGRAPHY_PRESETS: { id: TypographyPreset; label: string; scale: number }[] = [
  { id: "editorial", label: "Editorial", scale: 1 },
  { id: "bold", label: "Bold", scale: 1.08 },
  { id: "minimal", label: "Minimal", scale: 0.92 },
  { id: "luxury", label: "Luxury", scale: 1.04 },
];

export function fontScaleForPreset(preset: TypographyPreset): number {
  return TYPOGRAPHY_PRESETS.find((p) => p.id === preset)?.scale ?? 1;
}

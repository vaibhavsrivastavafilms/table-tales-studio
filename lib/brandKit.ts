export type TypographyPreset = "editorial" | "bold" | "minimal" | "luxury";

export type BrandTone =
  | "cinematic"
  | "playful"
  | "luxury"
  | "raw"
  | "founder";

export type BrandKit = {
  id: string;
  name: string;
  brandName: string;
  brandTone: BrandTone;
  accentColor: string;
  secondaryColor: string;
  typographyPreset: TypographyPreset;
  watermarkText: string;
  brandCta: string;
  introLine: string;
  hookPattern: string;
  hashtags: string;
  logoDataUrl: string | null;
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  id: "default",
  name: "Default kit",
  brandName: "",
  brandTone: "cinematic",
  accentColor: "#f7c600",
  secondaryColor: "#0b0f1a",
  typographyPreset: "editorial",
  watermarkText: "",
  brandCta: "",
  introLine: "",
  hookPattern: "",
  hashtags: "",
  logoDataUrl: null,
};

const KITS_INDEX_KEY = "tts:brand:kits:index";
const ACTIVE_KIT_KEY = "tts:brand:active";

function kitsIndexKey(projectId: string | null): string {
  return projectId ? `${KITS_INDEX_KEY}:${projectId}` : KITS_INDEX_KEY;
}

function brandKey(projectId: string | null): string {
  return projectId
    ? `tts:brand:project:${projectId}`
    : "tts:brand:global";
}

function normalizeKit(raw: Partial<BrandKit>, id: string, name: string): BrandKit {
  return {
    ...DEFAULT_BRAND_KIT,
    ...raw,
    id,
    name: name || raw.name || "Brand kit",
  };
}

export function listBrandKitIds(projectId: string | null): string[] {
  if (typeof window === "undefined") return ["default"];
  try {
    const raw = localStorage.getItem(kitsIndexKey(projectId));
    const ids = raw ? (JSON.parse(raw) as string[]) : ["default"];
    return ids.length ? ids : ["default"];
  } catch {
    return ["default"];
  }
}

export function loadBrandKitById(
  projectId: string | null,
  kitId: string
): BrandKit {
  if (typeof window === "undefined") return { ...DEFAULT_BRAND_KIT };
  try {
    const key = `${brandKey(projectId)}:${kitId}`;
    let raw = localStorage.getItem(key);
    if (!raw && kitId === "default") {
      raw = localStorage.getItem(brandKey(projectId));
    }
    if (!raw) return normalizeKit({}, kitId, kitId === "default" ? "Default kit" : kitId);
    return normalizeKit(
      JSON.parse(raw) as Partial<BrandKit>,
      kitId,
      kitId === "default" ? "Default kit" : kitId
    );
  } catch {
    return normalizeKit({}, kitId, kitId);
  }
}

export function loadBrandKit(projectId: string | null): BrandKit {
  if (typeof window === "undefined") return { ...DEFAULT_BRAND_KIT };
  const activeId =
    localStorage.getItem(`${ACTIVE_KIT_KEY}:${projectId ?? "global"}`) ?? "default";
  return loadBrandKitById(projectId, activeId);
}

export function saveBrandKit(
  projectId: string | null,
  patch: Partial<BrandKit>
): BrandKit {
  const current = loadBrandKit(projectId);
  const next = normalizeKit({ ...current, ...patch }, current.id, current.name);
  if (typeof window !== "undefined") {
    const key = `${brandKey(projectId)}:${next.id}`;
    localStorage.setItem(key, JSON.stringify(next));
    const ids = new Set(listBrandKitIds(projectId));
    ids.add(next.id);
    localStorage.setItem(kitsIndexKey(projectId), JSON.stringify([...ids]));
  }
  return next;
}

export function switchBrandKit(
  projectId: string | null,
  kitId: string
): BrandKit {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${ACTIVE_KIT_KEY}:${projectId ?? "global"}`, kitId);
  }
  return loadBrandKitById(projectId, kitId);
}

export function createBrandKit(
  projectId: string | null,
  name: string
): BrandKit {
  const id = `kit-${Date.now()}`;
  const kit = normalizeKit({ ...DEFAULT_BRAND_KIT, name }, id, name);
  if (typeof window !== "undefined") {
    localStorage.setItem(`${brandKey(projectId)}:${id}`, JSON.stringify(kit));
    const ids = new Set(listBrandKitIds(projectId));
    ids.add(id);
    localStorage.setItem(kitsIndexKey(projectId), JSON.stringify([...ids]));
    localStorage.setItem(`${ACTIVE_KIT_KEY}:${projectId ?? "global"}`, id);
  }
  return kit;
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

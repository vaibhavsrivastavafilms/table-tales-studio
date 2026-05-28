import type { ExportFormat } from "@/lib/exportSlides";

const HISTORY_KEY = "tts:export:history";
const PRESET_KEY = "tts:export:preset";
const MAX_HISTORY = 24;

export type SocialPlatform = "instagram-feed" | "instagram-story" | "tiktok" | "pinterest";
export type QualityPreset = "standard" | "retina" | "max";

export type ExportPreset = {
  id: string;
  name: string;
  format: ExportFormat;
  platform: SocialPlatform;
  quality: QualityPreset;
  cropSafe: boolean;
};

export const DEFAULT_EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "ig-carousel",
    name: "Instagram Carousel",
    format: "jpeg",
    platform: "instagram-feed",
    quality: "retina",
    cropSafe: true,
  },
  {
    id: "ig-story",
    name: "Instagram Story",
    format: "jpeg",
    platform: "instagram-story",
    quality: "retina",
    cropSafe: true,
  },
  {
    id: "png-archive",
    name: "PNG Archive",
    format: "png",
    platform: "instagram-feed",
    quality: "max",
    cropSafe: false,
  },
];

export type ExportHistoryEntry = {
  id: string;
  at: string;
  format: ExportFormat;
  slideCount: number;
  presetName?: string;
  platform?: SocialPlatform;
};

export function loadExportHistory(): ExportHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExportHistoryEntry[];
  } catch {
    return [];
  }
}

export function recordExportHistory(
  format: ExportFormat,
  slideCount: number,
  preset?: ExportPreset
): void {
  if (typeof window === "undefined") return;
  const entry: ExportHistoryEntry = {
    id: `${Date.now()}`,
    at: new Date().toISOString(),
    format,
    slideCount,
    presetName: preset?.name,
    platform: preset?.platform,
  };
  const next = [entry, ...loadExportHistory()].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function loadActiveExportPreset(): ExportPreset {
  if (typeof window === "undefined") return DEFAULT_EXPORT_PRESETS[0];
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (!raw) return DEFAULT_EXPORT_PRESETS[0];
    const id = JSON.parse(raw) as string;
    return (
      DEFAULT_EXPORT_PRESETS.find((p) => p.id === id) ??
      DEFAULT_EXPORT_PRESETS[0]
    );
  } catch {
    return DEFAULT_EXPORT_PRESETS[0];
  }
}

export function saveActiveExportPreset(presetId: string): ExportPreset {
  const preset =
    DEFAULT_EXPORT_PRESETS.find((p) => p.id === presetId) ??
    DEFAULT_EXPORT_PRESETS[0];
  if (typeof window !== "undefined") {
    localStorage.setItem(PRESET_KEY, JSON.stringify(preset.id));
  }
  return preset;
}

export type ExportQueueItem = {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "failed" | "cancelled";
};

export function qualityToPixelRatio(quality: QualityPreset): number {
  switch (quality) {
    case "standard":
      return 1.5;
    case "max":
      return 3;
    case "retina":
    default:
      return 2;
  }
}

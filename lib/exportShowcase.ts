import { loadExportHistory, type ExportHistoryEntry } from "@/lib/exportStudio";

const THUMB_KEY = "tts:export:showcase";

export type ShowcaseEntry = ExportHistoryEntry & {
  thumbDataUrl?: string;
};

export function loadShowcaseEntries(): ShowcaseEntry[] {
  return loadExportHistory().slice(0, 8);
}

export function saveShowcaseThumb(exportId: string, thumbDataUrl: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(THUMB_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[exportId] = thumbDataUrl.slice(0, 120_000);
    localStorage.setItem(THUMB_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function loadShowcaseThumb(exportId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(THUMB_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[exportId] ?? null;
  } catch {
    return null;
  }
}

export function enrichShowcase(entries: ExportHistoryEntry[]): ShowcaseEntry[] {
  return entries.map((e) => ({
    ...e,
    thumbDataUrl: loadShowcaseThumb(e.id) ?? undefined,
  }));
}

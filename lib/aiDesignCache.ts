import { isBrowser } from "@/lib/browser";

const memory = new Map<string, string>();
const revoked = new Set<string>();
const MAX_MEMORY = 24;
const STORAGE_KEY = "tts-ai-design-cache-v1";

type StoredEntry = { url: string; at: number };

function pruneMemory(): void {
  if (memory.size <= MAX_MEMORY) return;
  const keys = [...memory.keys()];
  for (let i = 0; i < keys.length - MAX_MEMORY; i++) {
    const k = keys[i];
    const url = memory.get(k);
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    memory.delete(k);
  }
}

function loadStorage(): Record<string, StoredEntry> {
  if (!isBrowser()) return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredEntry>;
  } catch {
    return {};
  }
}

function saveStorage(data: Record<string, StoredEntry>): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function cacheKey(parts: {
  mode: string;
  slideIndex: number;
  caption: string;
  mood: string;
}): string {
  const cap = parts.caption.slice(0, 80).replace(/\s+/g, " ");
  return `${parts.mode}|${parts.slideIndex}|${parts.mood}|${cap}`;
}

export function getCachedOverlayUrl(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  const stored = loadStorage()[key];
  if (stored?.url) {
    memory.set(key, stored.url);
    return stored.url;
  }
  return null;
}

export function setCachedOverlayUrl(key: string, url: string): void {
  if (revoked.has(url)) return;
  memory.set(key, url);
  pruneMemory();
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const stored = loadStorage();
    stored[key] = { url, at: Date.now() };
    saveStorage(stored);
  }
}

export function dataUrlToBlobUrl(dataUrl: string): string | null {
  if (!isBrowser()) return dataUrl;
  try {
    const [header, b64] = dataUrl.split(",");
    if (!b64) return null;
    const mime = header.match(/data:([^;]+)/)?.[1] ?? "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return null;
  }
}

export function revokeOverlayUrl(url: string): void {
  if (!url || revoked.has(url)) return;
  revoked.add(url);
  if (url.startsWith("blob:") && isBrowser()) {
    URL.revokeObjectURL(url);
  }
  for (const [k, v] of memory.entries()) {
    if (v === url) memory.delete(k);
  }
  const stored = loadStorage();
  let changed = false;
  for (const k of Object.keys(stored)) {
    if (stored[k].url === url) {
      delete stored[k];
      changed = true;
    }
  }
  if (changed) saveStorage(stored);
}

export function revokeAllOverlayUrls(urls: string[]): void {
  for (const u of urls) revokeOverlayUrl(u);
}

export function clearAiDesignCache(): void {
  for (const url of memory.values()) {
    if (url.startsWith("blob:") && isBrowser()) URL.revokeObjectURL(url);
  }
  memory.clear();
  if (isBrowser()) sessionStorage.removeItem(STORAGE_KEY);
}

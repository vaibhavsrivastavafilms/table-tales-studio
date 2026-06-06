import {
  DEFAULT_TEMPLATE_ID,
  type TemplateId,
} from "@/lib/templates";

const STORAGE_KEY = "tts:director:profile";
const MAX_ANGLES = 6;
const MAX_SIGNATURE_WORDS = 12;

export type HookIntensity = "soft" | "balanced" | "viral";
export type StorytellingTone = "cinematic" | "luxury" | "street" | "emotional";
export type CaptionDensityPref = "minimal" | "balanced" | "dense";
export type PacingStyle = "slow-burn" | "dynamic" | "high-retention";
export type CtaStyle = "subtle" | "creator" | "high-conversion";

/** Optional cloud payload shape — not required without auth. */
export type DirectorProfileCloudPayload = {
  version: number;
  profile: DirectorProfile;
  updatedAt: string;
};

export type DirectorProfile = {
  preferredTemplate: TemplateId;
  hookIntensity: HookIntensity;
  storytellingTone: StorytellingTone;
  captionDensity: CaptionDensityPref;
  pacingStyle: PacingStyle;
  ctaStyle: CtaStyle;
  favoriteNarrativeAngles: string[];
  creatorSignatureWords: string[];
  sessionCount: number;
};

export const DEFAULT_DIRECTOR_PROFILE: DirectorProfile = {
  preferredTemplate: DEFAULT_TEMPLATE_ID,
  hookIntensity: "balanced",
  storytellingTone: "cinematic",
  captionDensity: "balanced",
  pacingStyle: "dynamic",
  ctaStyle: "creator",
  favoriteNarrativeAngles: [],
  creatorSignatureWords: [],
  sessionCount: 0,
};

const listeners = new Set<() => void>();
let cachedProfile: DirectorProfile = DEFAULT_DIRECTOR_PROFILE;
let clientCacheReady = false;

function safeParse(raw: string | null): DirectorProfile {
  if (!raw) return { ...DEFAULT_DIRECTOR_PROFILE, favoriteNarrativeAngles: [], creatorSignatureWords: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<DirectorProfile>;
    return {
      ...DEFAULT_DIRECTOR_PROFILE,
      ...parsed,
      favoriteNarrativeAngles: Array.isArray(parsed.favoriteNarrativeAngles)
        ? parsed.favoriteNarrativeAngles.slice(0, MAX_ANGLES)
        : [],
      creatorSignatureWords: Array.isArray(parsed.creatorSignatureWords)
        ? parsed.creatorSignatureWords.slice(0, MAX_SIGNATURE_WORDS)
        : [],
    };
  } catch {
    return { ...DEFAULT_DIRECTOR_PROFILE, favoriteNarrativeAngles: [], creatorSignatureWords: [] };
  }
}

function profileEquals(a: DirectorProfile, b: DirectorProfile): boolean {
  return (
    a.preferredTemplate === b.preferredTemplate &&
    a.hookIntensity === b.hookIntensity &&
    a.storytellingTone === b.storytellingTone &&
    a.captionDensity === b.captionDensity &&
    a.pacingStyle === b.pacingStyle &&
    a.ctaStyle === b.ctaStyle &&
    a.sessionCount === b.sessionCount &&
    JSON.stringify(a.favoriteNarrativeAngles) ===
      JSON.stringify(b.favoriteNarrativeAngles) &&
    JSON.stringify(a.creatorSignatureWords) ===
      JSON.stringify(b.creatorSignatureWords)
  );
}

function emitProfileUpdate(next: DirectorProfile): void {
  if (profileEquals(cachedProfile, next)) return;
  cachedProfile = next;
  listeners.forEach((listener) => listener());
}

function ensureClientCache(): void {
  if (typeof window === "undefined" || clientCacheReady) return;
  clientCacheReady = true;
  cachedProfile = safeParse(localStorage.getItem(STORAGE_KEY));
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) return;
  emitProfileUpdate(safeParse(event.newValue));
}

if (typeof window !== "undefined") {
  ensureClientCache();
  window.addEventListener("storage", handleStorageEvent);
}

export function getServerDirectorProfile(): DirectorProfile {
  return DEFAULT_DIRECTOR_PROFILE;
}

export function getDirectorProfileSnapshot(): DirectorProfile {
  ensureClientCache();
  return cachedProfile;
}

export function subscribeDirectorProfile(onStoreChange: () => void): () => void {
  ensureClientCache();
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function loadDirectorProfile(): DirectorProfile {
  if (typeof window === "undefined") return DEFAULT_DIRECTOR_PROFILE;
  ensureClientCache();
  return cachedProfile;
}

export function saveDirectorProfile(
  patch: Partial<DirectorProfile>
): DirectorProfile {
  ensureClientCache();
  const next: DirectorProfile = {
    ...cachedProfile,
    ...patch,
    favoriteNarrativeAngles:
      patch.favoriteNarrativeAngles ?? cachedProfile.favoriteNarrativeAngles,
    creatorSignatureWords:
      patch.creatorSignatureWords ?? cachedProfile.creatorSignatureWords,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedProfile = next;
    listeners.forEach((listener) => listener());
  }
  return next;
}

export function bumpDirectorSession(): DirectorProfile {
  return saveDirectorProfile({ sessionCount: cachedProfile.sessionCount + 1 });
}

export function mergeNarrativeAngle(angle: string): DirectorProfile {
  const trimmed = angle.trim().slice(0, 80);
  if (!trimmed) return cachedProfile;
  const list = [
    trimmed,
    ...cachedProfile.favoriteNarrativeAngles.filter((a) => a !== trimmed),
  ].slice(0, MAX_ANGLES);
  return saveDirectorProfile({ favoriteNarrativeAngles: list });
}

export function mergeSignatureWords(words: string[]): DirectorProfile {
  const cleaned = words
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 3 && w.length < 48);
  if (!cleaned.length) return cachedProfile;
  const list = [
    ...cleaned,
    ...cachedProfile.creatorSignatureWords.filter((w) => !cleaned.includes(w)),
  ].slice(0, MAX_SIGNATURE_WORDS);
  return saveDirectorProfile({ creatorSignatureWords: list });
}

/** Prepare for optional Supabase sync — no auth required today. */
export function toCloudPayload(
  profile: DirectorProfile = cachedProfile
): DirectorProfileCloudPayload {
  return {
    version: 1,
    profile,
    updatedAt: new Date().toISOString(),
  };
}

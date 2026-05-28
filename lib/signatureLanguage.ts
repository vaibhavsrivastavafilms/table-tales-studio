import type { Captions } from "@/lib/slides";
import { SLIDE_KEYS } from "@/lib/slides";
import type { DirectorProfile } from "@/lib/directorProfile";
import { mergeSignatureWords } from "@/lib/directorProfile";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "your",
  "from",
  "into",
  "like",
  "what",
  "when",
  "where",
  "every",
  "more",
  "than",
  "just",
  "about",
  "here",
  "there",
]);

const PHRASE_SEEDS = [
  "late-night cravings",
  "warmth inside",
  "chef's ritual",
  "hidden gem",
  "slow gold light",
  "steam drifted",
  "memory lingers",
  "first bite",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

export function extractSignaturePhrases(captions: Captions): string[] {
  const text = SLIDE_KEYS.map((k) => captions[k]).join(" ");
  const tokens = tokenize(text);
  const phrases: string[] = [];

  for (let i = 0; i < tokens.length - 1; i++) {
    const bi = `${tokens[i]} ${tokens[i + 1]}`;
    if (bi.length >= 8 && bi.length <= 40) phrases.push(bi);
    if (i < tokens.length - 2) {
      const tri = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      if (tri.length >= 12 && tri.length <= 48) phrases.push(tri);
    }
  }

  const freq = new Map<string, number>();
  for (const p of phrases) freq.set(p, (freq.get(p) ?? 0) + 1);
  return [...freq.entries()]
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([p]) => p);
}

export function learnSignatureFromCaptions(captions: Captions): void {
  const found = extractSignaturePhrases(captions);
  if (found.length) mergeSignatureWords(found);
}

function pickSignature(
  profile: DirectorProfile,
  seed: number,
  exclude: Set<string>
): string | null {
  const pool = [
    ...profile.creatorSignatureWords,
    ...(profile.storytellingTone === "cinematic" ? PHRASE_SEEDS : []),
  ].filter((phrase) => !exclude.has(phrase.toLowerCase()));
  if (!pool.length) return null;
  return pool[Math.abs(seed) % pool.length];
}

export function applySignatureLanguage(
  captions: Captions,
  profile: DirectorProfile,
  recentPhrases: string[] = []
): Captions {
  const exclude = new Set(recentPhrases.map((p) => p.toLowerCase()));
  const next = { ...captions };
  const seed = profile.sessionCount + next.hook.length;

  const signature = pickSignature(profile, seed, exclude);
  if (!signature) return next;

  if (
    profile.captionDensity !== "minimal" &&
    next.slide3.length > 20 &&
    next.slide3.length < 90 &&
    !next.slide3.toLowerCase().includes(signature)
  ) {
    next.slide3 = `${next.slide3.replace(/\.$/, "")} — ${signature}.`;
  }

  return next;
}

export function phraseRecentlyUsed(
  phrase: string,
  recent: string[]
): boolean {
  const lower = phrase.toLowerCase();
  return recent.some((r) => r.toLowerCase().includes(lower));
}

export type ViralHookMode =
  | "viral"
  | "emotional"
  | "luxury"
  | "founder"
  | "funny"
  | "aesthetic";

export const VIRAL_HOOK_MODES: { id: ViralHookMode; label: string }[] = [
  { id: "viral", label: "Viral" },
  { id: "emotional", label: "Emotional" },
  { id: "luxury", label: "Luxury" },
  { id: "founder", label: "Founder" },
  { id: "funny", label: "Funny" },
  { id: "aesthetic", label: "Aesthetic" },
];

const MODE_GUIDES: Record<ViralHookMode, string> = {
  viral: `
Hook strategy: pattern interrupt + curiosity gap in first 8 words.
Pacing: rapid emotional beats; each slide ends with an open loop.
CTA: social proof + low-friction action (save, share, tag).
Engagement: contrast, specificity, "you won't believe" energy without clickbait clichés.
`,
  emotional: `
Hook strategy: vulnerable sensory moment; food as memory anchor.
Pacing: slow build → peak emotion → quiet resolution.
CTA: invitation to feel, comment their story, or DM.
Engagement: nostalgia, family, place, ritual.
`,
  luxury: `
Hook strategy: exclusivity + craft; aspirational restraint.
Pacing: elegant reveals; fewer words, more weight per line.
CTA: reservation, private tasting, follow for the next drop.
Engagement: texture, provenance, chef intention, rare ingredients.
`,
  founder: `
Hook strategy: origin tension — why this food exists.
Pacing: problem → insight → product truth → mission CTA.
CTA: join the movement, pre-order, build in public.
Engagement: authenticity, behind-the-scenes, values.
`,
  funny: `
Hook strategy: relatable food chaos or hot take.
Pacing: setup → punchline slides → playful CTA.
CTA: tag the friend who always orders this.
Engagement: wit, exaggeration, meme-adjacent but brand-safe.
`,
  aesthetic: `
Hook strategy: visual-first poetic fragment; mood over plot.
Pacing: minimal copy; each line like a film still caption.
CTA: save for inspiration, follow for the vibe.
Engagement: color, light, composition, calm luxury.
`,
};

export function getViralHookGuide(mode: ViralHookMode): string {
  return MODE_GUIDES[mode] ?? MODE_GUIDES.viral;
}

export function parseViralMode(value: unknown): ViralHookMode {
  const valid = VIRAL_HOOK_MODES.map((m) => m.id);
  if (typeof value === "string" && valid.includes(value as ViralHookMode)) {
    return value as ViralHookMode;
  }
  return "viral";
}

export function enhanceHookLocally(hook: string, mode: ViralHookMode): string {
  const trimmed = hook.trim();
  if (!trimmed) return hook;

  const prefixes: Partial<Record<ViralHookMode, string>> = {
    viral: "Wait — ",
    emotional: "I still remember ",
    luxury: "An evening where ",
    founder: "We started because ",
    funny: "Real talk: ",
    aesthetic: "",
  };

  const prefix = prefixes[mode];
  if (!prefix || trimmed.startsWith(prefix.trim())) return trimmed;
  if (mode === "aesthetic") return trimmed;
  return `${prefix}${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

export type ViralHookMode =
  | "viral"
  | "emotional"
  | "luxury"
  | "founder"
  | "funny"
  | "aesthetic";

export type HookCategory =
  | "curiosity"
  | "emotional"
  | "authority"
  | "storytelling"
  | "nostalgia"
  | "luxury"
  | "street-food"
  | "founder";

export const HOOK_CATEGORIES: { id: HookCategory; label: string }[] = [
  { id: "curiosity", label: "Curiosity" },
  { id: "emotional", label: "Emotional" },
  { id: "authority", label: "Authority" },
  { id: "storytelling", label: "Storytelling" },
  { id: "nostalgia", label: "Nostalgia" },
  { id: "luxury", label: "Luxury" },
  { id: "street-food", label: "Street food" },
  { id: "founder", label: "Founder" },
];

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

const HOOK_LIBRARY: Record<HookCategory, string[]> = {
  curiosity: [
    "Nobody noticed this tiny food stall… until now.",
    "Ahmedabad almost lost this hidden place.",
    "The menu has one item. The line has forty people.",
  ],
  emotional: [
    "The first bite that made everything quiet.",
    "Some meals become the place you miss.",
    "We come back because the table remembers us.",
  ],
  authority: [
    "The chef who trained in Paris — now on this corner.",
    "Three Michelin habits. One neighborhood kitchen.",
    "When the regulars stop recommending it, you know it's real.",
  ],
  storytelling: [
    "Every slide is a chapter you can taste.",
    "This isn't a review. It's the night we found it.",
    "From first flame to last plate — the full story.",
  ],
  nostalgia: [
    "Same lane. Same smell. Twenty years later.",
    "Grandmother's recipe, street cart courage.",
    "The city changed. This flavor didn't.",
  ],
  luxury: [
    "They don't plate silence like this anymore.",
    "An evening reserved for those who notice craft.",
    "Gold leaf isn't the luxury — patience is.",
  ],
  "street-food": [
    "The stall that only opens after midnight.",
    "Spice so honest the whole block leans in.",
    "Two dollars. Zero compromise on flavor.",
  ],
  founder: [
    "This restaurant started with one table.",
    "We almost shut down twice. Here's why we didn't.",
    "Built in public — one plate at a time.",
  ],
};

export function getViralHooks(
  category: HookCategory,
  count = 5
): string[] {
  const pool = HOOK_LIBRARY[category] ?? HOOK_LIBRARY.curiosity;
  return pool.slice(0, Math.min(count, pool.length));
}

export function remixHook(hook: string, category: HookCategory): string {
  const trimmed = hook.trim();
  const seed = getViralHooks(category, 1)[0] ?? "";
  if (!trimmed) return seed;
  const fragments = trimmed.split(/[.!?]/).filter(Boolean);
  const core = fragments[0]?.trim() ?? trimmed;
  const alt = getViralHooks(category, 3).find((h) => !h.includes(core.slice(0, 12)));
  if (alt) return alt;
  return `${seed.split(".")[0]}. ${core}.`;
}

export function getHookVariants(hook: string, category: HookCategory): string[] {
  const base = hook.trim() || (getViralHooks(category, 1)[0] ?? "");
  return [
    base,
    remixHook(base, category),
    ...getViralHooks(category, 3).filter((h) => h !== base),
  ].slice(0, 5);
}

export function categoryForMode(mode: ViralHookMode): HookCategory {
  const map: Record<ViralHookMode, HookCategory> = {
    viral: "curiosity",
    emotional: "emotional",
    luxury: "luxury",
    founder: "founder",
    funny: "storytelling",
    aesthetic: "nostalgia",
  };
  return map[mode] ?? "curiosity";
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

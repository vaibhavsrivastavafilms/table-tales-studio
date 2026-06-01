import type { CarouselProject, CarouselScore, Slide } from "@/lib/story-engine/types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function scoreHook(slides: Slide[]): number {
  const hook = slides.find((s) => s.role === "hook");
  if (!hook) return 40;
  const text = `${hook.headline} ${hook.body}`;
  const words = wordCount(text);
  let score = 55;
  if (words >= 6 && words <= 22) score += 15;
  if (/\?|!|you|everyone|nobody|secret|truth|why|how/i.test(text)) score += 12;
  if (text.length > 120) score -= 10;
  return clamp(score, 0, 100);
}

function scoreCuriosity(slides: Slide[]): number {
  const mid = slides.filter((s) =>
    ["problem", "context", "insight"].includes(s.role)
  );
  let score = 50;
  for (const s of mid) {
    const t = `${s.headline} ${s.body}`;
    if (/because|but|until|reveals?|truth|mistake|nobody/i.test(t)) score += 8;
    if (wordCount(t) > 35) score -= 4;
  }
  return clamp(score, 0, 100);
}

function scoreReadability(slides: Slide[]): number {
  let score = 70;
  for (const s of slides) {
    const words = wordCount(`${s.headline} ${s.body}`);
    if (words > 40) score -= 8;
    if (words < 4) score -= 6;
    if (s.headline.length > 80) score -= 5;
  }
  return clamp(score, 0, 100);
}

function scoreRetention(slides: Slide[]): number {
  const roles = new Set(slides.map((s) => s.role));
  const hasArc =
    roles.has("hook") &&
    roles.has("problem") &&
    roles.has("insight") &&
    roles.has("cta");
  let score = hasArc ? 72 : 45;
  if (slides.length >= 5) score += 10;
  const transformation = slides.find((s) => s.role === "transformation");
  if (transformation && wordCount(transformation.body) > 8) score += 8;
  return clamp(score, 0, 100);
}

function scoreShareability(project: CarouselProject): number {
  let score = 58;
  const hook = project.slides.find((s) => s.role === "hook")?.headline ?? "";
  if (/tag|share|save|send|friend/i.test(hook)) score += 5;
  const cta = project.slides.find((s) => s.role === "cta");
  if (cta && /follow|visit|book|try|taste/i.test(`${cta.headline} ${cta.body}`)) {
    score += 12;
  }
  if (project.story.framework === "transformation") score += 8;
  return clamp(score, 0, 100);
}

function buildSuggestions(score: CarouselScore, project: CarouselProject): string[] {
  const out: string[] = [];
  if (score.hookStrength < 70) {
    out.push("Strengthen slide 1: shorter hook, more tension or a direct question.");
  }
  if (score.curiosity < 65) {
    out.push("Add a curiosity gap between problem and insight — tease the payoff.");
  }
  if (score.readability < 70) {
    out.push("Trim copy per slide — aim for headline + one punchy line.");
  }
  if (score.retention < 68) {
    out.push("Ensure the arc hits problem → insight → transformation before CTA.");
  }
  if (score.shareability < 65) {
    out.push("Make the CTA specific: save, share, or visit — one verb only.");
  }
  const hook = project.slides.find((s) => s.role === "hook");
  if (hook && !hook.visualPlan.photoPreference) {
    out.push("Assign a hero food photo to the hook slide.");
  }
  if (!out.length) {
    out.push("Strong narrative foundation — test hook variants with A/B captions.");
  }
  return out.slice(0, 5);
}

export function scoreCarouselProject(project: CarouselProject): CarouselScore {
  const hookStrength = scoreHook(project.slides);
  const curiosity = scoreCuriosity(project.slides);
  const readability = scoreReadability(project.slides);
  const retention = scoreRetention(project.slides);
  const shareability = scoreShareability(project);
  const overall = Math.round(
    hookStrength * 0.28 +
      curiosity * 0.22 +
      readability * 0.18 +
      retention * 0.2 +
      shareability * 0.12
  );
  const base: CarouselScore = {
    hookStrength,
    curiosity,
    readability,
    retention,
    shareability,
    overall: clamp(overall, 0, 100),
    suggestions: [],
  };
  return {
    ...base,
    suggestions: buildSuggestions(base, project),
  };
}

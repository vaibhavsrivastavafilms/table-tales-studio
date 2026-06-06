import type {
  CarouselProject,
  CarouselScore,
  ScoreDimension,
  Slide,
} from "@/lib/story-engine/types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function dim(score: number, reasoning: string): ScoreDimension {
  return { score: clamp(Math.round(score), 0, 100), reasoning };
}

function scoreHookValue(slides: Slide[]): { score: number; reasoning: string } {
  const hook = slides.find((s) => s.role === "hook") ?? slides[0];
  if (!hook) return { score: 40, reasoning: "No hook slide found." };
  const text = `${hook.headline} ${hook.body}`;
  const words = wordCount(text);
  let score = 55;
  const notes: string[] = [];
  if (words >= 6 && words <= 22) {
    score += 15;
    notes.push("Hook length is in the ideal scroll-stop range.");
  } else {
    notes.push("Aim for 6–22 words on the hook for retention.");
  }
  if (/\?|!|you|everyone|nobody|secret|truth|why|how/i.test(text)) {
    score += 12;
    notes.push("Tension words or direct address detected.");
  }
  if (text.length > 120) {
    score -= 10;
    notes.push("Hook copy is long — trim for mobile.");
  }
  return { score, reasoning: notes.join(" ") || "Baseline hook scoring." };
}

function scoreCuriosityValue(slides: Slide[]): { score: number; reasoning: string } {
  const mid = slides.slice(1, -1);
  let score = 50;
  const notes: string[] = [];
  for (const s of mid) {
    const t = `${s.headline} ${s.body}`;
    if (/because|but|until|reveals?|truth|mistake|nobody/i.test(t)) score += 8;
    if (wordCount(t) > 35) score -= 4;
  }
  if (score >= 65) notes.push("Mid-carousel slides build curiosity gaps.");
  else notes.push("Tease the payoff between problem and insight slides.");
  return { score, reasoning: notes.join(" ") };
}

function scoreReadabilityValue(slides: Slide[]): { score: number; reasoning: string } {
  let score = 70;
  const notes: string[] = [];
  for (const s of slides) {
    const words = wordCount(`${s.headline} ${s.body}`);
    if (words > 40) {
      score -= 8;
      notes.push(`Slide ${s.role} is dense (${words} words).`);
    }
    if (words < 4) score -= 6;
    if (s.headline.length > 80) score -= 5;
  }
  if (!notes.length) notes.push("Copy density is carousel-friendly.");
  return { score, reasoning: notes.join(" ") };
}

function scoreRetentionValue(slides: Slide[]): { score: number; reasoning: string } {
  const roles = new Set(slides.map((s) => s.role));
  const hasHook = roles.has("hook");
  const hasCta = roles.has("cta");
  let score = hasHook && hasCta ? 72 : 45;
  if (slides.length >= 5) score += 10;
  const payoff = slides.find(
    (s) =>
      s.role === "transformation" ||
      s.role === "result" ||
      s.role === "breakthrough"
  );
  if (payoff && wordCount(payoff.body) > 8) score += 8;
  return {
    score,
    reasoning: hasHook && hasCta
      ? `${slides.length}-slide arc with opening and close.`
      : "Missing hook or CTA weakens completion rate.",
  };
}

function scoreShareabilityValue(
  project: CarouselProject
): { score: number; reasoning: string } {
  let score = 58;
  const notes: string[] = [];
  const cta = project.slides.find((s) => s.role === "cta");
  if (cta && /follow|visit|book|try|taste|save|share/i.test(`${cta.headline} ${cta.body}`)) {
    score += 12;
    notes.push("CTA uses a shareable action verb.");
  } else {
    notes.push("CTA could name one verb: save, share, or visit.");
  }
  if (project.story.framework === "transformation") score += 8;
  return { score, reasoning: notes.join(" ") || "Shareability baseline." };
}

function scoreNarrativeFlow(slides: Slide[]): { score: number; reasoning: string } {
  let score = 65;
  for (let i = 1; i < slides.length; i++) {
    const prev = slides[i - 1];
    const curr = slides[i];
    if (prev.body && curr.headline) score += 3;
  }
  const roles = slides.map((s) => s.role).join(" → ");
  return {
    score: clamp(score, 0, 100),
    reasoning: `Slide sequence: ${roles}.`,
  };
}

function scoreEmotionalImpact(slides: Slide[]): { score: number; reasoning: string } {
  let score = 55;
  const emotional = /feel|heart|love|miss|dream|struggle|joy|memory|story/i;
  for (const s of slides) {
    if (emotional.test(`${s.headline} ${s.body}`)) score += 6;
  }
  return {
    score: clamp(score, 0, 100),
    reasoning:
      score >= 70
        ? "Emotional language appears across multiple beats."
        : "Add one sensory or feeling-led line on the transformation slide.",
  };
}

function scoreVisualCohesion(project: CarouselProject): {
  score: number;
  reasoning: string;
} {
  const styles = new Set(project.slides.map((s) => s.visualPlan.overlayStyle));
  const withPhoto = project.slides.filter((s) => s.visualPlan.preferredPhotoId).length;
  let score = 60 + (styles.size <= 3 ? 15 : 0) + withPhoto * 4;
  return {
    score: clamp(score, 0, 100),
    reasoning: `${withPhoto}/${project.slides.length} slides have photo assignments; ${styles.size} overlay styles.`,
  };
}

function scorePlatformFit(project: CarouselProject): {
  score: number;
  reasoning: string;
} {
  const platform = project.brief.platform.toLowerCase();
  let score = 68;
  const slideCount = project.slides.length;
  if (platform.includes("instagram") && slideCount >= 5 && slideCount <= 10) score += 12;
  if (platform.includes("linkedin") && slideCount <= 8) score += 8;
  return {
    score: clamp(score, 0, 100),
    reasoning: `${slideCount} slides for ${project.brief.platform}.`,
  };
}

function scoreCtaStrength(slides: Slide[]): { score: number; reasoning: string } {
  const cta = slides.find((s) => s.role === "cta");
  if (!cta) return { score: 30, reasoning: "No CTA slide." };
  const text = `${cta.headline} ${cta.body}`;
  let score = 50;
  if (wordCount(text) <= 18) score += 15;
  if (/one|today|now|link|bio|book|visit|follow/i.test(text)) score += 12;
  return {
    score: clamp(score, 0, 100),
    reasoning:
      score >= 70
        ? "CTA is short and action-led."
        : "Shorten CTA to headline + one imperative line.",
  };
}

function buildExplainableLists(
  dims: Record<string, ScoreDimension>,
  project: CarouselProject
): Pick<
  CarouselScore,
  "strengths" | "weaknesses" | "improvements" | "priorityFixes"
> {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];
  const priorityFixes: string[] = [];

  const entries = Object.entries(dims) as [string, ScoreDimension][];
  for (const [key, d] of entries) {
    if (d.score >= 75) strengths.push(`${key}: ${d.reasoning}`);
    if (d.score < 65) weaknesses.push(`${key} (${d.score}): ${d.reasoning}`);
    if (d.score < 70) improvements.push(`Improve ${key} — ${d.reasoning}`);
    if (d.score < 55) priorityFixes.push(`${key}: ${d.reasoning}`);
  }

  const hook = project.slides.find((s) => s.role === "hook");
  if (hook && !hook.visualPlan.preferredPhotoId) {
    priorityFixes.push("Assign a hero photo to the hook slide.");
  }

  return {
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    improvements: improvements.slice(0, 6),
    priorityFixes: priorityFixes.slice(0, 4),
  };
}

export function scoreCarouselProject(project: CarouselProject): CarouselScore {
  const hookStrength = scoreHookValue(project.slides);
  const curiosity = scoreCuriosityValue(project.slides);
  const readability = scoreReadabilityValue(project.slides);
  const retention = scoreRetentionValue(project.slides);
  const shareability = scoreShareabilityValue(project);
  const narrativeFlow = scoreNarrativeFlow(project.slides);
  const emotionalImpact = scoreEmotionalImpact(project.slides);
  const visualCohesion = scoreVisualCohesion(project);
  const platformFit = scorePlatformFit(project);
  const ctaStrength = scoreCtaStrength(project.slides);

  const dims = {
    hookStrength: dim(hookStrength.score, hookStrength.reasoning),
    curiosity: dim(curiosity.score, curiosity.reasoning),
    readability: dim(readability.score, readability.reasoning),
    retention: dim(retention.score, retention.reasoning),
    shareability: dim(shareability.score, shareability.reasoning),
    narrativeFlow: dim(narrativeFlow.score, narrativeFlow.reasoning),
    emotionalImpact: dim(emotionalImpact.score, emotionalImpact.reasoning),
    visualCohesion: dim(visualCohesion.score, visualCohesion.reasoning),
    platformFit: dim(platformFit.score, platformFit.reasoning),
    ctaStrength: dim(ctaStrength.score, ctaStrength.reasoning),
  };

  const overall = Math.round(
    dims.hookStrength.score * 0.18 +
      dims.curiosity.score * 0.14 +
      dims.readability.score * 0.1 +
      dims.retention.score * 0.14 +
      dims.shareability.score * 0.08 +
      dims.narrativeFlow.score * 0.12 +
      dims.emotionalImpact.score * 0.1 +
      dims.visualCohesion.score * 0.06 +
      dims.platformFit.score * 0.04 +
      dims.ctaStrength.score * 0.04
  );

  const lists = buildExplainableLists(dims, project);

  return {
    ...dims,
    overall: clamp(overall, 0, 100),
    ...lists,
    suggestions: lists.improvements,
  };
}

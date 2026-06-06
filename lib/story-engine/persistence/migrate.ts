import type { CarouselProject, CarouselScore } from "@/lib/story-engine/types";
import { getFrameworkDefinition } from "@/lib/story-engine/framework-engine";

const CURRENT_VERSION = 2;

function legacyScoreToAdvanced(raw: Record<string, unknown>): CarouselScore {
  const num = (k: string, fallback: number) =>
    typeof raw[k] === "number" ? (raw[k] as number) : fallback;
  const dim = (k: string, fallback: number) => ({
    score: num(k, fallback),
    reasoning: `Migrated from legacy ${k} score.`,
  });
  const overall = num("overall", 70);
  return {
    hookStrength: dim("hookStrength", overall),
    curiosity: dim("curiosity", overall),
    readability: dim("readability", overall),
    retention: dim("retention", overall),
    shareability: dim("shareability", overall),
    narrativeFlow: dim("narrativeFlow", overall),
    emotionalImpact: dim("emotionalImpact", overall),
    visualCohesion: dim("visualCohesion", overall),
    platformFit: dim("platformFit", overall),
    ctaStrength: dim("ctaStrength", overall),
    overall,
    strengths: Array.isArray(raw.strengths) ? (raw.strengths as string[]) : [],
    weaknesses: Array.isArray(raw.weaknesses) ? (raw.weaknesses as string[]) : [],
    improvements: Array.isArray(raw.improvements)
      ? (raw.improvements as string[])
      : Array.isArray(raw.suggestions)
        ? (raw.suggestions as string[])
        : [],
    priorityFixes: Array.isArray(raw.priorityFixes)
      ? (raw.priorityFixes as string[])
      : [],
    suggestions: Array.isArray(raw.suggestions)
      ? (raw.suggestions as string[])
      : undefined,
  };
}

export function migrateCarouselProject(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;
  let version = typeof o.version === "number" ? o.version : 1;

  if (version < 2) {
    const story = o.story as Record<string, unknown> | undefined;
    if (story && !story.slideRoles) {
      const framework = (story.framework as string) ?? "transformation";
      try {
        const def = getFrameworkDefinition(
          framework as import("@/lib/story-engine/types").StoryFramework
        );
        story.slideRoles = def.slideRoles.map((r) => r.id);
      } catch {
        story.slideRoles = ["hook", "problem", "context", "insight", "transformation", "cta"];
      }
    }
    if (!o.revisions) o.revisions = [];
    if (o.revisionCursor === undefined) o.revisionCursor = -1;
    if (!o.photos) o.photos = [];
    if (o.score && typeof o.score === "object") {
      const s = o.score as Record<string, unknown>;
      if (typeof s.hookStrength === "number") {
        o.score = legacyScoreToAdvanced(s);
      }
    }
    version = 2;
  }

  o.version = CURRENT_VERSION;
  return o;
}

export function createEmptyProjectFields(): Pick<
  CarouselProject,
  "revisions" | "photos" | "revisionCursor" | "version"
> {
  return {
    version: CURRENT_VERSION,
    revisions: [],
    photos: [],
    revisionCursor: -1,
  };
}

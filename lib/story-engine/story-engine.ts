import {
  buildStoryArchitecture,
  getFrameworkDefinition,
} from "@/lib/story-engine/framework-engine";
import { createEmptyProjectFields } from "@/lib/story-engine/persistence/migrate";
import { analyzePhotos } from "@/lib/story-engine/photo/photo-intelligence";
import { appendRevision } from "@/lib/story-engine/revisions/revision-engine";
import { applyVisualPlanToSlides } from "@/lib/story-engine/visual-planner";
import type {
  CarouselProject,
  CreativeBrief,
  Slide,
  SlideRole,
  StoryArchitecture,
  StoryEngineInput,
  StoryFramework,
} from "@/lib/story-engine/types";

function uid(): string {
  return `prj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function slideId(role: SlideRole, index: number): string {
  return `slide_${role}_${index}`;
}

export function inferFramework(input: StoryEngineInput): StoryFramework {
  if (input.framework) return input.framework;
  const t = (input.templateName ?? "").toLowerCase();
  if (t.includes("founder") || t.includes("journey")) return "founder";
  if (t.includes("before") || t.includes("after")) return "before-after";
  if (t.includes("edu") || t.includes("tip")) return "educational";
  if (t.includes("case")) return "case-study";
  if (t.includes("list")) return "listicle";
  return "transformation";
}

/** Step 1 — Creative brief from inputs. */
export function generateCreativeBrief(input: StoryEngineInput): CreativeBrief {
  const topic =
    input.topic?.trim() ||
    input.templateName?.trim() ||
    "Food storytelling carousel";
  return {
    topic,
    goal:
      input.goal?.trim() ||
      "Drive saves, shares, and foot traffic through emotional food storytelling",
    audience:
      input.audience?.trim() ||
      "Food lovers on Instagram who scroll for crave-worthy moments",
    platform: input.platform?.trim() || "Instagram carousel",
    brand: input.brand?.trim() || undefined,
  };
}

/** Step 2 — Story architecture from framework definition. */
export function generateStoryArchitecture(
  brief: CreativeBrief,
  framework: StoryFramework
): StoryArchitecture {
  return buildStoryArchitecture(brief, framework);
}

function copyForRole(
  role: SlideRole,
  brief: CreativeBrief,
  story: StoryArchitecture,
  index: number
): { headline: string; body: string } {
  const def = getFrameworkDefinition(story.framework);
  const roleDef = def.slideRoles[index];
  const beat = story.structure[index] ?? roleDef?.beat ?? role;

  if (role === "hook") {
    return { headline: story.hook, body: beat };
  }
  if (role === "challenge") {
    return {
      headline: "The challenge we faced",
      body: `Your audience feels the constraint around ${brief.topic}. ${beat}`,
    };
  }
  if (role === "approach") {
    return {
      headline: "Our approach",
      body: `Here's what we tried differently for ${brief.topic}. ${beat}`,
    };
  }
  if (role === "breakthrough") {
    return {
      headline: "The breakthrough moment",
      body: beat,
    };
  }
  if (role === "result") {
    return {
      headline: "The result",
      body: `${brief.brand ? `${brief.brand} — ` : ""}Measurable payoff for ${brief.goal.toLowerCase()}.`,
    };
  }
  if (role === "problem") {
    return {
      headline: "The gap nobody talks about",
      body: `Your audience feels something is missing around ${brief.topic}. ${beat}`,
    };
  }
  if (role === "context") {
    return {
      headline: "Here's the real context",
      body: `${brief.audience} — this is why ${brief.topic} matters on ${brief.platform}.`,
    };
  }
  if (role === "insight") {
    return {
      headline: "The insight that shifts everything",
      body: beat,
    };
  }
  if (role === "transformation") {
    return {
      headline: "The transformation",
      body: `${brief.brand ? `${brief.brand} — ` : ""}This is what ${brief.goal.toLowerCase()} looks like in one frame.`,
    };
  }
  if (role === "cta") {
    return {
      headline: brief.brand ? `Experience ${brief.brand}` : "Your table is waiting",
      body: brief.brand
        ? `Save this. Share with someone who loves ${brief.topic}.`
        : "Follow for the next chapter of this story.",
    };
  }
  return {
    headline: roleDef?.label ?? role,
    body: beat,
  };
}

/** Step 3 — Slide plan from framework roles (dynamic count). */
export function generateSlidePlan(
  brief: CreativeBrief,
  story: StoryArchitecture
): Slide[] {
  const def = getFrameworkDefinition(story.framework);
  const roles = story.slideRoles?.length
    ? story.slideRoles
    : def.slideRoles.map((r) => r.id);

  return roles.map((role, index) => {
    const roleDef = def.slideRoles[index];
    const { headline, body } = copyForRole(role, brief, story, index);
    return {
      id: slideId(role, index),
      role,
      headline,
      body,
      visualPlan: {
        visualType: roleDef?.defaultVisualType ?? "hero",
        layout: "center",
        overlayStyle: "editorial",
      },
    };
  });
}

export type StoryEnginePipelineResult = {
  project: CarouselProject;
  steps: {
    brief: CreativeBrief;
    story: StoryArchitecture;
    slides: Slide[];
  };
};

/**
 * Full pipeline: Brief → Story → Slide Plan → Visual Plan (+ optional photos).
 */
export function runStoryEnginePipeline(
  input: StoryEngineInput
): StoryEnginePipelineResult {
  const now = new Date().toISOString();
  const framework = inferFramework(input);
  const brief = generateCreativeBrief(input);
  const story = generateStoryArchitecture(brief, framework);
  const slidePlan = generateSlidePlan(brief, story);
  const photos = input.photoUrls?.length
    ? analyzePhotos(input.photoUrls).assets
    : [];
  const slidesWithVisuals = applyVisualPlanToSlides(slidePlan, photos);

  const project: CarouselProject = {
    id: uid(),
    brief,
    story,
    slides: slidesWithVisuals,
    createdAt: now,
    updatedAt: now,
    ...createEmptyProjectFields(),
    photos,
  };

  const withRevision = appendRevision(project, "Initial generation", {
    label: "Original",
  });

  return {
    project: withRevision,
    steps: {
      brief,
      story,
      slides: slidesWithVisuals,
    },
  };
}

export function mergeAiSlideCopy(
  slides: Slide[],
  aiCopy: Partial<Record<SlideRole, { headline?: string; body?: string }>>
): Slide[] {
  return slides.map((slide) => {
    const patch = aiCopy[slide.role];
    if (!patch) return slide;
    return {
      ...slide,
      headline: patch.headline?.trim() || slide.headline,
      body: patch.body?.trim() || slide.body,
    };
  });
}

export function touchProject(project: CarouselProject): CarouselProject {
  return { ...project, updatedAt: new Date().toISOString() };
}

/** Rebuild slide plan when framework changes (preserves project id). */
export function applyFrameworkToProject(
  project: CarouselProject,
  framework: StoryFramework
): CarouselProject {
  const brief = project.brief;
  const story = generateStoryArchitecture(brief, framework);
  const slidePlan = generateSlidePlan(brief, story);
  const slides = applyVisualPlanToSlides(slidePlan, project.photos);
  return touchProject({
    ...project,
    story,
    slides,
  });
}

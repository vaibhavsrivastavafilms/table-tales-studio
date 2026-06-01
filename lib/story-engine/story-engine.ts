import {
  DEFAULT_SLIDE_ROLES,
  FRAMEWORK_STRUCTURE,
  SLIDE_ROLE_LABELS,
} from "@/lib/story-engine/constants";
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

/** Step 2 — Story architecture (framework + hook + structure beats). */
export function generateStoryArchitecture(
  brief: CreativeBrief,
  framework: StoryFramework
): StoryArchitecture {
  const structure = FRAMEWORK_STRUCTURE[framework];
  const hook =
    framework === "founder"
      ? `I didn't expect ${brief.topic} to change how we tell our story.`
      : framework === "listicle"
        ? `5 truths about ${brief.topic} that chefs won't say out loud.`
        : `Everyone posts ${brief.topic}. Almost nobody tells the story behind it.`;
  return {
    framework,
    hook,
    structure,
  };
}

function copyForRole(
  role: SlideRole,
  brief: CreativeBrief,
  story: StoryArchitecture,
  index: number
): { headline: string; body: string } {
  const beat = story.structure[index] ?? SLIDE_ROLE_LABELS[role];

  switch (role) {
    case "hook":
      return {
        headline: story.hook,
        body: beat,
      };
    case "problem":
      return {
        headline: "The gap nobody talks about",
        body: `Your audience feels something is missing around ${brief.topic}. ${beat}`,
      };
    case "context":
      return {
        headline: "Here's the real context",
        body: `${brief.audience} — this is why ${brief.topic} matters on ${brief.platform}.`,
      };
    case "insight":
      return {
        headline: "The insight that shifts everything",
        body: beat,
      };
    case "transformation":
      return {
        headline: "The transformation",
        body: `${brief.brand ? `${brief.brand} — ` : ""}This is what ${brief.goal.toLowerCase()} looks like in one frame.`,
      };
    case "cta":
      return {
        headline: brief.brand ? `Experience ${brief.brand}` : "Your table is waiting",
        body:
          brief.brand
            ? `Save this. Share with someone who loves ${brief.topic}.`
            : "Follow for the next chapter of this story.",
      };
  }
}

/** Step 3 — Slide plan (roles + copy), no visuals yet. */
export function generateSlidePlan(
  brief: CreativeBrief,
  story: StoryArchitecture
): Slide[] {
  return DEFAULT_SLIDE_ROLES.map((role, index) => {
    const { headline, body } = copyForRole(role, brief, story, index);
    return {
      id: slideId(role, index),
      role,
      headline,
      body,
      visualPlan: {
        visualType: "hero",
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
 * Full pipeline: Brief → Story → Slide Plan → Visual Plan.
 * Never writes to UI — returns JSON project only.
 */
export function runStoryEnginePipeline(
  input: StoryEngineInput
): StoryEnginePipelineResult {
  const now = new Date().toISOString();
  const framework = inferFramework(input);
  const brief = generateCreativeBrief(input);
  const story = generateStoryArchitecture(brief, framework);
  const slidePlan = generateSlidePlan(brief, story);
  const slidesWithVisuals = applyVisualPlanToSlides(slidePlan);

  const project: CarouselProject = {
    id: uid(),
    brief,
    story,
    slides: slidesWithVisuals,
    createdAt: now,
    updatedAt: now,
  };

  return {
    project,
    steps: {
      brief,
      story,
      slides: slidesWithVisuals,
    },
  };
}

/** Merge AI-generated slide copy into an existing plan (preserves ids/roles). */
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

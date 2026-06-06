import type {
  CreativeBrief,
  SlideRole,
  StoryArchitecture,
  StoryFramework,
} from "@/lib/story-engine/types";

export type FrameworkSlideRole = {
  id: SlideRole;
  label: string;
  beat: string;
  defaultVisualType: import("@/lib/story-engine/types").VisualType;
};

export type FrameworkDefinition = {
  id: StoryFramework;
  name: string;
  description: string;
  slideRoles: FrameworkSlideRole[];
  promptStrategy: string;
};

export const FRAMEWORK_DEFINITIONS: Record<StoryFramework, FrameworkDefinition> = {
  transformation: {
    id: "transformation",
    name: "Transformation",
    description: "Pain → insight → payoff arc for crave-worthy change stories.",
    promptStrategy:
      "Pattern-interrupt hook, name the pain, contextualize, reveal insight, show transformation, single CTA.",
    slideRoles: [
      { id: "hook", label: "Hook", beat: "Pattern interrupt — stop the scroll", defaultVisualType: "hero" },
      { id: "problem", label: "Problem", beat: "Name the pain your audience feels", defaultVisualType: "detail" },
      { id: "context", label: "Context", beat: "Why this matters now", defaultVisualType: "wide" },
      { id: "insight", label: "Insight", beat: "The truth that changes everything", defaultVisualType: "closeup" },
      { id: "transformation", label: "Transformation", beat: "Show the outcome", defaultVisualType: "before-after" },
      { id: "cta", label: "CTA", beat: "One clear action", defaultVisualType: "brand" },
    ],
  },
  educational: {
    id: "educational",
    name: "Educational",
    description: "Teach one memorable idea with proof and a save-worthy CTA.",
    promptStrategy: "Surprising fact hook, myth bust, context, technique, proof, save/share CTA.",
    slideRoles: [
      { id: "hook", label: "Hook", beat: "Surprising food fact", defaultVisualType: "hero" },
      { id: "problem", label: "Myth", beat: "What most people get wrong", defaultVisualType: "detail" },
      { id: "context", label: "Context", beat: "Where this shows up", defaultVisualType: "wide" },
      { id: "insight", label: "Technique", beat: "The technique or truth", defaultVisualType: "closeup" },
      { id: "transformation", label: "Proof", beat: "What good looks like", defaultVisualType: "reaction" },
      { id: "cta", label: "CTA", beat: "Save, share, or try", defaultVisualType: "brand" },
    ],
  },
  founder: {
    id: "founder",
    name: "Founder Story",
    description: "Personal journey from struggle to breakthrough.",
    promptStrategy: "Personal hook, struggle, pivotal moment, lesson, change, join-the-journey CTA.",
    slideRoles: [
      { id: "hook", label: "Hook", beat: "Why you started", defaultVisualType: "hero" },
      { id: "problem", label: "Struggle", beat: "Before the breakthrough", defaultVisualType: "detail" },
      { id: "context", label: "Moment", beat: "Kitchen, city, or first service", defaultVisualType: "wide" },
      { id: "insight", label: "Lesson", beat: "What you learned", defaultVisualType: "closeup" },
      { id: "transformation", label: "Change", beat: "What changed", defaultVisualType: "reaction" },
      { id: "cta", label: "CTA", beat: "Join the journey", defaultVisualType: "brand" },
    ],
  },
  "before-after": {
    id: "before-after",
    name: "Before / After",
    description: "Contrast arc built for visual payoff slides.",
    promptStrategy: "Tease contrast, before state, context, differentiator, after payoff, taste-it CTA.",
    slideRoles: [
      { id: "hook", label: "Hook", beat: "Before/after tease", defaultVisualType: "before-after" },
      { id: "problem", label: "Before", beat: "The before state", defaultVisualType: "detail" },
      { id: "context", label: "Context", beat: "Dish or brand context", defaultVisualType: "wide" },
      { id: "insight", label: "Difference", beat: "What makes the difference", defaultVisualType: "closeup" },
      { id: "transformation", label: "After", beat: "The payoff shot", defaultVisualType: "hero" },
      { id: "cta", label: "CTA", beat: "Taste it yourself", defaultVisualType: "brand" },
    ],
  },
  "case-study": {
    id: "case-study",
    name: "Case Study",
    description: "Results-first narrative: challenge → approach → breakthrough → result.",
    promptStrategy:
      "Results hook, challenge, approach, breakthrough moment, measurable result, book/visit CTA.",
    slideRoles: [
      { id: "hook", label: "Hook", beat: "Results-first hook", defaultVisualType: "hero" },
      { id: "challenge", label: "Challenge", beat: "Client or guest problem", defaultVisualType: "detail" },
      { id: "approach", label: "Approach", beat: "The decision that worked", defaultVisualType: "wide" },
      { id: "breakthrough", label: "Breakthrough", beat: "The turning point", defaultVisualType: "closeup" },
      { id: "result", label: "Result", beat: "Metrics or reaction", defaultVisualType: "reaction" },
      { id: "cta", label: "CTA", beat: "Book / visit / follow", defaultVisualType: "brand" },
    ],
  },
  listicle: {
    id: "listicle",
    name: "Listicle",
    description: "Numbered tips or reasons with one standout proof slide.",
    promptStrategy: "Numbered hook, myth, audience context, best tip, proof, follow CTA.",
    slideRoles: [
      { id: "hook", label: "Hook", beat: "X reasons / tips", defaultVisualType: "hero" },
      { id: "problem", label: "Myth", beat: "Myth to bust", defaultVisualType: "detail" },
      { id: "context", label: "Audience", beat: "Who this is for", defaultVisualType: "wide" },
      { id: "insight", label: "Best Tip", beat: "The standout tip", defaultVisualType: "closeup" },
      { id: "transformation", label: "Proof", beat: "Proof it works", defaultVisualType: "reaction" },
      { id: "cta", label: "CTA", beat: "Follow for more", defaultVisualType: "brand" },
    ],
  },
};

export function listFrameworks(): FrameworkDefinition[] {
  return Object.values(FRAMEWORK_DEFINITIONS);
}

export function getFrameworkDefinition(
  framework: StoryFramework
): FrameworkDefinition {
  return FRAMEWORK_DEFINITIONS[framework];
}

export function buildStoryArchitecture(
  brief: CreativeBrief,
  framework: StoryFramework
): StoryArchitecture {
  const def = getFrameworkDefinition(framework);
  const structure = def.slideRoles.map((r) => r.beat);
  const hook =
    framework === "founder"
      ? `I didn't expect ${brief.topic} to change how we tell our story.`
      : framework === "listicle"
        ? `5 truths about ${brief.topic} that chefs won't say out loud.`
        : framework === "case-study"
          ? `How we turned ${brief.topic} into a story guests can't stop sharing.`
          : `Everyone posts ${brief.topic}. Almost nobody tells the story behind it.`;
  return {
    framework,
    hook,
    structure,
    slideRoles: def.slideRoles.map((r) => r.id),
  };
}

export function slideCountForFramework(framework: StoryFramework): number {
  return getFrameworkDefinition(framework).slideRoles.length;
}

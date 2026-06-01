import type { SlideRole, StoryFramework } from "@/lib/story-engine/types";

export const DEFAULT_SLIDE_ROLES: SlideRole[] = [
  "hook",
  "problem",
  "context",
  "insight",
  "transformation",
  "cta",
];

export const SLIDE_ROLE_LABELS: Record<SlideRole, string> = {
  hook: "Hook",
  problem: "Problem",
  context: "Context",
  insight: "Insight",
  transformation: "Transformation",
  cta: "CTA",
};

export const FRAMEWORK_LABELS: Record<StoryFramework, string> = {
  transformation: "Transformation",
  educational: "Educational",
  founder: "Founder Story",
  "before-after": "Before / After",
  "case-study": "Case Study",
  listicle: "Listicle",
};

export const FRAMEWORK_STRUCTURE: Record<StoryFramework, string[]> = {
  transformation: [
    "Open with a pattern interrupt hook",
    "Name the pain your audience feels",
    "Set the scene — why this matters now",
    "Reveal the insight that changes everything",
    "Show the transformation outcome",
    "Clear CTA — one action to take",
  ],
  educational: [
    "Hook with a surprising food fact",
    "Problem — what most people get wrong",
    "Context — where this shows up",
    "Insight — the technique or truth",
    "Transformation — what good looks like",
    "CTA — save, share, or try",
  ],
  founder: [
    "Personal hook — why you started",
    "The struggle before the breakthrough",
    "Moment of context — the kitchen or city",
    "Insight — what you learned",
    "Transformation — what changed",
    "CTA — join the journey",
  ],
  "before-after": [
    "Before/after tease hook",
    "The before state — problem",
    "Context of the dish or brand",
    "Insight — what makes the difference",
    "After — the payoff shot",
    "CTA — taste it yourself",
  ],
  "case-study": [
    "Results-first hook",
    "Client or guest problem",
    "Context — venue, dish, constraint",
    "Insight — the decision that worked",
    "Transformation — metrics or reaction",
    "CTA — book / visit / follow",
  ],
  listicle: [
    "Numbered hook — X reasons / tips",
    "Problem slide — myth to bust",
    "Context — who this is for",
    "Insight — the best tip",
    "Transformation — proof it works",
    "CTA — follow for more",
  ],
};

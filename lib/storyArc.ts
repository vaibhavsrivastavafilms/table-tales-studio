import type { StoryGoal } from "@/lib/creatorDirection";
import type { TemplateId } from "@/lib/templates";

export type StoryArcId =
  | "curiosity-payoff"
  | "emotional-reveal"
  | "luxury-escalation"
  | "comfort-nostalgia"
  | "hidden-gem"
  | "transformation"
  | "sensory-progression"
  | "date-night-fantasy"
  | "pov-storytelling"
  | "relationship-carousel";

export type StoryArc = {
  id: StoryArcId;
  label: string;
  hookBeat: string;
  slideProgression: string[];
  emotionalArc: string;
  payoffLine: string;
};

const ARCS: Record<StoryArcId, StoryArc> = {
  "curiosity-payoff": {
    id: "curiosity-payoff",
    label: "Curiosity → payoff",
    hookBeat: "Open a gap the viewer must close by swiping.",
    slideProgression: [
      "Tease the mystery",
      "Add sensory proof",
      "Raise stakes",
      "Deliver the reveal",
      "Invite the save",
    ],
    emotionalArc: "Intrigue → tension → satisfaction",
    payoffLine: "The final frame earns the swipe.",
  },
  "emotional-reveal": {
    id: "emotional-reveal",
    label: "Emotional → reveal",
    hookBeat: "Start intimate; end with meaning.",
    slideProgression: [
      "Memory trigger",
      "Sensory anchor",
      "Quiet tension",
      "Emotional reveal",
      "Soft CTA",
    ],
    emotionalArc: "Warmth → depth → release",
    payoffLine: "Feel first, explain second.",
  },
  "luxury-escalation": {
    id: "luxury-escalation",
    label: "Luxury escalation",
    hookBeat: "Each slide elevates desire — never rush.",
    slideProgression: [
      "Atmosphere",
      "Craft detail",
      "Ritual moment",
      "Aspirational peak",
      "Reservation CTA",
    ],
    emotionalArc: "Restraint → desire → inevitability",
    payoffLine: "Silence between beats sells premium.",
  },
  "comfort-nostalgia": {
    id: "comfort-nostalgia",
    label: "Comfort nostalgia",
    hookBeat: "Home-coded warmth with witty honesty.",
    slideProgression: [
      "Familiar craving",
      "Shared table energy",
      "Simple truth",
      "Emotional punchline",
      "Come-back CTA",
    ],
    emotionalArc: "Cozy → honest → belonging",
    payoffLine: "Nostalgia without sentimentality overload.",
  },
  "hidden-gem": {
    id: "hidden-gem",
    label: "Hidden gem discovery",
    hookBeat: "Insider knowledge energy — local pride.",
    slideProgression: [
      "Secret setup",
      "First bite proof",
      "Crowd signal",
      "Why it matters",
      "Tag-a-friend CTA",
    ],
    emotionalArc: "Discovery → proof → FOMO",
    payoffLine: "Viewer feels early, not sold to.",
  },
  transformation: {
    id: "transformation",
    label: "Transformation",
    hookBeat: "Before/after appetite arc in five beats.",
    slideProgression: [
      "Problem hunger",
      "Process tease",
      "Hero reveal",
      "Reaction beat",
      "Repeat visit CTA",
    ],
    emotionalArc: "Lack → anticipation → fulfillment",
    payoffLine: "Show the change, not just the dish.",
  },
  "sensory-progression": {
    id: "sensory-progression",
    label: "Sensory progression",
    hookBeat: "Each slide adds a sense — sound, steam, texture.",
    slideProgression: [
      "Visual hook",
      "Sound implied",
      "Texture close-up",
      "Temperature moment",
      "Craving CTA",
    ],
    emotionalArc: "Sight → sound → taste imagination",
    payoffLine: "Body responds before brain decides.",
  },
  "date-night-fantasy": {
    id: "date-night-fantasy",
    label: "Date-night fantasy",
    hookBeat: "Romantic tension with food as prop.",
    slideProgression: [
      "Arrival mood",
      "Shared plate",
      "Light catch",
      "Quiet climax",
      "Book tonight CTA",
    ],
    emotionalArc: "Anticipation → intimacy → desire",
    payoffLine: "Couples see themselves in frame.",
  },
  "pov-storytelling": {
    id: "pov-storytelling",
    label: "POV storytelling",
    hookBeat: "You are there — handheld honesty.",
    slideProgression: [
      "POV approach",
      "Queue/stall energy",
      "First bite POV",
      "Reaction",
      "Share CTA",
    ],
    emotionalArc: "Immersion → payoff → share impulse",
    payoffLine: "Documentary trust beats polish.",
  },
  "relationship-carousel": {
    id: "relationship-carousel",
    label: "Relationship carousel",
    hookBeat: "Editorial stickers + emotional one-liners.",
    slideProgression: [
      "Burst hook",
      "Playful truth",
      "Comfort reveal",
      "Punchline slide",
      "Tag partner CTA",
    ],
    emotionalArc: "Playful → tender → memorable",
    payoffLine: "Feels like a comic about your table.",
  },
};

const GOAL_ARC: Record<StoryGoal, StoryArcId> = {
  "make-hungry": "sensory-progression",
  "luxury-desire": "luxury-escalation",
  "emotional-memory": "emotional-reveal",
  "viral-curiosity": "curiosity-payoff",
  "hidden-gem": "hidden-gem",
  "date-night": "date-night-fantasy",
  "monsoon-cafe": "comfort-nostalgia",
  "founder-story": "pov-storytelling",
  "comfort-nostalgia": "comfort-nostalgia",
};

const TEMPLATE_ARC: Partial<Record<TemplateId, StoryArcId>> = {
  "luxury-dining": "luxury-escalation",
  "street-food": "hidden-gem",
  "cinematic-dark": "emotional-reveal",
  "founder-story": "pov-storytelling",
  "rich-relationship": "relationship-carousel",
  "relationship-story": "relationship-carousel",
  "cozy-monsoon": "comfort-nostalgia",
  "doodle-story": "comfort-nostalgia",
};

export function resolveStoryArc(
  storyGoal: StoryGoal,
  templateId: TemplateId
): StoryArc {
  const fromTemplate = TEMPLATE_ARC[templateId];
  const id = fromTemplate ?? GOAL_ARC[storyGoal] ?? "curiosity-payoff";
  return ARCS[id];
}

export function getStoryArc(id: StoryArcId): StoryArc {
  return ARCS[id];
}

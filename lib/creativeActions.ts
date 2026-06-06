/** Quick cinematic actions — map to interpreter prompts. */
export type CreativeQuickActionId =
  | "cinematic"
  | "minimal"
  | "emotional"
  | "add-doodles"
  | "cleaner-type"
  | "luxury"
  | "focus-food"
  | "stronger-cta"
  | "editorial-collage"
  | "dark-cafe"
  | "pinterest"
  | "moody"
  | "bigger-type"
  | "less-clutter"
  | "add-steam"
  | "softer";

export type CreativeQuickAction = {
  id: CreativeQuickActionId;
  label: string;
  prompt: string;
};

export const CREATIVE_QUICK_ACTIONS: CreativeQuickAction[] = [
  { id: "cinematic", label: "Cinematic", prompt: "Make this more cinematic" },
  { id: "luxury", label: "Luxury", prompt: "More luxury editorial" },
  { id: "minimal", label: "Minimal", prompt: "Make this minimal with more breathing room" },
  { id: "pinterest", label: "Pinterest", prompt: "More Pinterest aesthetic" },
  { id: "emotional", label: "Emotional", prompt: "Make this emotionally softer" },
  { id: "moody", label: "Moody", prompt: "Make this moodier and darker" },
  { id: "editorial-collage", label: "Editorial", prompt: "More editorial collage rhythm" },
  { id: "add-doodles", label: "Doodle-heavy", prompt: "Add steam doodles and storytelling accents" },
  { id: "cleaner-type", label: "Cleaner", prompt: "Cleaner typography with less text" },
  { id: "bigger-type", label: "Bigger type", prompt: "Bigger typography hierarchy" },
  { id: "less-clutter", label: "Less clutter", prompt: "Reduce clutter and simplify" },
  { id: "focus-food", label: "Focus food", prompt: "Focus more on the food subject" },
  { id: "stronger-cta", label: "Stronger CTA", prompt: "Make the CTA stronger" },
  { id: "dark-cafe", label: "Dark café", prompt: "Add warm café lighting and dark cozy mood" },
  { id: "add-steam", label: "Steam", prompt: "Add steam doodles framing the dish" },
  { id: "softer", label: "Softer", prompt: "Make this emotionally softer and gentler" },
];

export const CREATIVE_SUGGESTION_CHIPS = [
  "Make this moodier",
  "More luxury",
  "Add steam doodles",
  "Bigger typography",
  "Reduce clutter",
  "Warm café lighting",
] as const;

export const MAX_CREATIVE_HISTORY = 12;

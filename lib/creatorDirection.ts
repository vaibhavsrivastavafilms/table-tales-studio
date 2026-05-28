import type { PlatformModeId } from "@/lib/platformModes";
import type { ViralHookMode } from "@/lib/viralHooks";
import type { CaptionDensityPref } from "@/lib/directorProfile";

export type StoryGoal =
  | "make-hungry"
  | "luxury-desire"
  | "emotional-memory"
  | "viral-curiosity"
  | "hidden-gem"
  | "date-night"
  | "monsoon-cafe"
  | "founder-story"
  | "comfort-nostalgia";

export type DirectionEmotion =
  | "warm"
  | "cozy"
  | "premium"
  | "sensual"
  | "exciting"
  | "emotional"
  | "nostalgic"
  | "dark-cinematic";

export type DirectionAudience =
  | "gen-z"
  | "couples"
  | "foodies"
  | "luxury"
  | "ahmedabad-locals"
  | "cafe-lovers"
  | "fine-dining";

export type CreatorDirection = {
  storyGoal: StoryGoal;
  emotion: DirectionEmotion;
  audience: DirectionAudience;
  platform: PlatformModeId;
  energy: number;
  captionDensity: CaptionDensityPref;
  viralityBalance: number;
};

export const STORY_GOALS: { id: StoryGoal; label: string }[] = [
  { id: "make-hungry", label: "Make people hungry" },
  { id: "luxury-desire", label: "Create luxury desire" },
  { id: "emotional-memory", label: "Emotional memory" },
  { id: "viral-curiosity", label: "Viral curiosity" },
  { id: "hidden-gem", label: "Hidden gem" },
  { id: "date-night", label: "Date-night fantasy" },
  { id: "monsoon-cafe", label: "Monsoon café mood" },
  { id: "founder-story", label: "Founder story" },
  { id: "comfort-nostalgia", label: "Comfort food nostalgia" },
];

export const DIRECTION_EMOTIONS: { id: DirectionEmotion; label: string }[] = [
  { id: "warm", label: "Warm" },
  { id: "cozy", label: "Cozy" },
  { id: "premium", label: "Premium" },
  { id: "sensual", label: "Sensual" },
  { id: "exciting", label: "Exciting" },
  { id: "emotional", label: "Emotional" },
  { id: "nostalgic", label: "Nostalgic" },
  { id: "dark-cinematic", label: "Dark cinematic" },
];

export const DIRECTION_AUDIENCES: { id: DirectionAudience; label: string }[] = [
  { id: "gen-z", label: "Gen Z" },
  { id: "couples", label: "Couples" },
  { id: "foodies", label: "Foodies" },
  { id: "luxury", label: "Luxury audience" },
  { id: "ahmedabad-locals", label: "Ahmedabad locals" },
  { id: "cafe-lovers", label: "Café lovers" },
  { id: "fine-dining", label: "Fine dining audience" },
];

export const DEFAULT_CREATOR_DIRECTION: CreatorDirection = {
  storyGoal: "make-hungry",
  emotion: "warm",
  audience: "foodies",
  platform: "instagram-carousel",
  energy: 55,
  captionDensity: "balanced",
  viralityBalance: 50,
};

export function hookIntensityFromBalance(
  viralityBalance: number
): "soft" | "balanced" | "viral" {
  if (viralityBalance >= 70) return "viral";
  if (viralityBalance <= 30) return "soft";
  return "balanced";
}

export function viralModeFromBalance(viralityBalance: number): ViralHookMode {
  if (viralityBalance >= 70) return "viral";
  if (viralityBalance <= 30) return "emotional";
  return "aesthetic";
}

export function pacingFromEnergy(energy: number): "slow-burn" | "dynamic" | "high-retention" {
  if (energy >= 72) return "high-retention";
  if (energy <= 35) return "slow-burn";
  return "dynamic";
}

export function labelStoryGoal(id: StoryGoal): string {
  return STORY_GOALS.find((g) => g.id === id)?.label ?? id;
}

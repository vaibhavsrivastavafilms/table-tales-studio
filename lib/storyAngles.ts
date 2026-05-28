import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type StoryAngleId =
  | "hidden-gem"
  | "luxury-experience"
  | "comfort-nostalgia"
  | "chef-craft"
  | "monsoon-cafe"
  | "founder-passion"
  | "late-night"
  | "sensory-overload"
  | "local-authentic";

export type NarrativeProfile = {
  primary: string;
  secondary: string[];
  angleId: StoryAngleId;
};

const ANGLE_CATALOG: Record<
  StoryAngleId,
  { label: string; weight: (v: VisualAnalysis) => number }
> = {
  "hidden-gem": {
    label: "hidden gem discovery",
    weight: (v) => v.streetFoodScore * 0.9 + (v.brightness > 0.5 ? 0.1 : 0),
  },
  "luxury-experience": {
    label: "luxury dining experience",
    weight: (v) => v.luxuryScore,
  },
  "comfort-nostalgia": {
    label: "comfort food nostalgia",
    weight: (v) => v.warmth * 0.6 + (v.cuisine === "comfort" ? 0.4 : 0),
  },
  "chef-craft": {
    label: "chef craftsmanship",
    weight: (v) => v.luxuryScore * 0.7 + (v.platingStyle === "fine dining" ? 0.3 : 0),
  },
  "monsoon-cafe": {
    label: "monsoon café mood",
    weight: (v) =>
      v.warmth * 0.5 + (v.brightness < 0.45 ? 0.35 : 0) + (v.cuisine === "café" ? 0.3 : 0),
  },
  "founder-passion": {
    label: "founder passion story",
    weight: (v) => 0.35 + (v.energy === "slow" ? 0.2 : 0),
  },
  "late-night": {
    label: "late-night cravings",
    weight: (v) => v.streetFoodScore * 0.5 + (v.brightness < 0.4 ? 0.35 : 0),
  },
  "sensory-overload": {
    label: "sensory overload",
    weight: (v) => (v.energy === "high" ? 0.85 : 0.2),
  },
  "local-authentic": {
    label: "authentic local flavor",
    weight: (v) => v.streetFoodScore * 0.65 + v.warmth * 0.2,
  },
};

export function getStoryAngles(analysis: VisualAnalysis): NarrativeProfile[] {
  return (Object.keys(ANGLE_CATALOG) as StoryAngleId[])
    .map((id) => ({
      angleId: id,
      primary: ANGLE_CATALOG[id].label,
      secondary: analysis.storytellingAngles.filter(
        (a) => a !== ANGLE_CATALOG[id].label
      ),
      score: ANGLE_CATALOG[id].weight(analysis),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ angleId, primary, secondary }) => ({
      angleId,
      primary,
      secondary: secondary.slice(0, 3),
    }));
}

export function rankNarrativeStrength(
  analysis: VisualAnalysis
): NarrativeProfile[] {
  return getStoryAngles(analysis);
}

export function getPrimaryNarrative(analysis: VisualAnalysis): NarrativeProfile {
  const ranked = rankNarrativeStrength(analysis);
  return ranked[0] ?? {
    angleId: "hidden-gem",
    primary: "hidden gem discovery",
    secondary: ["sensory detail"],
  };
}

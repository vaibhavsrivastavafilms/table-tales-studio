export type TrendCategory = "structure" | "style" | "hook" | "seasonal";

export type TrendItem = {
  id: string;
  category: TrendCategory;
  title: string;
  promptHint: string;
  tags: string[];
};

const LOCAL_TRENDS: TrendItem[] = [
  {
    id: "before-after-bite",
    category: "structure",
    title: "Before / After Bite",
    promptHint: "Open with the untouched plate, reveal the first bite on slide 2.",
    tags: ["carousel", "satisfying"],
  },
  {
    id: "one-location-arc",
    category: "structure",
    title: "One Location Arc",
    promptHint: "Anchor the story in a single place from arrival to last bite.",
    tags: ["local", "travel-food"],
  },
  {
    id: "chef-hand-reveal",
    category: "style",
    title: "Chef Hand Reveal",
    promptHint: "Build tension with hands and process before showing the hero dish.",
    tags: ["luxury", "craft"],
  },
  {
    id: "nostalgia-hook",
    category: "hook",
    title: "Nostalgia Hook",
    promptHint: "Start with a childhood food memory that contrasts today's dish.",
    tags: ["emotional"],
  },
  {
    id: "contrarian-food-take",
    category: "hook",
    title: "Contrarian Food Take",
    promptHint: "Open with a bold opinion about this dish category, then prove it.",
    tags: ["viral", "debate"],
  },
  {
    id: "seasonal-comfort",
    category: "seasonal",
    title: "Seasonal Comfort",
    promptHint: "Tie warmth and season to the first sensory detail in the hook.",
    tags: ["winter", "comfort"],
  },
  {
    id: "ramadan-iftar",
    category: "seasonal",
    title: "Gathering Table",
    promptHint: "Center community, shared plates, and the moment before the first taste.",
    tags: ["ramadan", "family"],
  },
  {
    id: "summer-street",
    category: "seasonal",
    title: "Summer Street Energy",
    promptHint: "Heat, crowd noise, and quick cuts between vendor and bite.",
    tags: ["summer", "street-food"],
  },
];

export function getTrendingItems(category?: TrendCategory): TrendItem[] {
  if (!category) return [...LOCAL_TRENDS];
  return LOCAL_TRENDS.filter((t) => t.category === category);
}

export function getTrendPromptAugmentation(): string {
  const picks = LOCAL_TRENDS.slice(0, 3)
    .map((t) => `- ${t.title}: ${t.promptHint}`)
    .join("\n");
  return `
Trend intelligence (apply subtly, do not name trends explicitly):
${picks}
`.trim();
}

export function getSeasonalPrompt(): string {
  const month = new Date().getMonth();
  if (month >= 10 || month <= 1) {
    return "Seasonal lens: cozy, indulgent, gathering-table energy.";
  }
  if (month >= 5 && month <= 7) {
    return "Seasonal lens: bright, outdoor, refreshing street-food energy.";
  }
  return "Seasonal lens: transitional comfort — warmth with freshness.";
}

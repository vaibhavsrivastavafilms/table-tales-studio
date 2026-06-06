import type {
  RestaurantTheme,
  ThemeFrameworkDefinition,
  ThemeSlideRole,
} from "@/lib/theme-engine/types";

const cta = (
  id: string,
  label: string,
  beat: string,
  verb: string
): ThemeSlideRole => ({
  id,
  label,
  beat,
  defaultVisualType: "brand",
  layout: "center",
  overlayStyle: "luxury",
  photoCategory: "interior",
  visualReasoning: `${verb} — brand-forward closing frame`,
});

function roles(...items: ThemeSlideRole[]): ThemeSlideRole[] {
  return items;
}

export const THEME_FRAMEWORK_MAP: Record<RestaurantTheme, ThemeFrameworkDefinition> = {
  "luxury-dining-experience": {
    theme: "luxury-dining-experience",
    name: "Luxury Dining Experience",
    description: "Premium atmosphere, signature plate, craftsmanship, and reservation CTA.",
    copyTone: "premium, sensory, editorial",
    promptStrategy: "Elevated dining arc: hook, atmosphere, signature dish, craft, experience, reserve.",
    slideRoles: roles(
      {
        id: "hook",
        label: "Hook",
        beat: "Pattern interrupt — the room before the first bite",
        defaultVisualType: "hero",
        layout: "full-bleed",
        overlayStyle: "luxury",
        photoCategory: "food",
        visualReasoning: "Best hero dish — highest drama and contrast",
      },
      {
        id: "atmosphere",
        label: "Atmosphere",
        beat: "The dining room, light, and mood",
        defaultVisualType: "wide",
        layout: "full-bleed",
        overlayStyle: "luxury",
        photoCategory: "interior",
        visualReasoning: "Best interior — warm lighting, elevated space",
      },
      {
        id: "signature-dish",
        label: "Signature Dish",
        beat: "The plate guests photograph first",
        defaultVisualType: "hero",
        layout: "center",
        overlayStyle: "editorial",
        photoCategory: "food",
        visualReasoning: "Hero plating — focal point and premium detail",
      },
      {
        id: "craftsmanship",
        label: "Craftsmanship",
        beat: "Hands, garnish, precision",
        defaultVisualType: "closeup",
        layout: "center",
        overlayStyle: "minimal",
        photoCategory: "detail",
        visualReasoning: "Best detail/plating — craft and texture",
      },
      {
        id: "experience",
        label: "Experience",
        beat: "The moment it lands on the table",
        defaultVisualType: "reaction",
        layout: "split",
        overlayStyle: "luxury",
        photoCategory: "people",
        visualReasoning: "People/reaction — human connection to the meal",
      },
      cta("reservation-cta", "Reservation CTA", "One table. One night.", "Reserve")
    ),
  },
  "coffee-culture": {
    theme: "coffee-culture",
    name: "Coffee Culture",
    description: "Morning ritual, craft, environment, and community.",
    copyTone: "cozy, lifestyle, community",
    promptStrategy: "Lifestyle coffee arc: hook, ritual, craft, space, community, visit.",
    slideRoles: roles(
      {
        id: "hook",
        label: "Hook",
        beat: "The first pour of the day",
        defaultVisualType: "hero",
        layout: "full-bleed",
        overlayStyle: "editorial",
        photoCategory: "drink",
        visualReasoning: "Hero coffee cup — steam and warmth",
      },
      {
        id: "morning-ritual",
        label: "Morning Ritual",
        beat: "Slow mornings, same counter",
        defaultVisualType: "detail",
        layout: "left-text",
        overlayStyle: "minimal",
        photoCategory: "drink",
        visualReasoning: "Drink detail — ritual and texture",
      },
      {
        id: "coffee-craft",
        label: "Coffee Craft",
        beat: "Beans, grind, pour",
        defaultVisualType: "closeup",
        layout: "center",
        overlayStyle: "editorial",
        photoCategory: "detail",
        visualReasoning: "Close-up craft — hands and equipment",
      },
      {
        id: "environment",
        label: "Environment",
        beat: "Your third-place corner",
        defaultVisualType: "wide",
        layout: "right-text",
        overlayStyle: "minimal",
        photoCategory: "interior",
        visualReasoning: "Café interior — community space",
      },
      {
        id: "community",
        label: "Community",
        beat: "Regulars, conversations, pause",
        defaultVisualType: "reaction",
        layout: "center",
        overlayStyle: "doodle",
        photoCategory: "people",
        visualReasoning: "People — community and belonging",
      },
      cta("visit-cta", "Visit CTA", "Pull up a chair.", "Visit")
    ),
  },
  "restaurant-launch": {
    theme: "restaurant-launch",
    name: "Restaurant Launch",
    description: "Before → challenge → progress → transformation → result.",
    copyTone: "bold, milestone, celebratory",
    promptStrategy: "Launch narrative: before, challenge, progress, payoff, result, visit.",
    slideRoles: roles(
      {
        id: "before",
        label: "Before",
        beat: "What the block used to feel like",
        defaultVisualType: "wide",
        layout: "left-text",
        overlayStyle: "editorial",
        photoCategory: "interior",
        visualReasoning: "Wide before context — empty or raw space",
      },
      {
        id: "challenge",
        label: "Challenge",
        beat: "What we had to solve to open",
        defaultVisualType: "detail",
        layout: "left-text",
        overlayStyle: "doodle",
        photoCategory: "detail",
        visualReasoning: "Detail tension — constraints and work",
      },
      {
        id: "progress",
        label: "Progress",
        beat: "Build week by week",
        defaultVisualType: "closeup",
        layout: "center",
        overlayStyle: "editorial",
        photoCategory: "people",
        visualReasoning: "Process — team at work",
      },
      {
        id: "transformation",
        label: "Transformation",
        beat: "Doors open — first service",
        defaultVisualType: "before-after",
        layout: "split",
        overlayStyle: "luxury",
        photoCategory: "interior",
        visualReasoning: "Transformation — space comes alive",
      },
      {
        id: "result",
        label: "Result",
        beat: "Full house, full hearts",
        defaultVisualType: "reaction",
        layout: "split",
        overlayStyle: "luxury",
        photoCategory: "people",
        visualReasoning: "Result — guest energy and payoff",
      },
      cta("visit-cta", "Visit CTA", "We're open.", "Visit")
    ),
  },
  "hidden-gem": {
    theme: "hidden-gem",
    name: "Hidden Gem",
    description: "Discovery arc for under-the-radar spots.",
    copyTone: "curious, insider, whispered",
    promptStrategy: "Discovery: secret hook, location, why locals go, dish, vibe, find us.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "You won't find this on the tourist map", defaultVisualType: "hero", layout: "full-bleed", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Hero dish — crave trigger" },
      { id: "location", label: "Location", beat: "The door you'd walk past", defaultVisualType: "wide", layout: "right-text", overlayStyle: "minimal", photoCategory: "interior", visualReasoning: "Exterior/interior — hidden entrance vibe" },
      { id: "local-secret", label: "Local Secret", beat: "Why regulars keep it quiet", defaultVisualType: "detail", layout: "left-text", overlayStyle: "doodle", photoCategory: "detail", visualReasoning: "Detail — authentic texture" },
      { id: "must-order", label: "Must Order", beat: "The one plate to get", defaultVisualType: "hero", layout: "center", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Signature food hero" },
      { id: "vibe", label: "Vibe", beat: "Small room, big feeling", defaultVisualType: "wide", layout: "full-bleed", overlayStyle: "editorial", photoCategory: "interior", visualReasoning: "Atmosphere wide shot" },
      cta("find-us-cta", "Find Us", "Save before everyone else does.", "Find")
    ),
  },
  "signature-dish": {
    theme: "signature-dish",
    name: "Signature Dish",
    description: "One hero plate told slide by slide.",
    copyTone: "crave-forward, sensory, direct",
    promptStrategy: "Dish hero: hook, ingredient, technique, moment, reaction, order.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "One bite changes the scroll", defaultVisualType: "hero", layout: "full-bleed", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Best hero food shot" },
      { id: "ingredient", label: "Ingredient", beat: "What makes it taste this way", defaultVisualType: "detail", layout: "left-text", overlayStyle: "minimal", photoCategory: "detail", visualReasoning: "Ingredient/detail close-up" },
      { id: "technique", label: "Technique", beat: "Heat, timing, finish", defaultVisualType: "closeup", layout: "center", overlayStyle: "editorial", photoCategory: "detail", visualReasoning: "Technique — hands and craft" },
      { id: "the-moment", label: "The Moment", beat: "Steam, crack, first cut", defaultVisualType: "hero", layout: "split", overlayStyle: "luxury", photoCategory: "food", visualReasoning: "Peak food moment" },
      { id: "reaction", label: "Reaction", beat: "That face when it lands", defaultVisualType: "reaction", layout: "center", overlayStyle: "editorial", photoCategory: "people", visualReasoning: "Guest reaction" },
      cta("order-cta", "Order CTA", "Try it this week.", "Order")
    ),
  },
  "chef-craftsmanship": {
    theme: "chef-craftsmanship",
    name: "Chef Craftsmanship",
    description: "Chef-led craft and kitchen pride.",
    copyTone: "authentic, precise, respectful",
    promptStrategy: "Chef story: hook, philosophy, technique, kitchen, plate, book.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "Every plate passes through these hands", defaultVisualType: "closeup", layout: "full-bleed", overlayStyle: "editorial", photoCategory: "detail", visualReasoning: "Hands/craft close-up" },
      { id: "philosophy", label: "Philosophy", beat: "Why we cook this way", defaultVisualType: "wide", layout: "right-text", overlayStyle: "minimal", photoCategory: "interior", visualReasoning: "Kitchen wide — philosophy" },
      { id: "technique", label: "Technique", beat: "The move you don't see on the menu", defaultVisualType: "closeup", layout: "center", overlayStyle: "editorial", photoCategory: "detail", visualReasoning: "Technique detail" },
      { id: "kitchen", label: "Kitchen", beat: "Fire, focus, rhythm", defaultVisualType: "wide", layout: "split", overlayStyle: "editorial", photoCategory: "interior", visualReasoning: "Kitchen environment" },
      { id: "the-plate", label: "The Plate", beat: "Where craft becomes crave", defaultVisualType: "hero", layout: "center", overlayStyle: "luxury", photoCategory: "food", visualReasoning: "Finished plate hero" },
      cta("book-cta", "Book CTA", "Taste the craft.", "Book")
    ),
  },
  "new-menu-launch": {
    theme: "new-menu-launch",
    name: "New Menu Launch",
    description: "Fresh items and seasonal excitement.",
    copyTone: "fresh, limited, exciting",
    promptStrategy: "Menu drop: tease, new item, chef pick, pairing, proof, visit.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "The menu just changed — here's what to order first", defaultVisualType: "hero", layout: "full-bleed", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Hero new dish" },
      { id: "new-item", label: "New Item", beat: "First look at the headline plate", defaultVisualType: "hero", layout: "center", overlayStyle: "luxury", photoCategory: "food", visualReasoning: "New item hero" },
      { id: "chef-pick", label: "Chef Pick", beat: "If you only order one thing", defaultVisualType: "closeup", layout: "left-text", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Chef's pick close-up" },
      { id: "pairing", label: "Pairing", beat: "What to drink with it", defaultVisualType: "detail", layout: "right-text", overlayStyle: "minimal", photoCategory: "drink", visualReasoning: "Drink pairing shot" },
      { id: "proof", label: "Proof", beat: "Early guest reactions", defaultVisualType: "reaction", layout: "center", overlayStyle: "editorial", photoCategory: "people", visualReasoning: "Social proof — people enjoying" },
      cta("visit-cta", "Visit CTA", "Available now for a limited run.", "Visit")
    ),
  },
  "date-night": {
    theme: "date-night",
    name: "Date Night",
    description: "Intimate dining and romantic atmosphere.",
    copyTone: "intimate, warm, inviting",
    promptStrategy: "Romance arc: hook, ambiance, shared plate, toast, moment, reserve.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "The table you'll remember", defaultVisualType: "hero", layout: "full-bleed", overlayStyle: "luxury", photoCategory: "interior", visualReasoning: "Romantic table/interior" },
      { id: "ambiance", label: "Ambiance", beat: "Low light, slow evening", defaultVisualType: "wide", layout: "full-bleed", overlayStyle: "luxury", photoCategory: "interior", visualReasoning: "Warm interior wide" },
      { id: "shared-plate", label: "Shared Plate", beat: "Designed for two forks", defaultVisualType: "hero", layout: "center", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Shared dish hero" },
      { id: "toast", label: "Toast", beat: "Glasses up", defaultVisualType: "detail", layout: "center", overlayStyle: "luxury", photoCategory: "drink", visualReasoning: "Wine/drink detail" },
      { id: "moment", label: "Moment", beat: "Laughter between courses", defaultVisualType: "reaction", layout: "split", overlayStyle: "editorial", photoCategory: "people", visualReasoning: "Couple/people moment" },
      cta("reservation-cta", "Reservation CTA", "Book your night.", "Reserve")
    ),
  },
  "brunch-experience": {
    theme: "brunch-experience",
    name: "Brunch Experience",
    description: "Bright, leisurely weekend energy.",
    copyTone: "bright, relaxed, social",
    promptStrategy: "Brunch: hook, spread, coffee, sunny vibe, friends, weekend CTA.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "Weekends taste better here", defaultVisualType: "hero", layout: "full-bleed", overlayStyle: "doodle", photoCategory: "food", visualReasoning: "Bright food hero" },
      { id: "spread", label: "Spread", beat: "The table at 11am", defaultVisualType: "wide", layout: "center", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Table spread wide" },
      { id: "coffee", label: "Coffee", beat: "Second cup energy", defaultVisualType: "detail", layout: "left-text", overlayStyle: "minimal", photoCategory: "drink", visualReasoning: "Coffee/brunch drink" },
      { id: "sunny-vibe", label: "Sunny Vibe", beat: "Light through the windows", defaultVisualType: "wide", layout: "full-bleed", overlayStyle: "minimal", photoCategory: "interior", visualReasoning: "Bright interior" },
      { id: "friends", label: "Friends", beat: "The group chat will thank you", defaultVisualType: "reaction", layout: "center", overlayStyle: "doodle", photoCategory: "people", visualReasoning: "Social brunch moment" },
      cta("weekend-cta", "Weekend CTA", "Brunch this Saturday.", "Book")
    ),
  },
  "behind-the-scenes": {
    theme: "behind-the-scenes",
    name: "Behind The Scenes",
    description: "Documentary kitchen and team authenticity.",
    copyTone: "authentic, documentary, human",
    promptStrategy: "BTS: hook, prep, team, chaos, pride, follow.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "What service actually looks like", defaultVisualType: "wide", layout: "full-bleed", overlayStyle: "editorial", photoCategory: "interior", visualReasoning: "Kitchen wide — documentary" },
      { id: "prep", label: "Prep", beat: "Before the first ticket", defaultVisualType: "closeup", layout: "left-text", overlayStyle: "minimal", photoCategory: "detail", visualReasoning: "Prep detail" },
      { id: "team", label: "Team", beat: "The people behind the pass", defaultVisualType: "reaction", layout: "center", overlayStyle: "editorial", photoCategory: "people", visualReasoning: "Team/people focus" },
      { id: "rush", label: "Rush", beat: "When the dining room fills", defaultVisualType: "wide", layout: "split", overlayStyle: "editorial", photoCategory: "interior", visualReasoning: "Busy kitchen energy" },
      { id: "pride", label: "Pride", beat: "Plating under pressure", defaultVisualType: "hero", layout: "center", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Final plate under pressure" },
      cta("follow-cta", "Follow CTA", "More BTS on our feed.", "Follow")
    ),
  },
  "local-favorite": {
    theme: "local-favorite",
    name: "Local Favorite",
    description: "Neighborhood staple energy.",
    copyTone: "warm, familiar, proud",
    promptStrategy: "Local love: hook, neighborhood, regulars, dish, legacy, visit.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "The spot your neighbor sends you to", defaultVisualType: "hero", layout: "full-bleed", overlayStyle: "doodle", photoCategory: "food", visualReasoning: "Beloved dish hero" },
      { id: "neighborhood", label: "Neighborhood", beat: "Same corner, years of stories", defaultVisualType: "wide", layout: "right-text", overlayStyle: "editorial", photoCategory: "wide", visualReasoning: "Street/neighborhood wide" },
      { id: "regulars", label: "Regulars", beat: "Names on the mugs", defaultVisualType: "reaction", layout: "center", overlayStyle: "doodle", photoCategory: "people", visualReasoning: "Regulars — people" },
      { id: "go-to-dish", label: "Go-To Dish", beat: "What everyone orders", defaultVisualType: "hero", layout: "center", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Go-to plate" },
      { id: "legacy", label: "Legacy", beat: "Why it still matters", defaultVisualType: "detail", layout: "left-text", overlayStyle: "minimal", photoCategory: "interior", visualReasoning: "Heritage detail/interior" },
      cta("visit-cta", "Visit CTA", "Pull up a chair.", "Visit")
    ),
  },
  "farm-to-table": {
    theme: "farm-to-table",
    name: "Farm To Table",
    description: "Provenance, seasonality, and honest ingredients.",
    copyTone: "earthy, honest, seasonal",
    promptStrategy: "Provenance: hook, source, harvest, kitchen, plate, taste.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "From soil to plate — same day", defaultVisualType: "wide", layout: "full-bleed", overlayStyle: "editorial", photoCategory: "wide", visualReasoning: "Farm/produce wide" },
      { id: "source", label: "Source", beat: "Who grows what we serve", defaultVisualType: "detail", layout: "left-text", overlayStyle: "minimal", photoCategory: "detail", visualReasoning: "Produce detail" },
      { id: "harvest", label: "Harvest", beat: "Seasonal peak", defaultVisualType: "closeup", layout: "center", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Fresh ingredient close-up" },
      { id: "kitchen", label: "Kitchen", beat: "Minimal intervention, maximum flavor", defaultVisualType: "closeup", layout: "center", overlayStyle: "minimal", photoCategory: "detail", visualReasoning: "Simple kitchen craft" },
      { id: "plate", label: "Plate", beat: "Honest food, no disguise", defaultVisualType: "hero", layout: "center", overlayStyle: "editorial", photoCategory: "food", visualReasoning: "Natural plate hero" },
      cta("taste-cta", "Taste CTA", "Taste the season.", "Visit")
    ),
  },
  "restaurant-transformation": {
    theme: "restaurant-transformation",
    name: "Restaurant Transformation",
    description: "Renovation, rebrand, or concept evolution.",
    copyTone: "dramatic, before-after, proud",
    promptStrategy: "Transform: hook, before, work, reveal, after, visit.",
    slideRoles: roles(
      { id: "hook", label: "Hook", beat: "You won't recognize this room", defaultVisualType: "before-after", layout: "split", overlayStyle: "editorial", photoCategory: "interior", visualReasoning: "Before/after tease" },
      { id: "before", label: "Before", beat: "What we started with", defaultVisualType: "wide", layout: "left-text", overlayStyle: "minimal", photoCategory: "interior", visualReasoning: "Before interior" },
      { id: "the-work", label: "The Work", beat: "The messy middle", defaultVisualType: "detail", layout: "center", overlayStyle: "doodle", photoCategory: "detail", visualReasoning: "Construction/renovation detail" },
      { id: "reveal", label: "Reveal", beat: "Lights on, doors open", defaultVisualType: "hero", layout: "full-bleed", overlayStyle: "luxury", photoCategory: "interior", visualReasoning: "Revealed space hero" },
      { id: "after", label: "After", beat: "Full tables, new chapter", defaultVisualType: "reaction", layout: "split", overlayStyle: "luxury", photoCategory: "people", visualReasoning: "After — guests and energy" },
      cta("visit-cta", "Visit CTA", "See the new chapter.", "Visit")
    ),
  },
};

export const THEME_DISPLAY_NAMES: Record<RestaurantTheme, string> = Object.fromEntries(
  Object.values(THEME_FRAMEWORK_MAP).map((d) => [d.theme, d.name])
) as Record<RestaurantTheme, string>;

export function getThemeFramework(theme: RestaurantTheme): ThemeFrameworkDefinition {
  return THEME_FRAMEWORK_MAP[theme];
}

export function listThemeFrameworks(): ThemeFrameworkDefinition[] {
  return Object.values(THEME_FRAMEWORK_MAP);
}

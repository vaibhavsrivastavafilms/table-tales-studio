import type { NarrativeDoodleSpec } from "@/lib/carousel-renderer/composition-types";

export const FRESH_FEELGOOD_CAMPAIGN_ID = "fresh-feelgood-food" as const;

export const FRESH_FEELGOOD_THEME = "Fresh. Fun. Feel-Good Food.";

export const FRESH_FEELGOOD_ACCENT = "#F5C542";

/** Appended to every per-slide AI doodle prompt. */
export const FRESH_FEELGOOD_CONSISTENCY_BLOCK = `Maintain identical doodle style across all carousel slides. Use clean white hand-drawn notebook-style illustrations with consistent 3px–5px stroke thickness and spacing. Preserve 100% of the original food photography. Doodles should complement, not replace, the image. Premium editorial café branding. Warm storytelling aesthetic. Minimal but expressive. Instagram carousel quality. No clutter. No cartoon overload. Realistic food remains the hero. Yellow accent highlights (${FRESH_FEELGOOD_ACCENT}) only as subtle stars and marks — never cover hero food.`;

export type FreshFeelgoodSlideSpec = {
  index: number;
  dishId: string;
  title: string;
  matchers: RegExp[];
  headline: string;
  subhead: string;
  doodlePrompt: string;
  narrativeDoodles: NarrativeDoodleSpec[];
};

export const FRESH_FEELGOOD_SLIDES: readonly FreshFeelgoodSlideSpec[] = [
  {
    index: 1,
    dishId: "apple-cooler",
    title: "Apple Cooler",
    matchers: [/apple/i, /cooler/i, /apple-cooler/i, /apple\s*cool/i],
    headline: "CRISP. COOL. REFRESHING.",
    subhead: "Nature's reset button.",
    doodlePrompt: `Preserve the original apple drink exactly as photographed. Add elegant white hand-drawn doodles showing: floating apple slices, freshness sparkles, tiny leaves, swirling refreshment lines, playful smiley reaction, hand-drawn arrows pointing toward the drink. Add subtle yellow accent stars and highlights. Create a feeling of crisp freshness and natural fruit energy. Doodles should wrap around the glass while keeping the drink as the hero.`,
    narrativeDoodles: [
      { type: "sparkle", anchor: "above-hero-dish", scale: 0.5 },
      { type: "star", anchor: "corner-tr", scale: 0.44 },
      { type: "arrow", anchor: "point-to-hero-dish", scale: 0.46 },
      { type: "circle", anchor: "corner-bl", scale: 0.4 },
    ],
  },
  {
    index: 2,
    dishId: "cookie-chocolate-shake",
    title: "Cookie Chocolate Shake",
    matchers: [
      /cookie/i,
      /chocolate/i,
      /shake/i,
      /milkshake/i,
      /choc.*shake/i,
    ],
    headline: "SIP HAPPINESS.",
    subhead: "One shake. Endless smiles.",
    doodlePrompt: `Preserve the milkshake and cookie exactly. Add white doodles showing: chocolate drips, floating cookies, whipped cream swirls, happy dessert character, excitement sparkles, playful motion lines. Add yellow highlights around the cookie and whipped cream. Create an indulgent and joyful dessert-story feeling.`,
    narrativeDoodles: [
      { type: "heart", anchor: "near-emotional-copy", scale: 0.42 },
      { type: "sparkle", anchor: "corner-tr", scale: 0.48 },
      { type: "star", anchor: "point-to-hero-dish", scale: 0.4 },
      { type: "arrow", anchor: "point-to-hero-dish", scale: 0.44 },
    ],
  },
  {
    index: 3,
    dishId: "caesar-salad",
    title: "Caesar Salad",
    matchers: [/caesar/i, /caesar-salad/i, /cesar/i],
    headline: "FRESHNESS IN EVERY BITE.",
    subhead: "",
    doodlePrompt: `Preserve all salad ingredients. Add white doodles showing: parmesan flakes, herb sketches, crunchy crouton illustrations, freshness sparkles, ingredient callouts, small hand-drawn arrows. Add yellow accent marks highlighting texture and crunch. Make the salad feel fresh, premium, and satisfying.`,
    narrativeDoodles: [
      { type: "sparkle", anchor: "above-hero-dish", scale: 0.5 },
      { type: "arrow", anchor: "point-to-hero-dish", scale: 0.45 },
      { type: "scribble", anchor: "near-insight-copy", scale: 0.46 },
      { type: "star", anchor: "corner-br", scale: 0.4 },
    ],
  },
  {
    index: 4,
    dishId: "hazelnut-frappe",
    title: "Hazelnut Chocolate Frappe",
    matchers: [/hazelnut/i, /frappe/i, /hazelnut.*frappe/i, /chocolate.*frappe/i],
    headline: "RICH. CREAMY. IRRESISTIBLE.",
    subhead: "",
    doodlePrompt: `Preserve the drink, whipped cream, chocolate drizzle, and hazelnuts. Add white doodles showing: cocoa beans, hazelnut sketches, floating hearts, chocolate swirl trails, aroma lines, tiny doodle character enjoying the drink. Use yellow highlights around the chocolate drizzle. Create a rich, comforting café-dessert mood.`,
    narrativeDoodles: [
      { type: "heart", anchor: "near-emotional-copy", scale: 0.44 },
      { type: "steam", anchor: "above-hero-dish", scale: 0.46 },
      { type: "star", anchor: "point-to-drink", scale: 0.42 },
      { type: "circle", anchor: "corner-tl", scale: 0.38 },
    ],
  },
  {
    index: 5,
    dishId: "fruit-bowl",
    title: "Fruit Bowl",
    matchers: [/fruit/i, /fruit-bowl/i, /fruit\s*bowl/i, /citrus/i, /tropical/i],
    headline: "A BOWL FULL OF SUNSHINE.",
    subhead: "",
    doodlePrompt: `Preserve all fruit pieces exactly. Add white doodles showing: citrus slices, tropical leaves, juice splash effects, sunshine icons, freshness stars, fruit-inspired motion lines. Add yellow accents around orange slices. Create a bright, energetic, healthy mood.`,
    narrativeDoodles: [
      { type: "star", anchor: "corner-tr", scale: 0.5 },
      { type: "sparkle", anchor: "above-hero-dish", scale: 0.48 },
      { type: "sparkle", anchor: "corner-bl", scale: 0.42 },
      { type: "arrow", anchor: "point-to-hero-dish", scale: 0.44 },
    ],
  },
  {
    index: 6,
    dishId: "mediterranean-salad",
    title: "Mediterranean Salad",
    matchers: [
      /mediterranean/i,
      /med.*salad/i,
      /mediterranean-salad/i,
      /olive/i,
      /greek/i,
    ],
    headline: "GOOD FOOD. GOOD MOOD.",
    subhead: "",
    doodlePrompt: `Preserve all vegetables, olives, herbs, and textures. Add white doodles showing: olive branch sketches, herb illustrations, ingredient labels, freshness sparkles, tiny chef doodle, hand-drawn arrows highlighting ingredients. Add subtle yellow accents on premium ingredients. Create a wholesome artisan café feeling.`,
    narrativeDoodles: [
      { type: "people", anchor: "beside-table-left", scale: 0.48 },
      { type: "arrow", anchor: "point-to-hero-dish", scale: 0.44 },
      { type: "sparkle", anchor: "corner-tr", scale: 0.46 },
      { type: "light-bulb", anchor: "near-insight-copy", scale: 0.42 },
    ],
  },
] as const;

export const FRESH_FEELGOOD_VISUAL_STYLE = {
  doodleStroke: "3px–5px white hand-drawn stroke",
  doodleColor: "#ffffff",
  accent: FRESH_FEELGOOD_ACCENT,
  mood: "warm café storytelling",
  photoRule: "preserve original food photography — never cover hero food",
} as const;

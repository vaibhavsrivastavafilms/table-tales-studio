import {
  DOODLE_CAFE_ROLES,
  type DoodleCafeSlideRole,
} from "@/lib/carousel-renderer/layout-engine";
import type { CarouselTemplateId } from "@/lib/carousel-renderer/project-types";

export type TemplateSlideDef = {
  index: number;
  role: DoodleCafeSlideRole;
  label: string;
  description: string;
  defaultHeadline: string;
  defaultSubhead?: string;
  photoCategory: "hero-food" | "interior" | "food-close" | "drink" | "people" | "any";
};

export type TemplateDefinition = {
  id: CarouselTemplateId;
  name: string;
  slideCount: number;
  slides: TemplateSlideDef[];
};

export const DOODLE_CAFE_TEMPLATE: TemplateDefinition = {
  id: "doodle-cafe",
  name: "Doodle Café Stories",
  slideCount: 8,
  slides: [
    {
      index: 1,
      role: "hero-hook",
      label: "Hook",
      description: "Hero food image, yellow brush sticker headline, simple doodle characters",
      defaultHeadline: "NOT JUST FOOD.\nIT'S A WHOLE FEELING.",
      photoCategory: "hero-food",
    },
    {
      index: 2,
      role: "atmosphere",
      label: "Atmosphere",
      description: "Interior / wide shot, people doodle overlays",
      defaultHeadline: "COFFEE.\nCONVERSATIONS.\nCOMFORT.",
      photoCategory: "interior",
    },
    {
      index: 3,
      role: "food-steam",
      label: "Food Close-up",
      description: "Food closeup with steam doodles",
      defaultHeadline: "STEAM RISES.\nCRAVINGS FOLLOW.",
      photoCategory: "food-close",
    },
    {
      index: 4,
      role: "drink",
      label: "Drink",
      description: "Drink closeup with drink doodles",
      defaultHeadline: "SIP.\nCHILL.\nREPEAT.",
      photoCategory: "drink",
    },
    {
      index: 5,
      role: "community-cta",
      label: "Community",
      description: "Community vibe + Save this spot CTA",
      defaultHeadline: "THE BEST KINDS OF\nTALKS HAPPEN HERE.",
      defaultSubhead: "SAVE THIS SPOT →",
      photoCategory: "people",
    },
    {
      index: 6,
      role: "quote",
      label: "Quote",
      description: "Quote slide with illustrated light bulbs",
      defaultHeadline: "Good food is\nthe conversation\nyou remember.",
      photoCategory: "interior",
    },
    {
      index: 7,
      role: "hero-payoff",
      label: "Payoff",
      description: "Hero dish payoff",
      defaultHeadline: "GOOD FOOD.\nGOOD MOOD.",
      defaultSubhead: "SEE YOU SOON.",
      photoCategory: "hero-food",
    },
    {
      index: 8,
      role: "brand-end",
      label: "Brand",
      description: "Brand ending slide",
      defaultHeadline: "CAFÉ",
      defaultSubhead: "FOLLOW FOR THE NEXT CHAPTER →",
      photoCategory: "any",
    },
  ],
};

const TEMPLATES: Partial<Record<CarouselTemplateId, TemplateDefinition>> = {
  "doodle-cafe": DOODLE_CAFE_TEMPLATE,
};

export function getTemplate(id: CarouselTemplateId): TemplateDefinition {
  return TEMPLATES[id] ?? DOODLE_CAFE_TEMPLATE;
}

export function listTemplateIds(): CarouselTemplateId[] {
  return Object.keys(TEMPLATES) as CarouselTemplateId[];
}

export { DOODLE_CAFE_ROLES };

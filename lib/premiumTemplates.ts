import type { TemplateId } from "@/lib/templates";
export type PremiumTemplateMeta = {
  id: TemplateId | string;
  name: string;
  tagline: string;
  previewAccent: string;
  premium: boolean;
};

/** Marketplace entries — premium IDs extend base templates visually in UI. */
export const MARKETPLACE_TEMPLATES: PremiumTemplateMeta[] = [
  {
    id: "street-food",
    name: "Street Food",
    tagline: "Raw energy · community bites",
    previewAccent: "#f7c600",
    premium: false,
  },
  {
    id: "cinematic-dark",
    name: "Cinematic Dark",
    tagline: "Moody editorial · film grain feel",
    previewAccent: "#a78bfa",
    premium: false,
  },
  {
    id: "founder-story",
    name: "Founder Story",
    tagline: "Mission-led · authentic build",
    previewAccent: "#38bdf8",
    premium: false,
  },
  {
    id: "luxury-dining",
    name: "Luxury Dining",
    tagline: "Fine dining · slow luxury",
    previewAccent: "#d4af37",
    premium: false,
  },
  {
    id: "rich-relationship",
    name: "Rich Relationship",
    tagline: "Emotional editorial · comic stickers on warm food",
    previewAccent: "#e8c4a0",
    premium: false,
  },
  {
    id: "neon-night-market",
    name: "Neon Night Market",
    tagline: "Vibrant street neon · late-night energy",
    previewAccent: "#ff6b9d",
    premium: true,
  },
  {
    id: "heritage-table",
    name: "Heritage Table",
    tagline: "Generational recipes · warm film",
    previewAccent: "#c9a66b",
    premium: true,
  },
];

export function isPremiumTemplate(templateId: string): boolean {
  const entry = MARKETPLACE_TEMPLATES.find((t) => t.id === templateId);
  return entry?.premium ?? false;
}

export function canUseTemplate(): boolean {
  return true;
}

export function resolveTemplateForExport(
  templateId: string
): TemplateId {
  if (templateId === "neon-night-market") return "cinematic-dark";
  if (templateId === "heritage-table") return "luxury-dining";
  if (
    templateId === "street-food" ||
    templateId === "cinematic-dark" ||
    templateId === "founder-story" ||
    templateId === "luxury-dining" ||
    templateId === "rich-relationship"
  ) {
    return templateId;
  }
  return "street-food";
}

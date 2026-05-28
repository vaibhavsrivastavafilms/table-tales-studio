import type { TemplateId } from "@/lib/templates";

export type BuilderTemplate = {
  id: TemplateId;
  label: string;
};

/** Production template picker — maps to art-direction engines in lib/templates */
export const BUILDER_TEMPLATE_OPTIONS: BuilderTemplate[] = [
  { id: "doodle-story", label: "Doodle Café" },
  { id: "luxury-dining", label: "Luxury Dining" },
  { id: "cinematic-dark", label: "Cinematic Dark" },
  { id: "street-food", label: "Street Food" },
  { id: "rich-relationship", label: "Pinterest Editorial" },
  { id: "cozy-monsoon", label: "Cozy Monsoon" },
  { id: "relationship-story", label: "Relationship Story" },
];

export const DEFAULT_BUILDER_TEMPLATE: TemplateId = "doodle-story";

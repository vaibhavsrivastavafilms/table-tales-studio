import type { TemplateId } from "@/lib/templates";

export type BuilderTemplate = {
  id: TemplateId;
  label: string;
};

export const BUILDER_TEMPLATE_OPTIONS: BuilderTemplate[] = [
  { id: "doodle-story", label: "Doodle Story" },
  { id: "luxury-dining", label: "Luxury Dining" },
  { id: "street-food", label: "Street Food" },
  { id: "cinematic-dark", label: "Cinematic Dark" },
  { id: "rich-relationship", label: "Pinterest Editorial" },
  { id: "founder-story", label: "Warm Relationship Story" },
];

export const DEFAULT_BUILDER_TEMPLATE: TemplateId = "doodle-story";

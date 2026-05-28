import type { Captions } from "@/lib/slides";
import type { TemplateId } from "@/lib/templates";

/** Cinematic restaurant sample — images from Unsplash (network on first load). */
export const DEMO_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80",
  "https://images.unsplash.com/photo-1550966849-9d4e6e0e0b0f?w=900&q=80",
  "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80",
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=900&q=80",
];

export const DEMO_CAPTIONS: Captions = {
  hook: "The reservation everyone whispers about.",
  slide1: "Low light. Linen. The first pour.",
  slide2: "Chef's counter — fire, precision, silence.",
  slide3: "A bite that slows the room.",
  slide4: "Dessert arrives like a finale.",
  cta: "Save this — your next date night starts here.",
};

export const DEMO_TEMPLATE_ID: TemplateId = "luxury-dining";

export const DEMO_PROJECT_TITLE = "Midnight Kitchen — Sample Story";

export type DemoProjectBundle = {
  title: string;
  templateId: TemplateId;
  captions: Captions;
  images: string[];
};

export function getDemoProject(): DemoProjectBundle {
  return {
    title: DEMO_PROJECT_TITLE,
    templateId: DEMO_TEMPLATE_ID,
    captions: DEMO_CAPTIONS,
    images: [...DEMO_IMAGE_URLS],
  };
}

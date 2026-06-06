/**
 * Table Tales — Carousel Rendering Engine
 *
 * Pipeline: Photos → Photo Intelligence → Theme/Story → Carousel JSON → Renderer → PNG
 *
 * NOT an image generator. Uploaded food photos remain the hero asset.
 */

export * from "@/lib/carousel-renderer/project-types";
export * from "@/lib/carousel-renderer/types";
export * from "@/lib/carousel-renderer/composition-types";
export * from "@/lib/carousel-renderer/composition-engine";
export * from "@/lib/carousel-renderer/subject-types";
export * from "@/lib/carousel-renderer/subject-engine";
export * from "@/lib/carousel-renderer/negative-space-engine";
export * from "@/lib/carousel-renderer/semantic-layouts";
export * from "@/lib/carousel-renderer/gemini-vision-subject";
export * from "@/lib/carousel-renderer/photo-treatment";
export * from "@/lib/carousel-renderer/food-first-layout";
export * from "@/lib/carousel-renderer/layout-presets";
export * from "@/lib/carousel-renderer/layout-engine";
export * from "@/lib/carousel-renderer/typography-engine";
export * from "@/lib/carousel-renderer/doodle-engine";
export * from "@/lib/carousel-renderer/doodle-registry";
export * from "@/lib/carousel-renderer/template-engine";
export * from "@/lib/carousel-renderer/slide-compositor";
export * from "@/lib/carousel-renderer/campaign-engine";
export * from "@/lib/carousel-renderer/campaigns/fresh-feelgood-food";
export * from "@/lib/carousel-renderer/hero-engine";
export * from "@/lib/carousel-renderer/photo-assignment";
export * from "@/lib/carousel-renderer/captions-bridge";
export * from "@/lib/carousel-renderer/pipeline";
export * from "@/lib/carousel-renderer/build-document";
export * from "@/lib/carousel-renderer/document-adapter";
export * from "@/lib/carousel-renderer/story-bridge";
export * from "@/lib/carousel-renderer/export-engine";
export * from "@/lib/carousel-renderer/export-png";
export * from "@/lib/carousel-renderer/svg-assets";
export * from "@/lib/carousel-renderer/geometry";

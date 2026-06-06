import { z } from "zod";

const scoreDimensionSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
});

const visualPlanSchema = z.object({
  visualType: z.string(),
  photoPreference: z.string().optional(),
  layout: z.string(),
  overlayStyle: z.string(),
  direction: z.string().optional(),
  preferredPhotoId: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().optional(),
});

const slideSchema = z.object({
  id: z.string(),
  role: z.string(),
  headline: z.string(),
  body: z.string(),
  visualPlan: visualPlanSchema,
});

const briefSchema = z.object({
  topic: z.string(),
  goal: z.string(),
  audience: z.string(),
  platform: z.string(),
  brand: z.string().optional(),
});

const storySchema = z.object({
  framework: z.enum([
    "transformation",
    "educational",
    "founder",
    "before-after",
    "case-study",
    "listicle",
  ]),
  hook: z.string(),
  structure: z.array(z.string()),
  slideRoles: z.array(z.string()).default([]),
});

const photoAssetSchema = z.object({
  id: z.string(),
  url: z.string(),
  category: z.string(),
  heroPotential: z.number(),
  brightness: z.number(),
  warmth: z.number(),
  compositionScore: z.number(),
  tags: z.array(z.string()),
});

export const carouselScoreSchema = z.object({
  hookStrength: scoreDimensionSchema,
  curiosity: scoreDimensionSchema,
  readability: scoreDimensionSchema,
  retention: scoreDimensionSchema,
  shareability: scoreDimensionSchema,
  narrativeFlow: scoreDimensionSchema,
  emotionalImpact: scoreDimensionSchema,
  visualCohesion: scoreDimensionSchema,
  platformFit: scoreDimensionSchema,
  ctaStrength: scoreDimensionSchema,
  overall: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  improvements: z.array(z.string()),
  priorityFixes: z.array(z.string()),
  suggestions: z.array(z.string()).optional(),
});

const revisionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  instruction: z.string(),
  snapshot: z.record(z.string(), z.unknown()),
  score: carouselScoreSchema.optional(),
  label: z.string().optional(),
});

export const carouselProjectSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  brief: briefSchema,
  story: storySchema,
  slides: z.array(slideSchema).min(1),
  score: carouselScoreSchema.optional(),
  revisions: z.array(revisionSchema).default([]),
  photos: z.array(photoAssetSchema).default([]),
  revisionCursor: z.number().int().min(-1).default(-1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export function parseCarouselProject(
  raw: unknown
): import("@/lib/story-engine/types").CarouselProject {
  return carouselProjectSchema.parse(raw) as import("@/lib/story-engine/types").CarouselProject;
}

export function safeParseCarouselProject(raw: unknown) {
  return carouselProjectSchema.safeParse(raw);
}

export const storyEngineInputSchema = z.object({
  topic: z.string().optional(),
  goal: z.string().optional(),
  audience: z.string().optional(),
  platform: z.string().optional(),
  brand: z.string().optional(),
  framework: z
    .enum([
      "transformation",
      "educational",
      "founder",
      "before-after",
      "case-study",
      "listicle",
    ])
    .optional(),
  templateName: z.string().optional(),
  imageCount: z.number().optional(),
  visualSummary: z.string().optional(),
  viralMode: z.string().optional(),
  captionTone: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
});

export const enhanceSlideInputSchema = z.object({
  project: carouselProjectSchema,
  slideId: z.string(),
  instruction: z.string().min(1),
});

import type { CaptionTone, NichePreference } from "@/lib/creatorMemory";
import type { PlatformModeId } from "@/lib/platformModes";
import type { TemplateId } from "@/lib/templates";
import type { ViralHookMode } from "@/lib/viralHooks";
import type { BrandKit } from "@/lib/brandKit";

export type QuickWorkflowId =
  | "viral-restaurant-launch"
  | "founder-story"
  | "street-food-doc"
  | "emotional-food-reel"
  | "luxury-dining-campaign"
  | "monsoon-cafe"
  | "reopening-campaign";

export type QuickWorkflow = {
  id: QuickWorkflowId;
  label: string;
  description: string;
  templateId: TemplateId;
  viralMode: ViralHookMode;
  captionTone: CaptionTone;
  platformMode: PlatformModeId;
  nichePreference: NichePreference;
  brandPatch: Partial<BrandKit>;
  hookSeed: string;
};

export const QUICK_WORKFLOWS: QuickWorkflow[] = [
  {
    id: "viral-restaurant-launch",
    label: "Viral Restaurant Launch",
    description: "Scroll-stopping hook, fast pacing, community CTA",
    templateId: "street-food",
    viralMode: "viral",
    captionTone: "playful",
    platformMode: "instagram-carousel",
    nichePreference: "street-food",
    brandPatch: { brandCta: "Save this — opening weekend only." },
    hookSeed: "Nobody noticed this tiny food stall… until now.",
  },
  {
    id: "founder-story",
    label: "Founder Story",
    description: "Origin tension → mission CTA",
    templateId: "founder-story",
    viralMode: "founder",
    captionTone: "founder",
    platformMode: "founder-documentary",
    nichePreference: "general",
    brandPatch: { brandCta: "Follow the build — we're just getting started." },
    hookSeed: "This restaurant started with one table.",
  },
  {
    id: "street-food-doc",
    label: "Street Food Documentary",
    description: "Handheld realism, sensory pacing",
    templateId: "street-food",
    viralMode: "emotional",
    captionTone: "raw",
    platformMode: "food-reel",
    nichePreference: "street-food",
    brandPatch: { introLine: "A lane you walk past every day." },
    hookSeed: "Ahmedabad almost lost this hidden place.",
  },
  {
    id: "emotional-food-reel",
    label: "Emotional Food Reel",
    description: "Memory-forward, soft CTA",
    templateId: "cinematic-dark",
    viralMode: "emotional",
    captionTone: "cinematic",
    platformMode: "reels-voiceover",
    nichePreference: "general",
    brandPatch: { brandCta: "Comment the meal that feels like home." },
    hookSeed: "The first bite that made everything quiet.",
  },
  {
    id: "luxury-dining-campaign",
    label: "Luxury Dining Campaign",
    description: "Restrained elegance, exclusive CTA",
    templateId: "luxury-dining",
    viralMode: "luxury",
    captionTone: "luxury",
    platformMode: "luxury-campaign",
    nichePreference: "fine-dining",
    brandPatch: { brandCta: "Reserve your seat — link in bio." },
    hookSeed: "They don't plate silence like this anymore.",
  },
  {
    id: "monsoon-cafe",
    label: "Monsoon Café Story",
    description: "Cozy seasonal mood, aesthetic pacing",
    templateId: "cinematic-dark",
    viralMode: "aesthetic",
    captionTone: "cinematic",
    platformMode: "instagram-carousel",
    nichePreference: "coffee",
    brandPatch: { introLine: "Rain on glass, steam on ceramic." },
    hookSeed: "The café everyone finds when the sky breaks.",
  },
  {
    id: "reopening-campaign",
    label: "Reopening Campaign",
    description: "Comeback energy, viral social proof",
    templateId: "street-food",
    viralMode: "viral",
    captionTone: "playful",
    platformMode: "shorts-script",
    nichePreference: "general",
    brandPatch: { brandCta: "Tag who you’re bringing opening night." },
    hookSeed: "We closed for 90 days. Tonight, the line is back.",
  },
];

const byId = new Map(QUICK_WORKFLOWS.map((w) => [w.id, w]));

export function getQuickWorkflow(id: QuickWorkflowId): QuickWorkflow | null {
  return byId.get(id) ?? null;
}

export type AppliedWorkflow = {
  templateId: TemplateId;
  viralMode: ViralHookMode;
  captionTone: CaptionTone;
  platformMode: PlatformModeId;
  nichePreference: NichePreference;
  brandPatch: Partial<BrandKit>;
  hookSeed: string;
  workflowId: QuickWorkflowId;
};

export function applyQuickWorkflow(id: QuickWorkflowId): AppliedWorkflow | null {
  const w = getQuickWorkflow(id);
  if (!w) return null;
  return {
    templateId: w.templateId,
    viralMode: w.viralMode,
    captionTone: w.captionTone,
    platformMode: w.platformMode,
    nichePreference: w.nichePreference,
    brandPatch: w.brandPatch,
    hookSeed: w.hookSeed,
    workflowId: w.id,
  };
}

import { getFrameworkDefinition } from "@/lib/story-engine/framework-engine";
import {
  enrichVisualPlanWithPhotos,
  pickBestPhoto,
} from "@/lib/story-engine/photo/photo-intelligence";
import type { PhotoAsset, Slide, SlideRole, VisualPlan } from "@/lib/story-engine/types";

const ROLE_VISUAL_DEFAULTS: Partial<
  Record<
    SlideRole,
    Omit<VisualPlan, "photoPreference" | "direction" | "preferredPhotoId" | "confidence" | "reasoning">
  >
> = {
  hook: { visualType: "hero", layout: "full-bleed", overlayStyle: "editorial" },
  problem: { visualType: "detail", layout: "left-text", overlayStyle: "doodle" },
  challenge: { visualType: "detail", layout: "left-text", overlayStyle: "doodle" },
  context: { visualType: "wide", layout: "right-text", overlayStyle: "editorial" },
  approach: { visualType: "wide", layout: "right-text", overlayStyle: "editorial" },
  insight: { visualType: "closeup", layout: "center", overlayStyle: "minimal" },
  breakthrough: { visualType: "closeup", layout: "center", overlayStyle: "minimal" },
  transformation: { visualType: "before-after", layout: "split", overlayStyle: "luxury" },
  result: { visualType: "reaction", layout: "split", overlayStyle: "luxury" },
  cta: { visualType: "text", layout: "center", overlayStyle: "luxury" },
};

const PHOTO_PREFERENCE: Partial<Record<SlideRole, string>> = {
  hook: "Hero dish or signature moment — high drama, shallow depth",
  problem: "Detail shot — texture, imperfection, tension",
  challenge: "Detail shot — constraint, tension",
  context: "Wide environmental — kitchen, street, dining room",
  approach: "Process or team — hands at work",
  insight: "Close-up — hands, steam, garnish, craft",
  breakthrough: "Peak moment — steam, reveal, reaction",
  transformation: "Before/after or hero payoff — golden hour",
  result: "Guest reaction or plated hero",
  cta: "Brand lockup, logo plate, or inviting table spread",
};

export function planVisualForRole(
  role: SlideRole,
  frameworkRoleIndex?: number,
  frameworkId?: import("@/lib/story-engine/types").StoryFramework
): VisualPlan {
  if (frameworkId !== undefined && frameworkRoleIndex !== undefined) {
    const def = getFrameworkDefinition(frameworkId);
    const fr = def.slideRoles[frameworkRoleIndex];
    if (fr) {
      const base = {
        visualType: fr.defaultVisualType,
        layout: "center" as const,
        overlayStyle: "editorial" as const,
      };
      return {
        ...base,
        photoPreference: PHOTO_PREFERENCE[role] ?? `${fr.label} visual`,
        direction: `${base.visualType} · ${base.layout} · ${base.overlayStyle}`,
      };
    }
  }
  const base = ROLE_VISUAL_DEFAULTS[role] ?? {
    visualType: "hero" as const,
    layout: "center" as const,
    overlayStyle: "editorial" as const,
  };
  return {
    ...base,
    photoPreference: PHOTO_PREFERENCE[role] ?? "Food-forward hero frame",
    direction: `${base.visualType} · ${base.layout} · ${base.overlayStyle}`,
  };
}

export function applyVisualPlanToSlides(
  slides: Slide[],
  photoAssets: PhotoAsset[] = []
): Slide[] {
  return slides.map((slide, index) => {
    let visualPlan = planVisualForRole(slide.role);
    if (photoAssets.length > 0) {
      const pick = pickBestPhoto(photoAssets, visualPlan.visualType);
      if (pick) {
        visualPlan = {
          ...visualPlan,
          preferredPhotoId: pick.photoId,
          confidence: pick.confidence,
          reasoning: pick.reasoning,
          photoPreference:
            photoAssets.find((a) => a.id === pick.photoId)?.url ??
            visualPlan.photoPreference,
        };
      }
    }
    const withPlan = { ...slide, visualPlan };
    return photoAssets.length
      ? { ...withPlan, visualPlan: enrichVisualPlanWithPhotos(withPlan, photoAssets) }
      : withPlan;
  });
}

export function applyVisualInstruction(
  plan: VisualPlan,
  instruction: string,
  role?: SlideRole
): VisualPlan {
  const lower = instruction.toLowerCase();
  const next = { ...plan };

  if (/cinematic|film|moody|dramatic/.test(lower)) {
    next.overlayStyle = "editorial";
    next.visualType = role === "hook" ? "hero" : next.visualType;
    next.layout = next.layout === "center" ? "full-bleed" : next.layout;
    next.direction = "Cinematic grade, deeper shadows, filmic crop";
  }
  if (/luxury|premium|elegant|fine dining/.test(lower)) {
    next.overlayStyle = "luxury";
    next.layout = "center";
    next.direction = "Luxury minimal type, negative space, refined palette";
  }
  if (/emotional|heart|feel|story/.test(lower)) {
    next.overlayStyle = "editorial";
    next.visualType = "reaction";
    next.direction = "Human moment, warm skin tones, intimate framing";
  }
  if (/curiosity|hook|scroll|stop/.test(lower)) {
    next.visualType = "hero";
    next.layout = "full-bleed";
    next.direction = "High contrast hook frame, bold negative space for headline";
  }
  if (/cta|action|follow|book|visit/.test(lower)) {
    next.visualType = "text";
    next.overlayStyle = "luxury";
    next.direction = "Clear CTA hierarchy, brand-forward closing frame";
  }
  if (/doodle|playful|sketch/.test(lower)) {
    next.overlayStyle = "doodle";
  }
  if (/minimal|clean|simple/.test(lower)) {
    next.overlayStyle = "minimal";
  }

  return next;
}

export function applyVisualInstructionForSlide(
  slide: Slide,
  instruction: string
): VisualPlan {
  return applyVisualInstruction(slide.visualPlan, instruction, slide.role);
}

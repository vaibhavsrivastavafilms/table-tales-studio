import type { Slide, SlideRole, VisualPlan } from "@/lib/story-engine/types";

const ROLE_VISUAL_DEFAULTS: Record<
  SlideRole,
  Omit<VisualPlan, "photoPreference" | "direction">
> = {
  hook: {
    visualType: "hero",
    layout: "full-bleed",
    overlayStyle: "editorial",
  },
  problem: {
    visualType: "detail",
    layout: "left-text",
    overlayStyle: "doodle",
  },
  context: {
    visualType: "wide",
    layout: "right-text",
    overlayStyle: "editorial",
  },
  insight: {
    visualType: "closeup",
    layout: "center",
    overlayStyle: "minimal",
  },
  transformation: {
    visualType: "before-after",
    layout: "split",
    overlayStyle: "luxury",
  },
  cta: {
    visualType: "text",
    layout: "center",
    overlayStyle: "luxury",
  },
};

const PHOTO_PREFERENCE: Record<SlideRole, string> = {
  hook: "Hero dish or signature moment — high drama, shallow depth",
  problem: "Detail shot — texture, imperfection, tension",
  context: "Wide environmental — kitchen, street, dining room",
  insight: "Close-up — hands, steam, garnish, craft",
  transformation: "Before/after or hero payoff — golden hour",
  cta: "Brand lockup, logo plate, or inviting table spread",
};

export function planVisualForRole(role: SlideRole): VisualPlan {
  const base = ROLE_VISUAL_DEFAULTS[role];
  return {
    ...base,
    photoPreference: PHOTO_PREFERENCE[role],
    direction: `${base.visualType} · ${base.layout} · ${base.overlayStyle}`,
  };
}

export function applyVisualPlanToSlides(slides: Slide[]): Slide[] {
  return slides.map((slide) => ({
    ...slide,
    visualPlan: planVisualForRole(slide.role),
  }));
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

// Fix applyVisualInstruction - Slide type doesn't have role on plan. Pass role separately.
export function applyVisualInstructionForSlide(
  slide: Slide,
  instruction: string
): VisualPlan {
  return applyVisualInstruction(slide.visualPlan, instruction, slide.role);
}

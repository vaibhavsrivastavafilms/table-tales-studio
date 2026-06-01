/** Story Engine domain model — single source of truth for carousel projects. */

export type StoryFramework =
  | "transformation"
  | "educational"
  | "founder"
  | "before-after"
  | "case-study"
  | "listicle";

export type SlideRole =
  | "hook"
  | "problem"
  | "context"
  | "insight"
  | "transformation"
  | "cta";

export type VisualType =
  | "hero"
  | "detail"
  | "closeup"
  | "reaction"
  | "wide"
  | "before-after"
  | "text";

export type SlideLayout =
  | "left-text"
  | "right-text"
  | "center"
  | "split"
  | "full-bleed";

export type OverlayStyle = "doodle" | "editorial" | "minimal" | "luxury";

export type VisualPlan = {
  visualType: VisualType;
  photoPreference?: string;
  layout: SlideLayout;
  overlayStyle: OverlayStyle;
  direction?: string;
};

export type CreativeBrief = {
  topic: string;
  goal: string;
  audience: string;
  platform: string;
  brand?: string;
};

export type StoryArchitecture = {
  framework: StoryFramework;
  hook: string;
  structure: string[];
};

export type Slide = {
  id: string;
  role: SlideRole;
  headline: string;
  body: string;
  visualPlan: VisualPlan;
};

export type CarouselScore = {
  hookStrength: number;
  curiosity: number;
  readability: number;
  retention: number;
  shareability: number;
  overall: number;
  suggestions: string[];
};

export type CarouselProject = {
  id: string;
  brief: CreativeBrief;
  story: StoryArchitecture;
  slides: Slide[];
  score?: CarouselScore;
  createdAt: string;
  updatedAt: string;
};

export type StoryEngineInput = {
  topic?: string;
  goal?: string;
  audience?: string;
  platform?: string;
  brand?: string;
  framework?: StoryFramework;
  templateName?: string;
  imageCount?: number;
  visualSummary?: string;
  viralMode?: string;
  captionTone?: string;
};

export type EnhanceSlideInput = {
  project: CarouselProject;
  slideId: string;
  instruction: string;
};

export type RenderedSlideView = {
  index: number;
  slide: Slide;
  displayText: string;
  captionKey: string;
};

export type CarouselRenderModel = {
  project: CarouselProject;
  slides: RenderedSlideView[];
  score?: CarouselScore;
};

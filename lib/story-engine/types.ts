/** Story Engine domain model — single source of truth for carousel projects. */

export type StoryFramework =
  | "transformation"
  | "educational"
  | "founder"
  | "before-after"
  | "case-study"
  | "listicle";

/** Framework-defined role id (e.g. hook, challenge, approach). */
export type SlideRole = string;

export type VisualType =
  | "hero"
  | "detail"
  | "closeup"
  | "reaction"
  | "wide"
  | "before-after"
  | "text"
  | "brand";

export type SlideLayout =
  | "left-text"
  | "right-text"
  | "center"
  | "split"
  | "full-bleed";

export type OverlayStyle = "doodle" | "editorial" | "minimal" | "luxury";

export type PhotoCategory =
  | "food"
  | "drink"
  | "interior"
  | "people"
  | "detail"
  | "wide"
  | "hero"
  | "other";

export type VisualPlan = {
  visualType: VisualType;
  photoPreference?: string;
  layout: SlideLayout;
  overlayStyle: OverlayStyle;
  direction?: string;
  preferredPhotoId?: string | null;
  confidence?: number;
  reasoning?: string;
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
  /** Ordered role ids from framework definition */
  slideRoles: string[];
};

export type Slide = {
  id: string;
  role: SlideRole;
  headline: string;
  body: string;
  visualPlan: VisualPlan;
};

export type ScoreDimension = {
  score: number;
  reasoning: string;
};

export type CarouselScore = {
  hookStrength: ScoreDimension;
  curiosity: ScoreDimension;
  readability: ScoreDimension;
  retention: ScoreDimension;
  shareability: ScoreDimension;
  narrativeFlow: ScoreDimension;
  emotionalImpact: ScoreDimension;
  visualCohesion: ScoreDimension;
  platformFit: ScoreDimension;
  ctaStrength: ScoreDimension;
  overall: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  priorityFixes: string[];
  /** @deprecated use improvements */
  suggestions?: string[];
};

export type ProjectRevision = {
  id: string;
  timestamp: string;
  instruction: string;
  snapshot: CarouselProject;
  score?: CarouselScore;
  label?: string;
};

export type PhotoAsset = {
  id: string;
  url: string;
  category: PhotoCategory;
  heroPotential: number;
  brightness: number;
  warmth: number;
  compositionScore: number;
  tags: string[];
};

export type PhotoAnalysis = {
  assets: PhotoAsset[];
  analyzedAt: string;
};

export type VisualRecommendation = {
  slideId: string;
  preferredPhotoId: string;
  confidence: number;
  reasoning: string;
};

export type CarouselProject = {
  id: string;
  version: number;
  brief: CreativeBrief;
  story: StoryArchitecture;
  slides: Slide[];
  score?: CarouselScore;
  revisions: ProjectRevision[];
  photos: PhotoAsset[];
  revisionCursor: number;
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
  photoUrls?: string[];
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

export type RevisionTimelineEntry = {
  revision: ProjectRevision;
  index: number;
  isCurrent: boolean;
  isFuture: boolean;
};

export type PlatformRenderTarget =
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "blog"
  | "thread";

export type ExportFormat =
  | "pdf"
  | "png"
  | "jpg"
  | "canva-json"
  | "figma-json"
  | "html";

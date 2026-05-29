export type GenerationStage =
  | "analyzing"
  | "detectingMood"
  | "extractingSubjects"
  | "buildingNarrative"
  | "artDirecting"
  | "composingSlides"
  | "renderingTypography"
  | "placingDoodles"
  | "finalizing"
  | "ready"
  | "idle";

export type SlideRenderState = "queued" | "generating" | "rendered";

export type GenerationStageMeta = {
  id: GenerationStage;
  label: string;
  description: string;
  weight: number;
  glow: string;
};

export const PIPELINE_STAGES: GenerationStage[] = [
  "analyzing",
  "detectingMood",
  "extractingSubjects",
  "buildingNarrative",
  "artDirecting",
  "composingSlides",
  "renderingTypography",
  "placingDoodles",
  "finalizing",
];

export const STAGE_META: Record<GenerationStage, GenerationStageMeta> = {
  idle: {
    id: "idle",
    label: "Studio ready",
    description: "Upload photos to begin art direction",
    weight: 0,
    glow: "#f4c430",
  },
  analyzing: {
    id: "analyzing",
    label: "Analyzing visuals",
    description: "Reading light, color, and food composition",
    weight: 8,
    glow: "#facc15",
  },
  detectingMood: {
    id: "detectingMood",
    label: "Detecting mood",
    description: "Mapping emotional tone across the story",
    weight: 7,
    glow: "#f4c430",
  },
  extractingSubjects: {
    id: "extractingSubjects",
    label: "Extracting subjects",
    description: "Isolating plates, drinks, and focal food",
    weight: 10,
    glow: "#fde047",
  },
  buildingNarrative: {
    id: "buildingNarrative",
    label: "Building narrative",
    description: "Shaping slide rhythm and storytelling arc",
    weight: 9,
    glow: "#f4c430",
  },
  artDirecting: {
    id: "artDirecting",
    label: "Art directing",
    description: "Building editorial composition rhythm",
    weight: 14,
    glow: "#facc15",
  },
  composingSlides: {
    id: "composingSlides",
    label: "Composing slides",
    description: "Layering cutouts, paper, and depth",
    weight: 16,
    glow: "#f4c430",
  },
  renderingTypography: {
    id: "renderingTypography",
    label: "Rendering typography",
    description: "Placing hero lines and editorial hierarchy",
    weight: 12,
    glow: "#fde68a",
  },
  placingDoodles: {
    id: "placingDoodles",
    label: "Placing doodles",
    description: "Framing the story with designer annotations",
    weight: 10,
    glow: "#f4c430",
  },
  finalizing: {
    id: "finalizing",
    label: "Finalizing",
    description: "Sharpening preview and export parity",
    weight: 8,
    glow: "#facc15",
  },
  ready: {
    id: "ready",
    label: "Carousel ready",
    description: "Art direction complete — review and export",
    weight: 6,
    glow: "#f4c430",
  },
};

const TOTAL_WEIGHT = PIPELINE_STAGES.reduce(
  (sum, id) => sum + STAGE_META[id].weight,
  0
);

export function stageFloorPercent(stage: GenerationStage): number {
  if (stage === "idle" || stage === "ready") return stage === "ready" ? 100 : 0;
  let sum = 0;
  for (const id of PIPELINE_STAGES) {
    if (id === stage) break;
    sum += STAGE_META[id].weight;
  }
  return Math.round((sum / TOTAL_WEIGHT) * 100);
}

export function stageCeilingPercent(stage: GenerationStage): number {
  if (stage === "ready") return 100;
  if (stage === "idle") return 0;
  let sum = 0;
  for (const id of PIPELINE_STAGES) {
    sum += STAGE_META[id].weight;
    if (id === stage) break;
  }
  return Math.min(99, Math.round((sum / TOTAL_WEIGHT) * 100));
}

export function formatElapsedMs(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function initialSlideStates(): Map<number, SlideRenderState> {
  return new Map([1, 2, 3, 4, 5, 6].map((i) => [i, "queued" as const]));
}

export type ExportGenerationStage =
  | "preparing"
  | "rendering"
  | "packaging"
  | "done";

export const EXPORT_STAGE_META: Record<
  ExportGenerationStage,
  { label: string; weight: number }
> = {
  preparing: { label: "Preparing retina export…", weight: 15 },
  rendering: { label: "Rendering carousel pack…", weight: 65 },
  packaging: { label: "Packaging ZIP…", weight: 20 },
  done: { label: "Export ready", weight: 0 },
};

export function exportPercent(stage: ExportGenerationStage, slideRatio = 0): number {
  if (stage === "done") return 100;
  if (stage === "preparing") return 12;
  if (stage === "packaging") return 88 + slideRatio * 10;
  return 20 + slideRatio * 65;
}

export type GenerationProgressSnapshot = {
  active: boolean;
  stage: GenerationStage;
  displayPercent: number;
  targetPercent: number;
  elapsedMs: number;
  slideStates: Map<number, SlideRenderState>;
};

export function createIdleProgress(): GenerationProgressSnapshot {
  return {
    active: false,
    stage: "idle",
    displayPercent: 0,
    targetPercent: 0,
    elapsedMs: 0,
    slideStates: initialSlideStates(),
  };
}

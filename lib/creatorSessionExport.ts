import type { Captions } from "@/lib/slides";
import type { BrandKit } from "@/lib/brandKit";
import type { CreatorMemory } from "@/lib/creatorMemory";
import type { PlatformModeId } from "@/lib/platformModes";
import type { TemplateId } from "@/lib/templates";
import type { ViralHookMode } from "@/lib/viralHooks";
import type { QuickWorkflowId } from "@/lib/quickWorkflows";
import { isBrowser } from "@/lib/browser";

export type ExportMetadata = {
  version: 1;
  exportedAt: string;
  templateId: TemplateId;
  viralMode: ViralHookMode;
  platformMode: PlatformModeId;
  slideCount: number;
  hasImages: boolean;
  workflowId?: QuickWorkflowId;
};

export type WorkflowPresetExport = {
  version: 1;
  kind: "workflow-preset";
  exportedAt: string;
  workflowId: QuickWorkflowId;
  templateId: TemplateId;
  viralMode: ViralHookMode;
  platformMode: PlatformModeId;
  captionTone: string;
  hookSeed: string;
};

export type CreatorSessionSnapshot = {
  version: 1;
  kind: "session-snapshot";
  exportedAt: string;
  projectId: string | null;
  templateId: TemplateId;
  captions: Captions;
  imageCount: number;
  viralMode: ViralHookMode;
  platformMode: PlatformModeId;
  brandKit: BrandKit;
  memory: Pick<
    CreatorMemory,
    | "preferredTemplateId"
    | "captionTone"
    | "viralMode"
    | "nichePreference"
    | "preferredCtaStyle"
  >;
};

export function buildExportMetadata(input: {
  templateId: TemplateId;
  viralMode: ViralHookMode;
  platformMode: PlatformModeId;
  imageCount: number;
  workflowId?: QuickWorkflowId;
}): ExportMetadata {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    templateId: input.templateId,
    viralMode: input.viralMode,
    platformMode: input.platformMode,
    slideCount: 6,
    hasImages: input.imageCount > 0,
    workflowId: input.workflowId,
  };
}

export function buildWorkflowPresetExport(
  workflowId: QuickWorkflowId,
  templateId: TemplateId,
  viralMode: ViralHookMode,
  platformMode: PlatformModeId,
  captionTone: string,
  hookSeed: string
): WorkflowPresetExport {
  return {
    version: 1,
    kind: "workflow-preset",
    exportedAt: new Date().toISOString(),
    workflowId,
    templateId,
    viralMode,
    platformMode,
    captionTone,
    hookSeed,
  };
}

export function buildSessionSnapshot(input: {
  projectId: string | null;
  templateId: TemplateId;
  captions: Captions;
  images: string[];
  viralMode: ViralHookMode;
  platformMode: PlatformModeId;
  brandKit: BrandKit;
  memory: CreatorMemory;
}): CreatorSessionSnapshot {
  return {
    version: 1,
    kind: "session-snapshot",
    exportedAt: new Date().toISOString(),
    projectId: input.projectId,
    templateId: input.templateId,
    captions: input.captions,
    imageCount: input.images.length,
    viralMode: input.viralMode,
    platformMode: input.platformMode,
    brandKit: input.brandKit,
    memory: {
      preferredTemplateId: input.memory.preferredTemplateId,
      captionTone: input.memory.captionTone,
      viralMode: input.memory.viralMode,
      nichePreference: input.memory.nichePreference,
      preferredCtaStyle: input.memory.preferredCtaStyle,
    },
  };
}

export function downloadCreatorJson(
  filename: string,
  payload: ExportMetadata | WorkflowPresetExport | CreatorSessionSnapshot
): void {
  if (!isBrowser()) return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

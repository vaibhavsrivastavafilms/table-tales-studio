"use client";

import { memo, useCallback } from "react";
import {
  buildExportMetadata,
  buildSessionSnapshot,
  buildWorkflowPresetExport,
  downloadCreatorJson,
} from "@/lib/creatorSessionExport";
import { loadCreatorMemory } from "@/lib/creatorMemory";
import type { Captions } from "@/lib/slides";
import type { BrandKit } from "@/lib/brandKit";
import type { PlatformModeId } from "@/lib/platformModes";
import type { TemplateId } from "@/lib/templates";
import type { ViralHookMode } from "@/lib/viralHooks";
import type { QuickWorkflowId } from "@/lib/quickWorkflows";

type SessionExportBarProps = {
  projectId: string | null;
  templateId: TemplateId;
  captions: Captions;
  images: string[];
  viralMode: ViralHookMode;
  platformMode: PlatformModeId;
  brandKit: BrandKit;
  workflowId?: QuickWorkflowId;
};

function SessionExportBar({
  projectId,
  templateId,
  captions,
  images,
  viralMode,
  platformMode,
  brandKit,
  workflowId,
}: SessionExportBarProps) {
  const exportMeta = useCallback(() => {
    downloadCreatorJson(
      "table-tales-export-meta.json",
      buildExportMetadata({
        templateId,
        viralMode,
        platformMode,
        imageCount: images.length,
        workflowId,
      })
    );
  }, [templateId, viralMode, platformMode, images.length, workflowId]);

  const exportSnapshot = useCallback(() => {
    downloadCreatorJson(
      "table-tales-session.json",
      buildSessionSnapshot({
        projectId,
        templateId,
        captions,
        images,
        viralMode,
        platformMode,
        brandKit,
        memory: loadCreatorMemory(),
      })
    );
  }, [
    projectId,
    templateId,
    captions,
    images,
    viralMode,
    platformMode,
    brandKit,
  ]);

  const exportWorkflow = useCallback(() => {
    if (!workflowId) return;
    const mem = loadCreatorMemory();
    downloadCreatorJson(
      "table-tales-workflow-preset.json",
      buildWorkflowPresetExport(
        workflowId,
        templateId,
        viralMode,
        platformMode,
        mem.captionTone,
        captions.hook
      )
    );
  }, [workflowId, templateId, viralMode, platformMode, captions.hook]);

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={exportMeta}
        className="rounded-full border border-zinc-700 px-3 py-1.5 text-[10px] font-semibold text-zinc-400 hover:text-white"
      >
        Export metadata
      </button>
      <button
        type="button"
        onClick={exportSnapshot}
        className="rounded-full border border-zinc-700 px-3 py-1.5 text-[10px] font-semibold text-zinc-400 hover:text-white"
      >
        Session snapshot
      </button>
      {workflowId && (
        <button
          type="button"
          onClick={exportWorkflow}
          className="rounded-full border border-zinc-700 px-3 py-1.5 text-[10px] font-semibold text-zinc-400 hover:text-white"
        >
          Workflow preset
        </button>
      )}
    </div>
  );
}

export default memo(SessionExportBar);

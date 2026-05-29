"use client";

import { memo, type MutableRefObject } from "react";
import BuilderExportStrip from "@/components/builder/BuilderExportStrip";
import BuilderSlideEditor from "@/components/builder/BuilderSlideEditor";
import SlideCreativeChat from "@/components/builder/SlideCreativeChat";
import { useRenderDiagnostic } from "@/lib/renderProfiler";
import type { SlideKey } from "@/lib/slides";
import type { SlideEditorPrefs } from "@/lib/slideEditorPrefs";
import type { ExportGenerationStage } from "@/lib/generationStages";
import type { CreativeQuickActionId } from "@/lib/creativeActions";

type BuilderInspectorProps = {
  slideIndex: number;
  slideKey: SlideKey;
  caption: string;
  prefs: SlideEditorPrefs;
  onCaptionChange: (key: SlideKey, value: string) => void;
  onPrefsChange: (slideIndex: number, patch: Partial<SlideEditorPrefs>) => void;
  isDoodleTemplate: boolean;
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
  onToast: (message: string, variant?: "success" | "error") => void;
  onExportComplete?: (format: string) => void;
  exportDisabled?: boolean;
  onExportProgress?: (
    active: boolean,
    stage: ExportGenerationStage,
    slideRatio: number
  ) => void;
  creativeHistory?: string[];
  enhancingSlide?: boolean;
  canUndoCreative?: boolean;
  canRevertCreative?: boolean;
  onEnhanceSlide?: (prompt: string) => Promise<void>;
  onQuickCreativeAction?: (id: CreativeQuickActionId) => void;
  onUndoCreative?: () => void;
  onRevertCreative?: () => void;
};

function BuilderInspector({
  slideIndex,
  slideKey,
  caption,
  prefs,
  onCaptionChange,
  onPrefsChange,
  isDoodleTemplate,
  slideRefs,
  onToast,
  onExportComplete,
  exportDisabled,
  onExportProgress,
  creativeHistory = [],
  enhancingSlide = false,
  canUndoCreative = false,
  canRevertCreative = false,
  onEnhanceSlide,
  onQuickCreativeAction,
  onUndoCreative,
  onRevertCreative,
}: BuilderInspectorProps) {
  useRenderDiagnostic("BuilderInspector");

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <BuilderSlideEditor
        slideIndex={slideIndex}
        slideKey={slideKey}
        caption={caption}
        prefs={prefs}
        onCaptionChange={onCaptionChange}
        onPrefsChange={onPrefsChange}
        isDoodleTemplate={isDoodleTemplate}
      />
      {onEnhanceSlide && onQuickCreativeAction && onUndoCreative && onRevertCreative && (
        <SlideCreativeChat
          slideIndex={slideIndex + 1}
          enhancing={enhancingSlide}
          history={creativeHistory}
          canUndo={canUndoCreative}
          canRevert={canRevertCreative}
          onEnhance={onEnhanceSlide}
          onQuickAction={onQuickCreativeAction}
          onUndo={onUndoCreative}
          onRevert={onRevertCreative}
        />
      )}
      <div className="px-4 pb-5 md:px-5">
        <BuilderExportStrip
          slideRefs={slideRefs}
          selectedIndex={slideIndex}
          onToast={onToast}
          onComplete={onExportComplete}
          disabled={exportDisabled}
          onExportProgress={onExportProgress}
        />
      </div>
    </div>
  );
}

function inspectorPropsEqual(
  prev: BuilderInspectorProps,
  next: BuilderInspectorProps
): boolean {
  return (
    prev.slideIndex === next.slideIndex &&
    prev.slideKey === next.slideKey &&
    prev.caption === next.caption &&
    prev.prefs === next.prefs &&
    prev.isDoodleTemplate === next.isDoodleTemplate &&
    prev.exportDisabled === next.exportDisabled &&
    prev.enhancingSlide === next.enhancingSlide &&
    prev.canUndoCreative === next.canUndoCreative &&
    prev.canRevertCreative === next.canRevertCreative &&
    prev.creativeHistory === next.creativeHistory &&
    prev.onCaptionChange === next.onCaptionChange &&
    prev.onPrefsChange === next.onPrefsChange &&
    prev.onEnhanceSlide === next.onEnhanceSlide &&
    prev.onQuickCreativeAction === next.onQuickCreativeAction &&
    prev.onUndoCreative === next.onUndoCreative &&
    prev.onRevertCreative === next.onRevertCreative &&
    prev.onToast === next.onToast &&
    prev.onExportComplete === next.onExportComplete &&
    prev.onExportProgress === next.onExportProgress
  );
}

export default memo(BuilderInspector, inspectorPropsEqual);

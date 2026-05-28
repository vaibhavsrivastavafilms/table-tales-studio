"use client";

import { memo, type MutableRefObject } from "react";
import BuilderExportStrip from "@/components/builder/BuilderExportStrip";
import BuilderSlideEditor from "@/components/builder/BuilderSlideEditor";
import type { SlideKey } from "@/lib/slides";
import type { SlideEditorPrefs } from "@/lib/slideEditorPrefs";

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
}: BuilderInspectorProps) {
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
      <div className="px-4 pb-5 md:px-5">
        <BuilderExportStrip
          slideRefs={slideRefs}
          selectedIndex={slideIndex}
          onToast={onToast}
          onComplete={onExportComplete}
          disabled={exportDisabled}
        />
      </div>
    </div>
  );
}

export default memo(BuilderInspector);

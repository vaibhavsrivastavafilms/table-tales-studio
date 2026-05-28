"use client";

import { memo } from "react";
import AISuggestions from "@/components/AISuggestions";
import ViralHooksBar from "@/components/ViralHooksBar";
import RewriteBar from "@/components/RewriteBar";
import { SLIDE_KEYS, type Captions } from "@/lib/slides";
import type { ViralHookMode } from "@/lib/viralHooks";

type StoryPanelProps = {
  captions: Captions;
  onCaptionChange: (key: keyof Captions, value: string) => void;
  onCaptionsReplace?: (captions: Captions) => void;
  isGenerating: boolean;
  viralMode?: ViralHookMode;
};

function StorySkeleton() {
  return (
    <div className="mb-6 animate-pulse space-y-3">
      <div className="h-5 w-24 rounded-lg bg-zinc-800" />
      <div className="h-[120px] rounded-3xl bg-zinc-800/80" />
    </div>
  );
}

function StoryPanel({
  captions,
  onCaptionChange,
  onCaptionsReplace,
  isGenerating,
  viralMode = "viral",
}: StoryPanelProps) {
  const hasContent = SLIDE_KEYS.some((key) => captions[key].trim().length > 0);

  return (
    <section className="panel-scroll max-h-none min-w-0 overflow-y-auto overscroll-contain rounded-[28px] bg-[#0b0f1a] p-5 ring-1 ring-white/5 md:max-h-[520px] md:rounded-[40px] md:p-8">
      <h2 className="mb-6 text-2xl font-bold md:mb-8 md:text-4xl">
        AI Story
        <br />
        Structure
      </h2>

      {!hasContent && !isGenerating && (
        <p className="mb-6 text-sm text-zinc-500">
          Generate a story or write captions for each slide. Draft saves
          automatically.
        </p>
      )}

      {!isGenerating && (
        <>
          <ViralHooksBar
            viralMode={viralMode}
            currentHook={captions.hook}
            onApplyHook={(hook) => onCaptionChange("hook", hook)}
          />
          {onCaptionsReplace && (
            <RewriteBar captions={captions} onApply={onCaptionsReplace} />
          )}
          <AISuggestions
            captions={captions}
            viralMode={viralMode}
            onApply={onCaptionChange}
          />
        </>
      )}

      {isGenerating
        ? SLIDE_KEYS.map((key) => <StorySkeleton key={key} />)
        : SLIDE_KEYS.map((key) => (
            <div key={key} className="mb-5 md:mb-6">
              <h3 className="mb-2 text-base font-bold capitalize text-[#f7c600] md:mb-3 md:text-xl">
                {key}
              </h3>
              <textarea
                value={captions[key]}
                onChange={(e) => onCaptionChange(key, e.target.value)}
                className="min-h-[100px] w-full rounded-2xl bg-black p-4 text-base text-white ring-1 ring-zinc-800 transition-all duration-200 focus:outline-none focus:ring-[#f7c600]/40 md:min-h-[120px] md:rounded-3xl md:p-5 md:text-lg"
              />
            </div>
          ))}
    </section>
  );
}

export default memo(StoryPanel);

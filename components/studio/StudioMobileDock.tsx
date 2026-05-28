"use client";

import { memo } from "react";

type StudioMobileDockProps = {
  onGenerate: () => void;
  onExport: () => void;
  isGenerating: boolean;
  disabled?: boolean;
};

function StudioMobileDock({
  onGenerate,
  onExport,
  isGenerating,
  disabled,
}: StudioMobileDockProps) {
  return (
    <div className="studio-mobile-dock fixed bottom-0 left-0 right-0 z-50 flex gap-2 border-t border-white/[0.08] bg-[#060608]/95 p-3 backdrop-blur-xl lg:hidden">
      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        className="studio-cta-primary flex-1 min-h-[44px] rounded-xl text-xs font-bold text-black disabled:opacity-50"
      >
        {isGenerating ? "Generating…" : "Generate story"}
      </button>
      <button
        type="button"
        onClick={onExport}
        className="min-h-[44px] rounded-xl border border-white/10 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400"
      >
        Export
      </button>
    </div>
  );
}

export default memo(StudioMobileDock);

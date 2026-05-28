"use client";

import { memo, useCallback } from "react";
import {
  REWRITE_MODES,
  rewriteCaptions,
  remixStory,
  enhanceCTA,
  type RewriteMode,
} from "@/lib/rewriteEngine";
import type { Captions } from "@/lib/slides";

type RewriteBarProps = {
  captions: Captions;
  onApply: (captions: Captions) => void;
};

function RewriteBar({ captions, onApply }: RewriteBarProps) {
  const applyMode = useCallback(
    (mode: RewriteMode, action: "rewrite" | "remix" | "cta") => {
      if (action === "remix") {
        onApply(remixStory(captions, mode));
        return;
      }
      if (action === "cta") {
        onApply({ ...captions, cta: enhanceCTA(captions.cta, mode) });
        return;
      }
      onApply(rewriteCaptions(captions, mode));
    },
    [captions, onApply]
  );

  return (
    <div className="mb-4 rounded-2xl bg-zinc-900/60 p-3 ring-1 ring-white/5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        Rewrite & remix
      </p>
      <div className="flex flex-wrap gap-2">
        {REWRITE_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => applyMode(m.id, "rewrite")}
            className="btn-press rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 hover:border-[#f7c600]/30 hover:text-[#f7c600]"
          >
            {m.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => applyMode("viral", "remix")}
          className="btn-press rounded-full border border-[#f7c600]/25 px-2.5 py-1 text-[10px] font-semibold text-[#f7c600]"
        >
          Remix story
        </button>
      </div>
    </div>
  );
}

export default memo(RewriteBar);

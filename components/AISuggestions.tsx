"use client";

import { memo, useMemo } from "react";
import type { Captions } from "@/lib/slides";
import {
  generateCaptionSuggestions,
  type CaptionSuggestion,
} from "@/lib/suggestions";
import type { ViralHookMode } from "@/lib/viralHooks";

type AISuggestionsProps = {
  captions: Captions;
  viralMode: ViralHookMode;
  onApply: (field: keyof Captions, text: string) => void;
};

function SuggestionChip({
  suggestion,
  onApply,
}: {
  suggestion: CaptionSuggestion;
  onApply: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onApply}
      className="ai-suggestion-chip shrink-0 rounded-full border border-[#f7c600]/25 bg-[#f7c600]/10 px-3 py-1.5 text-[11px] font-semibold text-[#f7c600] transition hover:bg-[#f7c600]/20"
      title={suggestion.text}
    >
      {suggestion.label} · {suggestion.field}
    </button>
  );
}

function AISuggestions({ captions, viralMode, onApply }: AISuggestionsProps) {
  const suggestions = useMemo(
    () => generateCaptionSuggestions(captions, viralMode),
    [captions, viralMode]
  );

  const hasContent = Object.values(captions).some((v) => v.trim().length > 0);
  if (!hasContent || suggestions.length === 0) return null;

  return (
    <div className="ai-suggestions-float mb-4 rounded-2xl bg-zinc-900/80 p-3 ring-1 ring-[#f7c600]/15 backdrop-blur-sm">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        AI suggestions
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((s) => (
          <SuggestionChip
            key={s.id}
            suggestion={s}
            onApply={() => onApply(s.field, s.text)}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(AISuggestions);

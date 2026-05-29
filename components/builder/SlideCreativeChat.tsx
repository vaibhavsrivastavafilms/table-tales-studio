"use client";

import { memo, useCallback, useState } from "react";
import {
  CREATIVE_QUICK_ACTIONS,
  CREATIVE_SUGGESTION_CHIPS,
  type CreativeQuickActionId,
} from "@/lib/creativeActions";
import { useRenderDiagnostic } from "@/lib/renderProfiler";

type SlideCreativeChatProps = {
  slideIndex: number;
  enhancing?: boolean;
  history: string[];
  canUndo: boolean;
  canRevert: boolean;
  onEnhance: (prompt: string) => Promise<void>;
  onQuickAction: (actionId: CreativeQuickActionId) => void;
  onUndo: () => void;
  onRevert: () => void;
};

function SlideCreativeChat({
  slideIndex,
  enhancing = false,
  history,
  canUndo,
  canRevert,
  onEnhance,
  onQuickAction,
  onUndo,
  onRevert,
}: SlideCreativeChatProps) {
  useRenderDiagnostic("SlideCreativeChat");
  const [prompt, setPrompt] = useState("");

  const submit = useCallback(async () => {
    const text = prompt.trim();
    if (!text || enhancing) return;
    await onEnhance(text);
    setPrompt("");
  }, [prompt, enhancing, onEnhance]);

  const recent = history.slice(-4).reverse();

  return (
    <section className="border-t border-white/[0.08] px-4 py-4 md:px-5">
      <div className="mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#f4c430]">
          AI Creative Director
        </h3>
        <p className="mt-0.5 text-[10px] text-zinc-600">
          Direct slide {slideIndex} — carousel stays intact
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Creative direction prompt</span>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          disabled={enhancing}
          placeholder='e.g. "Make this more cinematic"'
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#f4c430]/45 focus:outline-none disabled:opacity-60"
        />
      </label>

      <p className="mt-2 text-[9px] leading-relaxed text-zinc-600">
        Try: &ldquo;Make this moodier&rdquo; · &ldquo;More luxury&rdquo; ·
        &ldquo;Add steam doodles&rdquo;
      </p>

      <button
        type="button"
        onClick={() => void submit()}
        disabled={enhancing || !prompt.trim()}
        className="btn-press mt-3 w-full rounded-xl bg-[#f4c430] py-2.5 text-xs font-bold text-black transition hover:bg-[#ffe566] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {enhancing ? "Art directing…" : "Enhance slide"}
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {CREATIVE_SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={enhancing}
            onClick={() => {
              setPrompt(chip);
            }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-medium text-zinc-400 transition hover:border-[#f4c430]/30 hover:text-zinc-200 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
          Quick actions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CREATIVE_QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={enhancing}
              onClick={() => onQuickAction(action.id)}
              className="rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1 text-[9px] font-semibold text-zinc-400 transition hover:border-[#f4c430]/25 hover:text-[#f4c430] disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
            Recent
          </p>
          <ul className="space-y-1">
            {recent.map((entry, i) => (
              <li
                key={`${entry}-${i}`}
                className="truncate text-[10px] italic text-zinc-500"
              >
                {entry}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || enhancing}
          className="flex-1 rounded-lg border border-white/10 py-2 text-[10px] font-semibold text-zinc-400 transition hover:text-white disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onRevert}
          disabled={!canRevert || enhancing}
          className="flex-1 rounded-lg border border-white/10 py-2 text-[10px] font-semibold text-zinc-400 transition hover:text-white disabled:opacity-40"
        >
          Revert original
        </button>
      </div>
    </section>
  );
}

function chatPropsEqual(
  prev: SlideCreativeChatProps,
  next: SlideCreativeChatProps
): boolean {
  return (
    prev.slideIndex === next.slideIndex &&
    prev.enhancing === next.enhancing &&
    prev.canUndo === next.canUndo &&
    prev.canRevert === next.canRevert &&
    prev.history === next.history &&
    prev.onEnhance === next.onEnhance &&
    prev.onQuickAction === next.onQuickAction &&
    prev.onUndo === next.onUndo &&
    prev.onRevert === next.onRevert
  );
}

export default memo(SlideCreativeChat, chatPropsEqual);

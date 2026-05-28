"use client";

import { memo } from "react";
import {
  AI_DESIGN_MODES,
  type AiDesignModeId,
} from "@/lib/aiDesignModes";

type AiDesignModePanelProps = {
  mode: AiDesignModeId;
  onModeChange: (mode: AiDesignModeId) => void;
  status: "idle" | "loading" | "ready" | "partial" | "fallback";
  aiAvailable: boolean | null;
  disabled?: boolean;
  onRegenerate?: () => void;
};

function AiDesignModePanel({
  mode,
  onModeChange,
  status,
  aiAvailable,
  disabled = false,
  onRegenerate,
}: AiDesignModePanelProps) {
  const statusLabel =
    status === "loading"
      ? "Generating editorial overlays…"
      : status === "ready"
        ? "AI art direction applied"
        : status === "partial"
          ? "Partial AI layers — procedural fill"
          : status === "fallback"
            ? "Procedural doodles (add OPENAI_API_KEY for AI layers)"
            : "Waiting for photos";

  return (
    <section className="mb-4 rounded-2xl border border-[#f4c430]/25 bg-[#0b0f1a] p-4 ring-1 ring-[#f4c430]/15">
      <header className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4c430]">
          AI art director
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Real food photo stays the base. AI generates transparent doodle and
          editorial overlay layers around it.
        </p>
      </header>

      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Story mode
        <select
          value={mode}
          disabled={disabled}
          onChange={(e) => onModeChange(e.target.value as AiDesignModeId)}
          className="mt-1 w-full min-h-[40px] rounded-xl bg-black p-2.5 text-sm text-white ring-1 ring-zinc-800"
        >
          {AI_DESIGN_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-2 text-[11px] text-zinc-500">
        {AI_DESIGN_MODES.find((m) => m.id === mode)?.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            status === "loading"
              ? "bg-[#f4c430]/20 text-[#f4c430] animate-pulse"
              : status === "ready"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {statusLabel}
        </span>
        {aiAvailable === true && (
          <span className="text-[10px] text-zinc-600">OpenAI image gen on</span>
        )}
        {onRegenerate && (
          <button
            type="button"
            disabled={disabled || status === "loading"}
            onClick={() => onRegenerate()}
            className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition hover:border-[#f4c430]/40 hover:text-[#f4c430] disabled:opacity-40"
          >
            Regenerate overlays
          </button>
        )}
      </div>
    </section>
  );
}

export default memo(AiDesignModePanel);

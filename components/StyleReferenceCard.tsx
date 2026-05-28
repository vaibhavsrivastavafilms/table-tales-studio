"use client";

import { memo } from "react";
import { summarizeStyleReference, type StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";

type StyleReferenceCardProps = {
  previewUrl: string | null;
  style: StyleReference | null;
  vision?: StyleVisionResult | null;
  loading?: boolean;
  onClear?: () => void;
};

function StyleReferenceCard({
  previewUrl,
  style,
  vision,
  loading,
  onClear,
}: StyleReferenceCardProps) {
  if (!previewUrl && !loading) return null;

  return (
    <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 ring-1 ring-white/5">
      <div className="flex items-start gap-3">
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-zinc-800" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f7c600]">
            Reference style
          </p>
          {loading ? (
            <p className="mt-1 text-xs text-zinc-500">Reading design language…</p>
          ) : style ? (
            <>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {vision?.inspiredBySummary ?? summarizeStyleReference(style)}
              </p>
              {vision && (
                <p className="mt-1 text-[10px] text-zinc-600">
                  Confidence {Math.round(vision.confidence * 100)}% ·{" "}
                  {vision.styleDna.typography} · {vision.styleDna.density}
                </p>
              )}
            </>
          ) : null}
        </div>
        {onClear && previewUrl && !loading && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(StyleReferenceCard);

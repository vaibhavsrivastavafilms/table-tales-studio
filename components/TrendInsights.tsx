"use client";

import { memo, useState } from "react";
import { getTrendingItems, type TrendItem } from "@/lib/trends";

type TrendInsightsProps = {
  onApplyHint?: (hint: string) => void;
};

function TrendInsights({ onApplyHint }: TrendInsightsProps) {
  const [open, setOpen] = useState(false);
  const trends = getTrendingItems();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 w-full rounded-2xl border border-dashed border-zinc-700 py-2.5 text-xs font-semibold text-zinc-500 transition hover:border-[#f7c600]/40 hover:text-[#f7c600]"
      >
        Trend intelligence · {trends.length} patterns
      </button>
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="mb-3 flex justify-between">
        <h3 className="text-sm font-bold text-[#f7c600]">Trending now</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Collapse
        </button>
      </div>
      <ul className="space-y-2">
        {trends.slice(0, 4).map((t: TrendItem) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onApplyHint?.(t.promptHint)}
              className="w-full rounded-lg bg-black/40 p-3 text-left text-xs text-zinc-400 transition hover:bg-black hover:text-white"
            >
              <span className="font-semibold text-white">{t.title}</span>
              <span className="mt-1 block">{t.promptHint}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default memo(TrendInsights);

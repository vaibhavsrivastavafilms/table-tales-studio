"use client";

import { memo, useEffect, useState } from "react";
import {
  enrichShowcase,
  type ShowcaseEntry,
} from "@/lib/exportShowcase";
import { loadExportHistory } from "@/lib/exportStudio";

type ExportShowcaseProps = {
  refreshKey?: number;
};

function ExportShowcase({ refreshKey = 0 }: ExportShowcaseProps) {
  const [entries, setEntries] = useState<ShowcaseEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setEntries(enrichShowcase(loadExportHistory()));
  }, [refreshKey]);

  if (entries.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 w-full rounded-xl border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-400 hover:border-[#f7c600]/30 hover:text-[#f7c600]"
      >
        Your export gallery · {entries.length} recent
      </button>
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="mb-3 flex justify-between">
        <div>
          <p className="text-sm font-bold text-[#f7c600]">Export showcase</p>
          <p className="text-[10px] text-zinc-500">
            Recent creator exports — your carousel wins
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Collapse
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {entries.slice(0, 4).map((e) => (
          <li
            key={e.id}
            className="rounded-xl border border-zinc-800 bg-black/40 p-2"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900">
              {e.thumbDataUrl ? (
                <img
                  src={e.thumbDataUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                  {e.slideCount} slides
                </div>
              )}
            </div>
            <p className="mt-1 truncate text-[10px] text-zinc-500">
              {new Date(e.at).toLocaleDateString()} · {e.format}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default memo(ExportShowcase);

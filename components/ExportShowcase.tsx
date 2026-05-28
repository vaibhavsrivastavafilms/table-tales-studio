"use client";

import { memo, useMemo, useState } from "react";
import { useIsClient } from "@/lib/clientHooks";
import {
  enrichShowcase,
  type ShowcaseEntry,
} from "@/lib/exportShowcase";
import { loadExportHistory } from "@/lib/exportStudio";

type ExportShowcaseProps = {
  refreshKey?: number;
};

function ExportShowcase({ refreshKey = 0 }: ExportShowcaseProps) {
  const isClient = useIsClient();
  const [open, setOpen] = useState(false);

  const entries = useMemo((): ShowcaseEntry[] => {
    if (!isClient) return [];
    void refreshKey;
    return enrichShowcase(loadExportHistory());
  }, [isClient, refreshKey]);

  if (!isClient || entries.length === 0) return null;

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
    <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f7c600]">Export gallery</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Collapse
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="overflow-hidden rounded-lg bg-black ring-1 ring-zinc-800"
          >
            {entry.thumbDataUrl ? (
              <img
                src={entry.thumbDataUrl}
                alt=""
                width={120}
                height={150}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-[10px] text-zinc-600">
                {entry.format}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(ExportShowcase);

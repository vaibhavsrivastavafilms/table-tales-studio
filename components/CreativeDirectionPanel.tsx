"use client";

import { memo, useMemo, useState } from "react";
import {
  formatCreativeDirection,
  generateCreativeDirection,
} from "@/lib/directorMode";
import type { NichePreference } from "@/lib/creatorMemory";
import type { TemplateId } from "@/lib/templates";
import type { ViralHookMode } from "@/lib/viralHooks";

type CreativeDirectionPanelProps = {
  templateId: TemplateId;
  viralMode: ViralHookMode;
  niche?: NichePreference;
};

function CreativeDirectionPanel({
  templateId,
  viralMode,
  niche = "general",
}: CreativeDirectionPanelProps) {
  const [open, setOpen] = useState(false);
  const lines = useMemo(
    () =>
      formatCreativeDirection(
        generateCreativeDirection(templateId, viralMode, niche)
      ),
    [templateId, viralMode, niche]
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-3 text-xs font-semibold text-zinc-400 transition hover:border-[#f7c600]/30 hover:text-[#f7c600]"
      >
        Creative direction · AI director notes
      </button>
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 ring-1 ring-white/5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f7c600]">Creative direction</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Collapse
        </button>
      </div>
      <ul className="space-y-2 text-xs leading-relaxed text-zinc-400">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export default memo(CreativeDirectionPanel);

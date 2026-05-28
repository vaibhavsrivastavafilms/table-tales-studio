"use client";

import { memo, useEffect, useState } from "react";
import {
  DEFAULT_EXPORT_PRESETS,
  loadActiveExportPreset,
  loadExportHistory,
  saveActiveExportPreset,
  type ExportPreset,
  type ExportHistoryEntry,
} from "@/lib/exportStudio";
import type { ExportFormat } from "@/lib/exportSlides";

type ExportStudioSectionProps = {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  onPresetChange?: (preset: ExportPreset) => void;
  refreshKey?: number;
};

function ExportStudioSection({
  format,
  onFormatChange,
  onPresetChange,
  refreshKey = 0,
}: ExportStudioSectionProps) {
  const [preset, setPreset] = useState<ExportPreset>(() => loadActiveExportPreset());
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setHistory(loadExportHistory());
  }, [refreshKey]);

  const selectPreset = (id: string) => {
    const next = saveActiveExportPreset(id);
    setPreset(next);
    onFormatChange(next.format);
    onPresetChange?.(next);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mb-4 w-full rounded-xl border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-[#f7c600]/30 hover:text-[#f7c600]"
      >
        Export studio · {preset.name}
      </button>
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f7c600]">Export studio</h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Collapse
        </button>
      </div>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Social presets
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {DEFAULT_EXPORT_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPreset(p.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              preset.id === p.id
                ? "bg-[#f7c600] text-black"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Quality · {preset.quality}
        {preset.cropSafe ? " · IG crop-safe" : ""}
      </p>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Format
      </p>
      <div className="mb-4 flex gap-2">
        {(["jpeg", "png"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFormatChange(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
              format === f
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Recent exports
          </p>
          <ul className="max-h-28 space-y-1 overflow-y-auto text-xs text-zinc-500">
            {history.slice(0, 5).map((h) => (
              <li key={h.id}>
                {new Date(h.at).toLocaleString()} · {h.slideCount} slides ·{" "}
                {h.format}
                {h.presetName ? ` · ${h.presetName}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default memo(ExportStudioSection);

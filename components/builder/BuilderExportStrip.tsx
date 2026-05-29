"use client";

import { memo, useCallback, useState } from "react";
import {
  exportAllSlides,
  exportSingleSlide,
  type ExportFormat,
} from "@/lib/exportSlides";
import { waitForAllSlideAssets } from "@/lib/exportAssetReady";
import { acquireExportLock, releaseExportLock } from "@/lib/exportSession";
import { canExport, recordExportUsage } from "@/lib/usage";
import type { ExportGenerationStage } from "@/lib/generationStages";
import type { MutableRefObject } from "react";

type BuilderExportStripProps = {
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
  selectedIndex: number;
  onToast: (message: string, variant?: "success" | "error") => void;
  onComplete?: (format: string) => void;
  disabled?: boolean;
  onExportProgress?: (
    active: boolean,
    stage: ExportGenerationStage,
    slideRatio: number
  ) => void;
};

function BuilderExportStrip({
  slideRefs,
  selectedIndex,
  onToast,
  onComplete,
  disabled,
  onExportProgress,
}: BuilderExportStripProps) {
  const [format, setFormat] = useState<ExportFormat | "zip">("zip");
  const [busy, setBusy] = useState(false);

  const report = useCallback(
    (active: boolean, stage: ExportGenerationStage, slideRatio: number) => {
      onExportProgress?.(active, stage, slideRatio);
    },
    [onExportProgress]
  );

  const runExport = useCallback(async () => {
    const usage = canExport();
    if (!usage.allowed) {
      onToast(usage.reason, "error");
      return;
    }
    const lock = acquireExportLock();
    if (!lock.acquired) {
      onToast("Export already in progress", "error");
      return;
    }

    setBusy(true);
    report(true, "preparing", 0);
    try {
      await waitForAllSlideAssets(slideRefs.current);
      if (format === "zip") {
        const total = slideRefs.current.filter(Boolean).length || 6;
        await exportAllSlides(slideRefs.current, {
          format: "jpeg",
          expectedTotal: total,
          onProgress: (p) => {
            report(true, "rendering", p.current / Math.max(1, p.total));
          },
          onPackaging: () => report(true, "packaging", 0.92),
        });
        onComplete?.("zip");
      } else {
        report(true, "rendering", 0.5);
        const slide = slideRefs.current[selectedIndex];
        if (!slide) throw new Error("Slide not ready");
        await exportSingleSlide(slide, selectedIndex + 1, { format });
        onComplete?.(format);
      }
      recordExportUsage();
      report(true, "done", 1);
      onToast("Export ready — check your downloads");
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      releaseExportLock(lock.sessionId);
      setBusy(false);
      window.setTimeout(() => report(false, "preparing", 0), 1200);
    }
  }, [format, onComplete, onToast, report, selectedIndex, slideRefs]);

  const exportAll = useCallback(async () => {
    const usage = canExport();
    if (!usage.allowed) {
      onToast(usage.reason, "error");
      return;
    }
    const lock = acquireExportLock();
    if (!lock.acquired) return;

    setBusy(true);
    report(true, "preparing", 0);
    try {
      await waitForAllSlideAssets(slideRefs.current);
      const fmt: ExportFormat = format === "zip" ? "jpeg" : format;
      const total = slideRefs.current.filter(Boolean).length || 6;
      let count = 0;
      for (let i = 0; i < slideRefs.current.length; i++) {
        const el = slideRefs.current[i];
        if (el) {
          report(true, "rendering", count / total);
          await exportSingleSlide(el, i + 1, { format: fmt });
          count += 1;
          report(true, "rendering", count / total);
        }
      }
      if (!count) throw new Error("No slides ready");
      recordExportUsage();
      report(true, "done", 1);
      onToast(`Exported ${count} slides`);
      onComplete?.(fmt);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      releaseExportLock(lock.sessionId);
      setBusy(false);
      window.setTimeout(() => report(false, "preparing", 0), 1200);
    }
  }, [format, onComplete, onToast, report, slideRefs]);

  return (
    <section
      id="builder-export-strip"
      className="mt-2 border-t border-white/[0.06] pt-4"
    >
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Export
      </h2>
      <p className="mt-1 text-[11px] text-zinc-600">
        Retina 1080×1350 · matches preview
      </p>

      <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Format
        <select
          value={format}
          disabled={disabled || busy}
          onChange={(e) =>
            setFormat(e.target.value as ExportFormat | "zip")
          }
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
        >
          <option value="zip">ZIP (all slides JPG)</option>
          <option value="jpeg">JPG — current slide</option>
          <option value="png">PNG — current slide</option>
        </select>
      </label>

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void runExport()}
        className="builder-cta mt-3 w-full rounded-xl py-2.5 text-xs font-bold text-black disabled:opacity-50"
      >
        {busy
          ? "Rendering…"
          : format === "zip"
            ? "Download ZIP"
            : "Download slide"}
      </button>

      {format !== "zip" && (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void exportAll()}
          className="mt-2 w-full rounded-lg border border-white/10 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hover:border-[#f4c430]/30 hover:text-[#f4c430]"
        >
          Export all as {format === "png" ? "PNG" : "JPG"}
        </button>
      )}
    </section>
  );
}

export default memo(BuilderExportStrip);

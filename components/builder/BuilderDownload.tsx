"use client";

import {
  memo,
  type MutableRefObject,
  useCallback,
  useState,
} from "react";
import {
  exportAllSlides,
  exportSingleSlide,
  type ExportFormat,
} from "@/lib/exportSlides";
import { acquireExportLock, releaseExportLock } from "@/lib/exportSession";
import { canExport, recordExportUsage } from "@/lib/usage";

type BuilderDownloadProps = {
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
  onToast: (message: string, variant?: "success" | "error") => void;
  onComplete?: (format: string) => void;
  open?: boolean;
  onClose?: () => void;
};

function BuilderDownload({
  slideRefs,
  onToast,
  onComplete,
  open = false,
  onClose,
}: BuilderDownloadProps) {
  const [format, setFormat] = useState<ExportFormat | "zip">("zip");
  const [busy, setBusy] = useState(false);

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
    try {
      if (format === "zip") {
        await exportAllSlides(slideRefs.current, { format: "jpeg" });
        onComplete?.("zip");
      } else {
        let exported = 0;
        for (let i = 0; i < slideRefs.current.length; i++) {
          const slide = slideRefs.current[i];
          if (slide) {
            await exportSingleSlide(slide, i + 1, { format });
            exported += 1;
          }
        }
        if (!exported) throw new Error("No slides ready");
        onComplete?.(format);
      }
      recordExportUsage();
      onToast("Carousel downloaded");
      onClose?.();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Export failed",
        "error"
      );
    } finally {
      releaseExportLock(lock.sessionId);
      setBusy(false);
    }
  }, [format, onClose, onComplete, onToast, slideRefs]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-label="Download carousel"
    >
      <div className="builder-panel w-full max-w-sm rounded-2xl p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-white">Download carousel</h3>
        <p className="mt-1 text-xs text-zinc-500">Retina-ready 4:5 slides</p>

        <div className="mt-4 flex gap-2">
          {(["jpeg", "png", "zip"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider ${
                format === f
                  ? "bg-[#f4c430] text-black"
                  : "border border-white/10 text-zinc-400"
              }`}
            >
              {f === "zip" ? "ZIP" : f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs font-semibold text-zinc-400"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runExport()}
            className="builder-cta flex-1 rounded-lg py-2.5 text-xs font-bold text-black disabled:opacity-50"
          >
            {busy ? "Preparing…" : "Download carousel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(BuilderDownload);

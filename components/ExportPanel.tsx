"use client";

import { memo, useCallback, useState, type MutableRefObject } from "react";
import CarouselSlide from "@/components/CarouselSlide";
import {
  exportAllSlides,
  exportSingleSlide,
  type ExportFormat,
  type ExportProgress,
} from "@/lib/exportSlides";
import { SLIDE_KEYS, type Captions } from "@/lib/slides";
import type { TemplateId } from "@/lib/templates";

type ExportPanelProps = {
  images: string[];
  captions: Captions;
  templateId: TemplateId;
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
  onToast: (message: string, variant?: "success" | "error") => void;
};

function ExportProgressBar({ progress }: { progress: ExportProgress | null }) {
  if (!progress) return null;
  const pct = Math.round((progress.current / progress.total) * 100);

  return (
    <div className="mb-4 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
      <div
        className="h-1.5 bg-[#f7c600] transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
      <p className="px-3 py-2 text-xs text-zinc-400">
        Exporting slide {progress.current} of {progress.total}…
      </p>
    </div>
  );
}

function ExportPanel({
  images,
  captions,
  templateId,
  slideRefs,
  onToast,
}: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("jpeg");
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const isBusy = exportingAll || exportingIndex !== null;

  const handleProgress = useCallback((p: ExportProgress) => {
    setProgress(p);
  }, []);

  const handleExportAll = async () => {
    setExportingAll(true);
    setProgress({ current: 0, total: SLIDE_KEYS.length });
    try {
      await exportAllSlides(slideRefs.current, {
        format,
        onProgress: handleProgress,
      });
      onToast(
        format === "png"
          ? "PNG carousel exported — table-tales-carousel-png.zip"
          : "Carousel exported — table-tales-carousel.zip"
      );
    } catch {
      onToast("Export failed. Try again after images load.", "error");
    } finally {
      setExportingAll(false);
      setProgress(null);
    }
  };

  const handleExportSingle = async (index: number) => {
    setExportingIndex(index);
    setProgress({ current: 0, total: 1 });
    try {
      await exportSingleSlide(slideRefs.current[index], index + 1, {
        format,
        onProgress: handleProgress,
      });
      onToast(`Slide ${index + 1} saved as ${format === "png" ? "PNG" : "JPG"}`);
    } catch {
      onToast(`Could not export slide ${index + 1}`, "error");
    } finally {
      setExportingIndex(null);
      setProgress(null);
    }
  };

  const exportAllButton = (
    <button
      type="button"
      onClick={handleExportAll}
      disabled={isBusy}
      className="w-full min-h-[48px] rounded-xl bg-[#f7c600] py-4 text-sm font-bold text-black shadow-[0_0_32px_rgba(247,198,0,0.35)] transition-all duration-200 hover:bg-[#ffe033] hover:shadow-[0_0_40px_rgba(247,198,0,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {exportingAll ? "Packaging ZIP…" : "Export All Slides"}
    </button>
  );

  return (
    <section className="relative rounded-[28px] bg-[#0b0f1a] p-4 ring-1 ring-white/5 md:rounded-[40px] md:p-6">
      <header className="mb-4 md:mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
          Export
        </p>
        <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">
          Export Individual Slides
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Instagram-ready · 1080×1350 · 2× retina
        </p>
      </header>

      <div className="mb-4 flex gap-2">
        {(["jpeg", "png"] as const).map((f) => (
          <button
            key={f}
            type="button"
            disabled={isBusy}
            onClick={() => setFormat(f)}
            className={`min-h-[40px] flex-1 rounded-lg border text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
              format === f
                ? "border-[#f7c600] bg-[#f7c600]/15 text-[#f7c600]"
                : "border-zinc-700 bg-black/40 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ExportProgressBar progress={isBusy ? progress : null} />

      <div className="mb-6 hidden md:block">{exportAllButton}</div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3">
        {SLIDE_KEYS.map((key, i) => {
          const image =
            images[i] ?? images[images.length - 1] ?? images[0] ?? "";
          const isLoading = exportingIndex === i;

          return (
            <div
              key={key}
              className="group rounded-xl border border-zinc-800/80 bg-black/40 p-2.5 transition-all duration-200 hover:border-[#f7c600]/30 hover:shadow-[0_0_24px_rgba(247,198,0,0.08)] md:p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {key}
                </span>
                <span className="text-xs font-bold text-[#f7c600]">
                  {i + 1}
                </span>
              </div>

              <div className="relative mx-auto mb-2 h-[120px] w-[96px] overflow-hidden rounded-lg bg-zinc-900/50 md:mb-3 md:h-[140px] md:w-[112px]">
                <div className="absolute left-1/2 top-0 origin-top -translate-x-1/2 scale-[0.3] md:scale-[0.35]">
                  <CarouselSlide
                    image={image}
                    text={captions[key]}
                    index={i + 1}
                    templateId={templateId}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportSingle(i)}
                disabled={isBusy}
                className="w-full min-h-[40px] rounded-lg border border-zinc-700 bg-[#1a1f2e] py-2 text-xs font-semibold text-white transition-colors duration-200 hover:border-[#f7c600]/40 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading
                  ? "Exporting…"
                  : `Download ${format === "png" ? "PNG" : "JPG"}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="export-sticky-bar fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-[#0b0f1a]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        {exportAllButton}
      </div>
    </section>
  );
}

export default memo(ExportPanel);

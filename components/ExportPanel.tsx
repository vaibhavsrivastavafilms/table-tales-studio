"use client";

import { useState, type MutableRefObject } from "react";
import CarouselSlide from "@/components/CarouselSlide";
import {
  exportAllSlides,
  exportSingleSlide,
} from "@/lib/exportSlides";
import { SLIDE_KEYS, type Captions } from "@/lib/slides";

type ExportPanelProps = {
  images: string[];
  captions: Captions;
  template?: string;
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
  onToast: (message: string, variant?: "success" | "error") => void;
};

export default function ExportPanel({
  images,
  captions,
  template = "Street Food",
  slideRefs,
  onToast,
}: ExportPanelProps) {
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      await exportAllSlides(slideRefs.current);
      onToast("Carousel exported — table-tales-carousel.zip downloaded");
    } catch {
      onToast("Export failed. Try again after images load.", "error");
    } finally {
      setExportingAll(false);
    }
  };

  const handleExportSingle = async (index: number) => {
    setExportingIndex(index);
    try {
      await exportSingleSlide(slideRefs.current[index], index + 1);
      onToast(`Slide ${index + 1} saved as JPG`);
    } catch {
      onToast(`Could not export slide ${index + 1}`, "error");
    } finally {
      setExportingIndex(null);
    }
  };

  return (
    <section className="rounded-[40px] bg-[#0b0f1a] p-6 ring-1 ring-white/5">
      <header className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
          Export
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Export Individual Slides
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Instagram-ready JPG · 1080×1350
        </p>
      </header>

      <button
        type="button"
        onClick={handleExportAll}
        disabled={exportingAll || exportingIndex !== null}
        className="mb-6 w-full rounded-xl bg-[#f7c600] py-4 text-sm font-bold text-black shadow-[0_0_32px_rgba(247,198,0,0.35)] transition-all duration-200 hover:bg-[#ffe033] hover:shadow-[0_0_40px_rgba(247,198,0,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exportingAll ? "Packaging ZIP…" : "Export All Slides"}
      </button>

      <div className="grid grid-cols-2 gap-3">
        {SLIDE_KEYS.map((key, i) => {
          const image =
            images[i] ?? images[images.length - 1] ?? images[0] ?? "";
          const isLoading = exportingIndex === i;

          return (
            <div
              key={key}
              className="group rounded-xl border border-zinc-800/80 bg-black/40 p-3 transition-all duration-200 hover:border-[#f7c600]/30 hover:shadow-[0_0_24px_rgba(247,198,0,0.08)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {key}
                </span>
                <span className="text-xs font-bold text-[#f7c600]">
                  {i + 1}
                </span>
              </div>

              <div className="relative mx-auto mb-3 h-[140px] w-[112px] overflow-hidden rounded-lg bg-zinc-900/50">
                <div className="absolute left-1/2 top-0 origin-top -translate-x-1/2 scale-[0.35]">
                  <CarouselSlide
                    image={image}
                    text={captions[key]}
                    index={i + 1}
                    template={template}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportSingle(i)}
                disabled={
                  exportingAll || isLoading || exportingIndex !== null
                }
                className="w-full rounded-lg border border-zinc-700 bg-[#1a1f2e] py-2 text-xs font-semibold text-white transition-colors duration-200 hover:border-[#f7c600]/40 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Exporting…" : "Download JPG"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

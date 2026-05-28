"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import ExportStudioSection from "@/components/ExportStudioSection";
import ExportPipelineBar from "@/components/ExportPipelineBar";
import CreatorConfidence from "@/components/CreatorConfidence";
import HealthNotice from "@/components/HealthNotice";
import ExportShowcase from "@/components/ExportShowcase";
import ExportFeedbackPrompt from "@/components/ExportFeedbackPrompt";
import { loadExportHistory, recordExportHistory } from "@/lib/exportStudio";
import { DEFAULT_BRAND_KIT, resolveWatermarkText, type BrandKit } from "@/lib/brandKit";
import { recordExportPreference } from "@/lib/creatorMemory";
import { canExport, recordExportUsage } from "@/lib/usage";
import CarouselSlide from "@/components/CarouselSlide";
import {
  exportAllSlides,
  exportSingleSlide,
  type ExportFormat,
  type ExportProgress,
} from "@/lib/exportSlides";
import {
  acquireExportLock,
  isActiveRenderSession,
  releaseExportLock,
} from "@/lib/exportSession";
import {
  ExportTimeline,
  type ExportTimelineSnapshot,
} from "@/lib/exportTimeline";
import {
  runExportPreflight,
  type ConfidenceBadge,
  EXPORT_SPEC_LABEL,
} from "@/lib/exportPreflight";
import { recordHealthEvent } from "@/lib/health";
import { scheduleIdleCleanup } from "@/lib/idleCleanup";
import { shouldShowToast } from "@/lib/toastCoordinator";
import { SLIDE_COUNT, SLIDE_KEYS, type Captions } from "@/lib/slides";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { AiSlideDesign } from "@/lib/aiOverlayRenderer";
import type { TemplateId } from "@/lib/templates";
import { parseExportFormat } from "@/lib/validation";

type ExportPanelProps = {
  images: string[];
  captions: Captions;
  templateId: TemplateId;
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
  onToast: (message: string, variant?: "success" | "error") => void;
  onExportComplete?: (format: string) => void;
  showWatermark?: boolean;
  brandKit?: BrandKit;
  cloudSynced?: boolean;
  storyMood?: string;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  getAiDesign?: (slideIndex: number) => AiSlideDesign | null;
};

function ExportPanel({
  images,
  captions,
  templateId,
  slideRefs,
  onToast,
  onExportComplete,
  showWatermark = false,
  brandKit,
  cloudSynced = false,
  storyMood,
  styleReference,
  styleVision,
  getAiDesign,
}: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("jpeg");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const watermark = resolveWatermarkText(brandKit ?? DEFAULT_BRAND_KIT, showWatermark);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const [pipeline, setPipeline] = useState<ExportTimelineSnapshot | null>(null);
  const [confidenceBadges, setConfidenceBadges] = useState<ConfidenceBadge[]>(
    []
  );
  const abortRef = useRef<AbortController | null>(null);
  const timelineRef = useRef<ExportTimeline | null>(null);
  const sessionRef = useRef<string | null>(null);
  const cancelToastSentRef = useRef(false);
  const [feedbackExportId, setFeedbackExportId] = useState<string | null>(null);

  const isBusy = exportingAll || exportingIndex !== null;

  const emitToast = useCallback(
    (message: string, variant: "success" | "error" = "success") => {
      if (shouldShowToast(message, variant)) {
        onToast(message, variant);
      }
    },
    [onToast]
  );

  const resetPipeline = useCallback(() => {
    setPipeline(null);
    timelineRef.current = null;
    sessionRef.current = null;
    cancelToastSentRef.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await runExportPreflight({
        images,
        captions,
        slideRefs: slideRefs.current,
        expectedTotal: SLIDE_COUNT,
        cloudSynced,
      });
      if (!cancelled && result.ok) {
        setConfidenceBadges(result.badges);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [images, captions, cloudSynced, slideRefs]);

  const finishSession = useCallback(
    (sessionId: string) => {
      releaseExportLock(sessionId);
      scheduleIdleCleanup();
      resetPipeline();
    },
    [resetPipeline]
  );

  const cancelExport = () => {
    abortRef.current?.abort();
    setExportingAll(false);
    setExportingIndex(null);
    const sessionId = sessionRef.current;
    if (timelineRef.current) {
      setPipeline(timelineRef.current.cancel());
    }
    if (sessionId) finishSession(sessionId);
    if (!cancelToastSentRef.current) {
      cancelToastSentRef.current = true;
      emitToast("Export cancelled", "error");
    }
  };

  const handleProgress = useCallback(
    (sessionId: string, progress: ExportProgress, didExport: boolean) => {
      if (!isActiveRenderSession(sessionId) || !timelineRef.current) return;
      setPipeline(timelineRef.current.advance(progress, didExport));
    },
    []
  );

  const handleExportAll = async () => {
    if (isBusy) return;

    const limit = canExport();
    if (!limit.allowed) {
      emitToast(limit.reason, "error");
      return;
    }

    const lock = acquireExportLock();
    if (!lock.acquired) {
      emitToast("Render pipeline busy — wait for the current export", "error");
      return;
    }

    const expectedTotal = Math.max(slideRefs.current.length, SLIDE_COUNT);
    const preflight = await runExportPreflight({
      images,
      captions,
      slideRefs: slideRefs.current,
      expectedTotal,
      cloudSynced,
    });

    if (!preflight.ok) {
      releaseExportLock(lock.sessionId);
      const first = preflight.issues[0];
      emitToast(`${first.message} ${first.hint}`, "error");
      setConfidenceBadges(preflight.badges);
      return;
    }

    setConfidenceBadges(preflight.badges);
    sessionRef.current = lock.sessionId;
    timelineRef.current = new ExportTimeline(lock.sessionId);
    setPipeline(timelineRef.current.start(expectedTotal));
    setPipeline(timelineRef.current.beginRendering());

    abortRef.current = new AbortController();
    setExportingAll(true);

    try {
      await exportAllSlides(slideRefs.current, {
        format,
        expectedTotal,
        signal: abortRef.current.signal,
        onProgress: (p, meta) =>
          handleProgress(lock.sessionId, p, meta?.didExport ?? false),
        onPackaging: () => {
          if (timelineRef.current && isActiveRenderSession(lock.sessionId)) {
            setPipeline(timelineRef.current.beginPackaging());
          }
        },
      });

      if (!isActiveRenderSession(lock.sessionId)) return;

      if (timelineRef.current) {
        setPipeline(timelineRef.current.complete());
      }
      recordExportUsage();
      recordExportHistory(format, preflight.exportable);
      recordExportPreference(format);
      setHistoryRefresh((n) => n + 1);
      const history = loadExportHistory();
      if (history[0]) setFeedbackExportId(history[0].id);
      emitToast(
        format === "png"
          ? "PNG carousel exported — table-tales-carousel-png.zip"
          : "Carousel exported — table-tales-carousel.zip"
      );
      onExportComplete?.(format);
    } catch (error) {
      if (!isActiveRenderSession(lock.sessionId)) return;

      const msg =
        error instanceof Error ? error.message : "Export failed";

      if (timelineRef.current) {
        setPipeline(
          msg.includes("cancelled")
            ? timelineRef.current.cancel()
            : timelineRef.current.fail()
        );
      }

      if (msg.includes("cancelled")) {
        if (!cancelToastSentRef.current) {
          cancelToastSentRef.current = true;
          emitToast("Export cancelled", "error");
        }
      } else {
        recordHealthEvent("exportFailures");
        emitToast(
          msg.includes("timed out")
            ? "Export timed out — retry after images finish loading"
            : "Export interrupted — preview loaded, then retry",
          "error"
        );
      }
    } finally {
      setExportingAll(false);
      finishSession(lock.sessionId);
    }
  };

  const handleExportSingle = async (index: number) => {
    if (isBusy) return;

    const limit = canExport();
    if (!limit.allowed) {
      emitToast(limit.reason, "error");
      return;
    }

    const lock = acquireExportLock();
    if (!lock.acquired) {
      emitToast("Render pipeline busy — wait for the current export", "error");
      return;
    }

    if (!slideRefs.current[index]) {
      releaseExportLock(lock.sessionId);
      emitToast(`Slide ${index + 1} is not ready — check preview`, "error");
      return;
    }

    sessionRef.current = lock.sessionId;
    timelineRef.current = new ExportTimeline(lock.sessionId);
    setPipeline(timelineRef.current.start(1));
    setPipeline(timelineRef.current.beginRendering());

    abortRef.current = new AbortController();
    setExportingIndex(index);

    try {
      await exportSingleSlide(slideRefs.current[index], index + 1, {
        format,
        signal: abortRef.current.signal,
        onProgress: (p) => handleProgress(lock.sessionId, p, true),
      });

      if (!isActiveRenderSession(lock.sessionId)) return;

      if (timelineRef.current) {
        setPipeline(timelineRef.current.complete());
      }
      recordExportUsage();
      recordExportHistory(format, 1);
      recordExportPreference(format);
      setHistoryRefresh((n) => n + 1);
      emitToast(`Slide ${index + 1} saved as ${format === "png" ? "PNG" : "JPG"}`);
      onExportComplete?.(format);
    } catch (error) {
      if (!isActiveRenderSession(lock.sessionId)) return;

      const msg =
        error instanceof Error ? error.message : "Export failed";
      if (timelineRef.current) {
        setPipeline(
          msg.includes("cancelled")
            ? timelineRef.current.cancel()
            : timelineRef.current.fail()
        );
      }
      recordHealthEvent("exportFailures");
      emitToast(
        msg.includes("cancelled")
          ? "Export cancelled"
          : msg.includes("timed out")
            ? `Slide ${index + 1} timed out — retry`
            : `Could not export slide ${index + 1} — wait for preview`,
        "error"
      );
    } finally {
      setExportingIndex(null);
      finishSession(lock.sessionId);
    }
  };

  const exportAllButton = (
    <button
      type="button"
      onClick={handleExportAll}
      disabled={isBusy}
      className="w-full min-h-[48px] rounded-xl bg-[#f7c600] py-4 text-sm font-bold text-black shadow-[0_0_32px_rgba(247,198,0,0.35)] transition-all duration-200 hover:bg-[#ffe033] hover:shadow-[0_0_40px_rgba(247,198,0,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {exportingAll ? "Rendering carousel…" : "Export All Slides"}
    </button>
  );

  return (
    <section className="relative min-w-0 rounded-[28px] bg-[#0b0f1a] p-4 ring-1 ring-white/5 md:rounded-[40px] md:p-6">
      <header className="mb-4 md:mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
          Export
        </p>
        <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">
          Export Individual Slides
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {EXPORT_SPEC_LABEL} · cinematic render pipeline
        </p>
      </header>

      <HealthNotice />
      <CreatorConfidence badges={confidenceBadges} />
      <ExportShowcase refreshKey={historyRefresh} />
      {feedbackExportId && (
        <ExportFeedbackPrompt
          exportId={feedbackExportId}
          onDismiss={() => setFeedbackExportId(null)}
        />
      )}

      <ExportStudioSection
        format={format}
        onFormatChange={(f) => {
          const safe = parseExportFormat(f);
          setFormat(safe);
          recordExportPreference(safe);
        }}
        refreshKey={historyRefresh}
      />

      <ExportPipelineBar snapshot={isBusy ? pipeline : null} />

      {isBusy && (
        <button
          type="button"
          onClick={cancelExport}
          className="mb-4 w-full rounded-lg border border-zinc-700 py-2 text-xs font-semibold text-zinc-400 transition-colors duration-200 hover:text-white"
        >
          Cancel render
        </button>
      )}

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
                    brandKit={brandKit}
                    watermarkText={watermark}
                    storyMood={storyMood}
                    styleReference={styleReference}
                    styleVision={styleVision}
                    aiDesign={getAiDesign?.(i + 1) ?? null}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportSingle(i)}
                disabled={isBusy}
                className="w-full min-h-[40px] rounded-lg border border-zinc-700 bg-[#1a1f2e] py-2 text-xs font-semibold text-white transition-colors duration-200 hover:border-[#f7c600]/40 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Rendering…" : `Download ${format === "png" ? "PNG" : "JPG"}`}
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

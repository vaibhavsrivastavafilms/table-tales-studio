"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import PreviewPanel from "@/components/PreviewPanel";
import ExportPanel from "@/components/ExportPanel";
import ExportToast from "@/components/ExportToast";
import UploadPanel from "@/components/UploadPanel";
import StoryPanel from "@/components/StoryPanel";
import DashboardErrorBoundary from "@/components/DashboardErrorBoundary";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import type { Captions } from "@/lib/slides";
import { generateStory } from "@/lib/apiClient";
import { cleanupExportMemory } from "@/lib/exportSlides";
import { safeTimeout } from "@/lib/browser";
import { createEmptyCaptions } from "@/lib/draftStorage";
import { uploadImagesForProjectSafe } from "@/lib/uploadPipeline";
import { sanitizeCaptionField } from "@/lib/validation";
import { trackEvent } from "@/lib/analytics";
import { shouldShowWatermark } from "@/lib/usage";
import { loadEditorState, persistEditorState } from "@/lib/projectPersistence";
import { logExport } from "@/lib/projects";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplateConfig,
  type TemplateId,
} from "@/lib/templates";
import type { Project } from "@/lib/projects";
import CreatorWelcome from "@/components/CreatorWelcome";
import BrandKitPanel from "@/components/BrandKitPanel";
import StoryboardPanel from "@/components/StoryboardPanel";
import TrendInsights from "@/components/TrendInsights";
import {
  applySmartDefaults,
  getWelcomeBackMessage,
  recordCreatorSession,
  recordTemplateUse,
  recordViralMode,
  type WelcomeBackMessage,
} from "@/lib/creatorMemory";
import { loadBrandKit, type BrandKit } from "@/lib/brandKit";
import type { ViralHookMode } from "@/lib/viralHooks";
import { enhanceHookLocally } from "@/lib/viralHooks";
import { MOTION } from "@/lib/motion";
import { shouldShowToast } from "@/lib/toastCoordinator";
import { recordHealthEvent } from "@/lib/health";
import { scheduleIdleCleanup } from "@/lib/idleCleanup";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getDemoProject } from "@/lib/demoProject";
import { markDemoTried } from "@/lib/creatorMemory";
import { logMonitoring } from "@/lib/monitoring";

type CarouselEditorProps = {
  projectId?: string | null;
  demoMode?: boolean;
};

export default function CarouselEditor({
  projectId,
  demoMode = false,
}: CarouselEditorProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Captions>(() => createEmptyCaptions());
  const [templateId, setTemplateId] =
    useState<TemplateId>(DEFAULT_TEMPLATE_ID);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [viralMode, setViralMode] = useState<ViralHookMode>("viral");
  const [brandKit, setBrandKit] = useState<BrandKit>(() =>
    loadBrandKit(projectId ?? null)
  );
  const [storyboardOpen, setStoryboardOpen] = useState(false);
  const [welcome, setWelcome] = useState<WelcomeBackMessage | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeProjectId = useRef<string | null>(projectId ?? null);
  const loadToastShownRef = useRef(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const analyticsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, variant: "success" | "error" = "success") => {
      if (!shouldShowToast(message, variant)) return;
      setToast({ message, variant });
      safeTimeout(() => setToast(null), MOTION.toastMs);
    },
    []
  );

  useEffect(() => {
    void trackEvent("session_active");
    const defaults = applySmartDefaults();
    if (defaults.viralMode) setViralMode(defaults.viralMode);
    if (defaults.preferredTemplateId && !projectId) {
      setTemplateId(defaults.preferredTemplateId);
    }
    setWelcome(getWelcomeBackMessage());
  }, [projectId]);

  useEffect(() => {
    if (!ready) return;
    recordCreatorSession(project?.title ?? undefined);
  }, [ready, project?.title]);

  useEffect(() => {
    return () => {
      cleanupExportMemory();
      scheduleIdleCleanup();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (demoMode) {
          const demo = getDemoProject();
          if (!cancelled) {
            setCaptions(demo.captions);
            setTemplateId(demo.templateId);
            setImages(demo.images);
            activeProjectId.current = null;
            setProject({
              id: "demo",
              title: demo.title,
              templateId: demo.templateId,
              captions: demo.captions,
              images: demo.images,
              updatedAt: new Date().toISOString(),
            });
            markDemoTried();
            logMonitoring("demo_project_loaded", "info");
            if (!loadToastShownRef.current) {
              loadToastShownRef.current = true;
              showToast("Sample restaurant story loaded — edit freely");
            }
          }
          return;
        }

        let pid = projectId ?? null;

        if (pid && isSupabaseConfigured()) {
          const loaded = await loadEditorState(pid);
          if (!cancelled) {
            setProject(loaded.project);
            setCaptions(loaded.state.captions);
            setTemplateId(loaded.state.templateId);
            setImages(loaded.state.images);
            activeProjectId.current = loaded.project?.id ?? pid;
            setBrandKit(loadBrandKit(activeProjectId.current));
            setCloudSynced(loaded.source === "cloud");
            if (!loadToastShownRef.current) {
              loadToastShownRef.current = true;
              if (loaded.source === "cloud") {
                showToast("Project loaded from cloud");
              } else {
                showToast("Draft restored locally");
              }
            }
          }
        } else {
          const loaded = await loadEditorState(null);
          if (!cancelled) {
            setCaptions(loaded.state.captions);
            setTemplateId(loaded.state.templateId);
            setImages(loaded.state.images);
            activeProjectId.current = null;
            setCloudSynced(false);
            if (loaded.source === "local" && !loadToastShownRef.current) {
              loadToastShownRef.current = true;
              showToast("Draft restored");
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          recordHealthEvent("syncTimeouts");
          showToast(
            err instanceof Error ? err.message : "Failed to load project",
            "error"
          );
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, demoMode, showToast]);

  useEffect(() => {
    if (!ready) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        const updated = await persistEditorState(activeProjectId.current, {
          captions,
          templateId,
          images,
        });
        if (updated) {
          setProject(updated);
          setCloudSynced(true);
          setSaveLabel("Cloud synced");
        } else {
          setCloudSynced(false);
          setSaveLabel("Saved locally");
        }
        safeTimeout(() => setSaveLabel(null), 3000);
      })();
    }, MOTION.saveDebounceMs);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [captions, templateId, images, ready]);

  const handleImagesSelected = useCallback(
    async (files: File[]) => {
      if (!files.length) {
        showToast("No images selected", "error");
        return;
      }

      setIsUploading(true);
      try {
        const urls = await uploadImagesForProjectSafe(
          activeProjectId.current,
          files,
          images
        );
        setImages(urls);
        showToast(
          `${files.length} image${files.length > 1 ? "s" : ""} uploaded`
        );
      } catch {
        recordHealthEvent("imageLoadFailures");
        showToast("Upload failed — try smaller images", "error");
      } finally {
        setIsUploading(false);
      }
    },
    [images, showToast]
  );

  const handleCaptionChange = useCallback(
    (key: keyof Captions, value: string) => {
      setCaptions((prev) => ({ ...prev, [key]: sanitizeCaptionField(value) }));
    },
    []
  );

  const runGenerateStory = useCallback(async () => {
    setIsGenerating(true);
    try {
      const templateName = getTemplateConfig(templateId).name;
      recordViralMode(viralMode);
      const result = await generateStory({
        template: templateName,
        imageCount: images.length || 5,
        viralMode,
      });

      const next = { ...result.captions };
      if (next.hook.trim()) {
        next.hook = enhanceHookLocally(next.hook, viralMode);
      }
      if (!next.cta.trim() && brandKit.brandCta.trim()) {
        next.cta = brandKit.brandCta;
      }
      setCaptions(next);

      if (result.ok) {
        showToast("AI story generated");
        void trackEvent("ai_generation", {
          templateId,
          projectId: activeProjectId.current ?? "",
        });
      } else {
        showToast(result.error, "error");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [images.length, showToast, templateId, viralMode, brandKit.brandCta]);

  const handleExportComplete = useCallback(
    (format: string) => {
      void logExport(activeProjectId.current, format);
      void trackEvent("export_generated", {
        format,
        projectId: activeProjectId.current ?? "",
      });
    },
    []
  );

  const showWatermark = shouldShowWatermark();

  if (!ready) {
    return (
      <main className="dashboard-main min-h-screen overflow-x-hidden bg-[#f7c600] p-4 md:p-6">
        <div className="mx-auto max-w-[1600px]">
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-main min-h-screen overflow-x-hidden bg-[#f7c600] p-4 text-white md:p-6">
      <ExportToast
        message={toast?.message ?? null}
        variant={toast?.variant}
      />

      <div className="mx-auto min-w-0 max-w-[1600px]">
        {!welcomeDismissed && welcome && (
          <CreatorWelcome
            message={welcome}
            onDismiss={() => setWelcomeDismissed(true)}
          />
        )}

        <header className="mb-6 min-w-0 md:mb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-black/70 hover:text-black"
              >
                ← All projects
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-black sm:text-5xl xl:text-7xl">
                {project?.title ?? "Table Tales Studio"}
              </h1>
              {demoMode && (
                <p className="mt-1 text-xs font-semibold text-black/60">
                  Interactive demo · export & edit to learn the studio
                </p>
              )}
              <p className="mt-2 text-base text-black sm:text-xl xl:mt-3 xl:text-2xl">
                AI Food Storytelling Carousel Generator
              </p>
            </div>
            {saveLabel && (
              <p className="rounded-full bg-[#0b0f1a]/80 px-4 py-2 text-xs font-semibold text-[#f7c600] ring-1 ring-[#f7c600]/30">
                {saveLabel}
              </p>
            )}
          </div>
        </header>

        <DashboardErrorBoundary>
          <div className="flex min-w-0 flex-col gap-4 xl:grid xl:grid-cols-12 xl:gap-6">
            <div className="min-w-0 xl:col-span-2">
              <Sidebar />
            </div>

            <div className="flex min-w-0 flex-col gap-4 xl:col-span-5 xl:gap-6">
              <BrandKitPanel
                projectId={activeProjectId.current}
                onChange={setBrandKit}
              />
              <TrendInsights
                onApplyHint={(hint) => {
                  setCaptions((prev) => ({
                    ...prev,
                    hook: prev.hook.trim() ? prev.hook : hint,
                  }));
                  showToast("Trend applied to hook");
                }}
              />
              <UploadPanel
                images={images}
                templateId={templateId}
                viralMode={viralMode}
                onViralModeChange={(mode) => {
                  setViralMode(mode);
                  recordViralMode(mode);
                }}
                onTemplateChange={(id) => {
                  setTemplateId(id);
                  recordTemplateUse(id);
                  if (analyticsTimerRef.current) {
                    clearTimeout(analyticsTimerRef.current);
                  }
                  analyticsTimerRef.current = setTimeout(() => {
                    void trackEvent("template_used", { templateId: id });
                  }, MOTION.analyticsDebounceMs);
                }}
                onImagesSelected={handleImagesSelected}
                onGenerate={runGenerateStory}
                isGenerating={isGenerating}
                isUploading={isUploading}
              />
              <StoryPanel
                captions={captions}
                onCaptionChange={handleCaptionChange}
                isGenerating={isGenerating}
                viralMode={viralMode}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-4 pb-20 xl:col-span-5 xl:gap-6 xl:pb-0">
              <PreviewPanel
                images={images}
                captions={captions}
                templateId={templateId}
                slideRefs={slideRefs}
                showWatermark={showWatermark}
                brandKit={brandKit}
                onOpenStoryboard={() => setStoryboardOpen(true)}
              />
              <ExportPanel
                images={images}
                captions={captions}
                templateId={templateId}
                slideRefs={slideRefs}
                onToast={showToast}
                onExportComplete={handleExportComplete}
                showWatermark={showWatermark}
                brandKit={brandKit}
                cloudSynced={cloudSynced}
              />
            </div>
          </div>
        </DashboardErrorBoundary>
      </div>

      <StoryboardPanel
        open={storyboardOpen}
        onClose={() => setStoryboardOpen(false)}
        images={images}
        captions={captions}
        templateId={templateId}
        brandKit={brandKit}
        showPlanWatermark={showWatermark}
      />
    </main>
  );
}

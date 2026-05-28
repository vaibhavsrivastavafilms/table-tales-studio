"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DashboardClientShell from "@/components/DashboardClientShell";
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
import AiDesignModePanel from "@/components/AiDesignModePanel";
import {
  DEFAULT_AI_DESIGN_MODE,
  suggestAiDesignMode,
  type AiDesignModeId,
} from "@/lib/aiDesignModes";
import { useCreativeRenderPipeline } from "@/lib/useCreativeRenderPipeline";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplateConfig,
  isDoodleStoryTemplate,
  type TemplateId,
} from "@/lib/templates";
import type { Project } from "@/lib/projects";
import CreatorWelcome from "@/components/CreatorWelcome";
import BrandKitPanel from "@/components/BrandKitPanel";
import StoryboardPanel from "@/components/StoryboardPanel";
import TrendInsights from "@/components/TrendInsights";
import CreatorInsights from "@/components/CreatorInsights";
import DirectorIdentityCard from "@/components/DirectorIdentityCard";
import CreativeDirectorPanel from "@/components/CreativeDirectorPanel";
import CreativeDirectionPanel from "@/components/CreativeDirectionPanel";
import QuickWorkflowsPanel from "@/components/QuickWorkflowsPanel";
import PlatformModeSelect from "@/components/PlatformModeSelect";
import SessionExportBar from "@/components/SessionExportBar";
import VisualStoryBrief from "@/components/VisualStoryBrief";
import {
  formatVisualSummary,
  regeneratePersonalizedStory,
  runVisualStoryPipeline,
  type VisualStoryBrief as StoryBrief,
} from "@/lib/storyDirector";
import { learnFromStoryGenerated, scheduleDirectorLearning } from "@/lib/directorLearning";
import { getDirectorProfileSnapshot } from "@/lib/directorProfile";
import { analyzeImageSet, type VisualAnalysis } from "@/lib/visualAnalysis";
import { useCreatorMemory, useIsClient } from "@/lib/clientHooks";
import {
  getWelcomeBackMessage,
  recordCaptionTone,
  recordCtaStyle,
  recordExportCompleted,
  recordCreatorSession,
  recordPlatformMode,
  recordCreatorDirection,
  recordStyleReference,
  recordTemplateUse,
  recordViralMode,
  type NichePreference,
} from "@/lib/creatorMemory";
import {
  DEFAULT_CREATOR_DIRECTION,
  viralModeFromBalance,
  type CreatorDirection,
} from "@/lib/creatorDirection";
import { analyzeReferenceStyleRich, type StyleVisionResult } from "@/lib/styleVision";
import type { StyleReference } from "@/lib/styleReference";
import { applyQuickWorkflow, type QuickWorkflowId } from "@/lib/quickWorkflows";
import { getPlatformMode, type PlatformModeId } from "@/lib/platformModes";
import {
  DEFAULT_BRAND_KIT,
  loadBrandKit,
  saveBrandKit,
  type BrandKit,
} from "@/lib/brandKit";
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
import BuilderTopBar from "@/components/builder/BuilderTopBar";
import BuilderInputPanel from "@/components/builder/BuilderInputPanel";
import BuilderPreview from "@/components/builder/BuilderPreview";
import BuilderInspector from "@/components/builder/BuilderInspector";
import BuilderSlideTimeline from "@/components/builder/BuilderSlideTimeline";
import { DEFAULT_BUILDER_TEMPLATE } from "@/lib/builderTemplates";
import {
  builderToneToViralMode,
  type BuilderToneId,
} from "@/lib/builderTone";
import {
  prefsForSlide,
  type SlideEditorPrefs,
} from "@/lib/slideEditorPrefs";
import { SLIDE_KEYS } from "@/lib/slides";

type CarouselEditorProps = {
  projectId?: string | null;
  demoMode?: boolean;
  variant?: "dashboard" | "studio";
};

export default function CarouselEditor({
  projectId,
  demoMode = false,
  variant = "studio",
}: CarouselEditorProps) {
  const isStudio = variant !== "dashboard";
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Captions>(() => createEmptyCaptions());
  const creatorMem = useCreatorMemory();
  const isClient = useIsClient();
  const [templateId, setTemplateId] = useState<TemplateId>(
    () =>
      (variant === "studio"
        ? DEFAULT_BUILDER_TEMPLATE
        : creatorMem.preferredTemplateId) ?? DEFAULT_TEMPLATE_ID
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [viralMode, setViralMode] = useState<ViralHookMode>(
    () => creatorMem.viralMode
  );
  const [brandKit, setBrandKit] = useState<BrandKit>(DEFAULT_BRAND_KIT);
  const [storyboardOpen, setStoryboardOpen] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [platformMode, setPlatformMode] = useState<PlatformModeId>(
    () => creatorMem.platformMode
  );
  const [activeWorkflowId, setActiveWorkflowId] =
    useState<QuickWorkflowId | undefined>(undefined);
  const [nichePreference, setNichePreference] = useState<NichePreference>(
    () => creatorMem.nichePreference
  );
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    projectId ?? null
  );
  const [storyBrief, setStoryBrief] = useState<StoryBrief | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<VisualAnalysis | null>(null);
  const [isDirecting, setIsDirecting] = useState(false);
  const [styleReference, setStyleReference] = useState<StyleReference | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(
    null
  );
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [styleVision, setStyleVision] = useState<StyleVisionResult | null>(null);
  const [creatorDirection, setCreatorDirection] = useState<CreatorDirection>(
    () => creatorMem.creatorDirection ?? DEFAULT_CREATOR_DIRECTION
  );
  const directorSessionStartedRef = useRef(false);
  const directionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionLearnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stylePreviewUrlRef = useRef<string | null>(null);
  const [aiDesignMode, setAiDesignMode] =
    useState<AiDesignModeId>(DEFAULT_AI_DESIGN_MODE);
  const userPickedAiModeRef = useRef(false);
  const [aiTextEnabled, setAiTextEnabled] = useState(true);
  const [builderTone, setBuilderTone] = useState<BuilderToneId>("emotional");
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [slidePrefsMap, setSlidePrefsMap] = useState<
    Record<number, Partial<SlideEditorPrefs>>
  >({});

  const isDoodleTemplate = isDoodleStoryTemplate(templateId);
  const creativePipeline = useCreativeRenderPipeline({
    enabled: isStudio && images.length > 0,
    templateId,
    captions,
    mode: aiDesignMode,
    analysis: lastAnalysis,
    styleReference,
    styleVision,
    mood: storyBrief?.mood,
  });

  const dashboardAiPipeline = useCreativeRenderPipeline({
    enabled: !isStudio && isDoodleTemplate && images.length > 0,
    templateId,
    captions,
    mode: aiDesignMode,
    analysis: lastAnalysis,
    styleReference,
    styleVision,
    mood: storyBrief?.mood,
  });

  const getArtDirection = useCallback(
    (slideIndex: number) => {
      const pipe = isStudio ? creativePipeline : dashboardAiPipeline;
      return pipe.getArtDirection(slideIndex);
    },
    [isStudio, creativePipeline, dashboardAiPipeline]
  );

  const welcome = useMemo(
    () => (isClient ? getWelcomeBackMessage() : null),
    [isClient]
  );

  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    return () => {
      if (stylePreviewUrlRef.current) {
        URL.revokeObjectURL(stylePreviewUrlRef.current);
        stylePreviewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!lastAnalysis || userPickedAiModeRef.current) return;
    setAiDesignMode(suggestAiDesignMode(lastAnalysis));
  }, [lastAnalysis]);

  useEffect(() => {
    if (!isClient) return;
    void trackEvent("session_active");
    if (!directorSessionStartedRef.current) {
      directorSessionStartedRef.current = true;
      scheduleDirectorLearning({ type: "session" });
    }
  }, [isClient]);

  useEffect(() => {
    if (!ready || !isClient) return;
    if (captionLearnTimerRef.current) clearTimeout(captionLearnTimerRef.current);
    captionLearnTimerRef.current = setTimeout(() => {
      scheduleDirectorLearning({ type: "captions", captions });
    }, 1200);
    return () => {
      if (captionLearnTimerRef.current) clearTimeout(captionLearnTimerRef.current);
    };
  }, [captions, ready, isClient]);

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
            setActiveProjectId(null);
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

        const pid = projectId ?? null;

        if (pid && isSupabaseConfigured()) {
          const loaded = await loadEditorState(pid);
          if (!cancelled) {
            const resolvedId = loaded.project?.id ?? pid;
            setProject(loaded.project);
            setCaptions(loaded.state.captions);
            setTemplateId(loaded.state.templateId);
            setImages(loaded.state.images);
            setActiveProjectId(resolvedId);
            setBrandKit(loadBrandKit(resolvedId));
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
            setActiveProjectId(null);
            setBrandKit(loadBrandKit(null));
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
        const updated = await persistEditorState(activeProjectId, {
          captions,
          templateId,
          images,
        });
        if (updated) {
          setProject(updated);
          setCloudSynced(true);
          setSaveLabel("Saved to cloud");
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
  }, [captions, templateId, images, ready, activeProjectId]);

  const runVisualDirector = useCallback(
    async (
      urls: string[],
      fileNames?: string[],
      directionOverride?: CreatorDirection
    ) => {
      if (!urls.length || demoMode) return;
      const direction = directionOverride ?? creatorDirection;
      const effectiveViralMode = directionOverride
        ? viralModeFromBalance(direction.viralityBalance)
        : viralMode;
      setIsDirecting(true);
      try {
        const result = await runVisualStoryPipeline({
          imageUrls: urls,
          fileNames,
          memory: {
            captionTone: creatorMem.captionTone,
            nichePreference,
            viralMode: effectiveViralMode,
            platformMode,
            preferredTemplateId: creatorMem.preferredTemplateId,
          },
          brandCta: brandKit.brandCta || undefined,
          hookPattern: brandKit.hookPattern || undefined,
          profile: getDirectorProfileSnapshot(),
          styleReference: styleReference ?? undefined,
          creatorDirection: direction,
          styleVision: styleVision ?? undefined,
        });
        setTemplateId(result.suggestion.template);
        recordTemplateUse(result.suggestion.template);
        setCaptions(result.captions);
        setStoryBrief(result.brief);
        setLastAnalysis(result.analysis);
        learnFromStoryGenerated(result.captions, {
          templateId: result.suggestion.template,
          viralMode: effectiveViralMode,
          narrativeAngle: result.brief.narrativeAngle,
        });
        showToast("AI-directed story applied");
        void trackEvent("ai_generation", {
          templateId: result.suggestion.template,
          projectId: activeProjectId ?? "",
        });
      } catch {
        showToast("Visual analysis unavailable — edit captions manually", "error");
      } finally {
        setIsDirecting(false);
      }
    },
    [
      activeProjectId,
      brandKit.brandCta,
      brandKit.hookPattern,
      creatorMem.captionTone,
      creatorMem.preferredTemplateId,
      demoMode,
      nichePreference,
      platformMode,
      showToast,
      viralMode,
      styleReference,
      creatorDirection,
      styleVision,
    ]
  );

  const handleCreatorDirectionChange = useCallback(
    (next: CreatorDirection) => {
      setCreatorDirection(next);
      recordCreatorDirection(next);
      setPlatformMode(next.platform);
      recordPlatformMode(next.platform);
      const mode = viralModeFromBalance(next.viralityBalance);
      setViralMode(mode);
      recordViralMode(mode);

      if (directionDebounceRef.current) {
        clearTimeout(directionDebounceRef.current);
      }
      if (images.length > 0 && !demoMode) {
        directionDebounceRef.current = setTimeout(() => {
          void runVisualDirector(images, undefined, next);
        }, MOTION.analyticsDebounceMs);
      }
    },
    [demoMode, images, runVisualDirector]
  );

  const handleStyleReferenceSelected = useCallback(
    async (file: File) => {
      if (stylePreviewUrlRef.current) {
        URL.revokeObjectURL(stylePreviewUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      stylePreviewUrlRef.current = url;
      setStyleReferencePreview(url);
      setIsAnalyzingStyle(true);
      try {
        const vision = await analyzeReferenceStyleRich(url);
        setStyleVision(vision);
        setStyleReference(vision.reference);
        recordStyleReference({
          aesthetic: vision.reference.aesthetic,
          compositionStyle: vision.reference.compositionStyle,
          captionDensity: vision.reference.captionDensity,
        });
        showToast("Reference style detected — slides will follow its language");
        if (images.length > 0 && !demoMode) {
          await runVisualDirector(images);
        }
      } catch {
        showToast("Could not read reference style — try another screenshot", "error");
      } finally {
        setIsAnalyzingStyle(false);
      }
    },
    [demoMode, images, runVisualDirector, showToast]
  );

  const handleStyleReferenceClear = useCallback(() => {
    if (stylePreviewUrlRef.current) {
      URL.revokeObjectURL(stylePreviewUrlRef.current);
      stylePreviewUrlRef.current = null;
    }
    setStyleReferencePreview(null);
    setStyleReference(null);
    setStyleVision(null);
    setStoryBrief((prev) =>
      prev ? { ...prev, referenceStyle: undefined } : prev
    );
  }, []);

  const handleReorderImage = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  const handleSwapSlideImages = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setImages((prev) => {
      const next = [...prev];
      if (fromIndex >= next.length || toIndex >= next.length) return prev;
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  }, []);

  const handleImagesSelected = useCallback(
    async (files: File[]) => {
      if (!files.length) {
        showToast("No images selected", "error");
        return;
      }

      setIsUploading(true);
      try {
        const urls = await uploadImagesForProjectSafe(
          activeProjectId,
          files,
          images
        );
        setImages(urls);
        showToast(
          `${files.length} image${files.length > 1 ? "s" : ""} uploaded`
        );
        if (!demoMode && urls.length > 0) {
          const analysis = await analyzeImageSet(urls.map((url) => ({ url })));
          setLastAnalysis(analysis);
          if (!userPickedAiModeRef.current) {
            setAiDesignMode(suggestAiDesignMode(analysis));
          }
        }
        if (aiTextEnabled && !demoMode) {
          await runVisualDirector(urls, files.map((f) => f.name));
        }
      } catch {
        recordHealthEvent("imageLoadFailures");
        showToast("Upload failed — try smaller images", "error");
      } finally {
        setIsUploading(false);
      }
    },
    [
      activeProjectId,
      aiTextEnabled,
      demoMode,
      images,
      runVisualDirector,
      showToast,
    ]
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
      recordViralMode(viralMode);
      recordPlatformMode(platformMode);
      scheduleDirectorLearning({ type: "viral_mode", mode: viralMode });
      scheduleDirectorLearning({ type: "template", templateId });

      const profile = getDirectorProfileSnapshot();
      let analysis = lastAnalysis;
      if (!analysis && images.length > 0) {
        analysis = await analyzeImageSet(images.map((url) => ({ url })));
        setLastAnalysis(analysis);
      }

      if (analysis) {
        const result = regeneratePersonalizedStory({
          analysis,
          memory: {
            captionTone: creatorMem.captionTone,
            nichePreference,
            viralMode,
            platformMode,
          },
          templateId,
          brandCta: brandKit.brandCta || undefined,
          hookPattern: brandKit.hookPattern || undefined,
          previousCaptions: captions,
          profile,
          styleReference: styleReference ?? undefined,
          creatorDirection,
          styleVision: styleVision ?? undefined,
        });
        setCaptions(result.captions);
        setStoryBrief(result.brief);
        learnFromStoryGenerated(result.captions, {
          templateId,
          viralMode,
          narrativeAngle: result.brief.narrativeAngle,
        });
        showToast("Story regenerated — your director kept the mood");
        void trackEvent("ai_generation", {
          templateId,
          projectId: activeProjectId ?? "",
        });
        return;
      }

      const templateName = getTemplateConfig(templateId).name;
      const result = await generateStory({
        template: templateName,
        imageCount: images.length || 5,
        viralMode,
        captionTone: creatorMem.captionTone,
        platformMode,
        hookPattern: brandKit.hookPattern || undefined,
        brandCta: brandKit.brandCta || undefined,
        visualSummary: storyBrief ? formatVisualSummary(storyBrief) : undefined,
      });

      const next = { ...result.captions };
      if (next.hook.trim()) {
        next.hook = enhanceHookLocally(next.hook, viralMode);
      }
      if (!next.cta.trim() && brandKit.brandCta.trim()) {
        next.cta = brandKit.brandCta;
      }
      setCaptions(next);
      learnFromStoryGenerated(next, {
        templateId,
        viralMode,
        narrativeAngle: storyBrief?.narrativeAngle,
      });

      if (result.ok) {
        showToast("AI story generated");
        void trackEvent("ai_generation", {
          templateId,
          projectId: activeProjectId ?? "",
        });
      } else {
        showToast(result.error, "error");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [
    images,
    showToast,
    templateId,
    viralMode,
    platformMode,
    brandKit.brandCta,
    brandKit.hookPattern,
    creatorMem.captionTone,
    activeProjectId,
    storyBrief,
    lastAnalysis,
    captions,
    nichePreference,
    styleReference,
    creatorDirection,
    styleVision,
  ]);

  const handleQuickWorkflow = useCallback(
    (workflowId: QuickWorkflowId) => {
      const applied = applyQuickWorkflow(workflowId);
      if (!applied) return;
      setActiveWorkflowId(workflowId);
      setTemplateId(applied.templateId);
      setViralMode(applied.viralMode);
      setPlatformMode(applied.platformMode);
      recordTemplateUse(applied.templateId);
      recordViralMode(applied.viralMode);
      recordPlatformMode(applied.platformMode);
      recordCaptionTone(applied.captionTone);
      setNichePreference(applied.nichePreference);
      const nextKit = saveBrandKit(activeProjectId, applied.brandPatch);
      setBrandKit(nextKit);
      setCaptions((prev) => ({
        ...prev,
        hook: applied.hookSeed,
        cta: applied.brandPatch.brandCta ?? prev.cta,
      }));
      if (applied.brandPatch.brandCta) {
        recordCtaStyle(applied.brandPatch.brandCta);
      }
      showToast(`${getPlatformMode(applied.platformMode).label} workflow applied`);
    },
    [activeProjectId, showToast]
  );

  const handleExportComplete = useCallback(
    (format: string) => {
      recordExportCompleted();
      void logExport(activeProjectId, format);
      void trackEvent("export_generated", {
        format,
        projectId: activeProjectId ?? "",
      });
    },
    [activeProjectId]
  );

  const showWatermark = shouldShowWatermark();

  const getSlidePrefs = useCallback(
    (slideIndex: number) => prefsForSlide(slidePrefsMap, slideIndex),
    [slidePrefsMap]
  );

  const patchSlidePrefs = useCallback(
    (slideIndex: number, patch: Partial<SlideEditorPrefs>) => {
      setSlidePrefsMap((prev) => ({
        ...prev,
        [slideIndex]: { ...prefsForSlide(prev, slideIndex), ...patch },
      }));
    },
    []
  );

  const handleBuilderToneChange = useCallback((tone: BuilderToneId) => {
    setBuilderTone(tone);
    const mode = builderToneToViralMode(tone);
    setViralMode(mode);
    recordViralMode(mode);
  }, []);

  const handleGenerateCarousel = useCallback(async () => {
    if (aiTextEnabled) {
      await runGenerateStory();
    } else {
      showToast("Carousel ready — edit captions in the slide editor");
    }
  }, [aiTextEnabled, runGenerateStory, showToast]);

  if (!ready) {
    if (isStudio) {
      return (
        <main className="builder-root flex h-screen flex-col bg-[#060608]">
          <DashboardSkeleton variant="studio" />
        </main>
      );
    }
    return (
      <DashboardClientShell>
        <main className="dashboard-main min-h-screen overflow-x-hidden bg-[#f7c600] p-4 md:p-6">
          <div className="mx-auto max-w-[1600px]">
            <DashboardSkeleton variant="dashboard" />
          </div>
        </main>
      </DashboardClientShell>
    );
  }

  if (isStudio) {
    const slideKey = SLIDE_KEYS[selectedSlideIndex];

    return (
      <>
        <ExportToast
          message={toast?.message ?? null}
          variant={toast?.variant}
        />
        <main className="builder-root flex h-[100dvh] flex-col overflow-hidden bg-[#060608] text-white">
          <BuilderTopBar pipelineStatus={creativePipeline.panelStatus} />

          <div className="builder-workspace flex min-h-0 flex-1 flex-col lg:flex-row">
            <aside className="builder-aside builder-panel order-2 min-h-0 w-full shrink-0 border-white/[0.06] lg:order-1 lg:w-64 lg:border-r xl:w-72">
              <BuilderInputPanel
                templateId={templateId}
                onTemplateChange={(id) => {
                  setTemplateId(id);
                  recordTemplateUse(id);
                }}
                images={images}
                onImagesSelected={handleImagesSelected}
                onReorderImage={handleReorderImage}
                onStyleReferenceSelected={handleStyleReferenceSelected}
                onStyleReferenceClear={handleStyleReferenceClear}
                styleReferencePreview={styleReferencePreview}
                styleReference={styleReference}
                styleVision={styleVision}
                isAnalyzingStyle={isAnalyzingStyle}
                aiTextEnabled={aiTextEnabled}
                onAiTextEnabledChange={setAiTextEnabled}
                tone={builderTone}
                onToneChange={handleBuilderToneChange}
                onGenerate={() => void handleGenerateCarousel()}
                isGenerating={isGenerating || isDirecting}
                isUploading={isUploading}
                disabled={isUploading}
              />
            </aside>

            <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col lg:order-2">
              <BuilderPreview
                images={images}
                captions={captions}
                templateId={templateId}
                slideRefs={slideRefs}
                selectedIndex={selectedSlideIndex}
                onSelectSlide={setSelectedSlideIndex}
                showWatermark={showWatermark}
                brandKit={brandKit}
                storyMood={storyBrief?.mood}
                styleReference={styleReference}
                styleVision={styleVision}
                getArtDirection={
                  images.length > 0 ? getArtDirection : undefined
                }
                getSlidePrefs={getSlidePrefs}
                pipelineStatus={creativePipeline.panelStatus}
              />
              <BuilderSlideTimeline
                images={images}
                selectedIndex={selectedSlideIndex}
                onSelectSlide={setSelectedSlideIndex}
                onSwapSlides={handleSwapSlideImages}
                disabled={isUploading}
              />
            </div>

            <aside className="builder-aside builder-panel order-3 min-h-0 w-full shrink-0 border-white/[0.06] lg:w-72 lg:border-l xl:w-80">
              <BuilderInspector
                slideIndex={selectedSlideIndex}
                slideKey={slideKey}
                caption={captions[slideKey]}
                prefs={getSlidePrefs(selectedSlideIndex)}
                onCaptionChange={handleCaptionChange}
                onPrefsChange={patchSlidePrefs}
                isDoodleTemplate={isDoodleTemplate}
                slideRefs={slideRefs}
                onToast={showToast}
                onExportComplete={handleExportComplete}
                exportDisabled={isUploading || images.length === 0}
              />
            </aside>
          </div>

          <div className="builder-mobile-bar fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-white/[0.08] bg-[#060608]/95 p-3 backdrop-blur-lg lg:hidden">
            <button
              type="button"
              onClick={() => void handleGenerateCarousel()}
              disabled={isGenerating || isUploading}
              className="builder-cta flex-1 rounded-xl py-3 text-xs font-bold text-black disabled:opacity-50"
            >
              {isGenerating ? "Art-directing…" : "Generate carousel"}
            </button>
            <button
              type="button"
              disabled={isUploading || images.length === 0}
              onClick={() =>
                document
                  .getElementById("builder-export-strip")
                  ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
              }
              className="rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-300"
            >
              Export
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <DashboardClientShell>
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
                AI-directed cinematic storytelling
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
              <DirectorIdentityCard />
              <CreatorInsights />
              <QuickWorkflowsPanel
                onApply={handleQuickWorkflow}
                busy={isGenerating}
              />
              <PlatformModeSelect
                value={platformMode}
                onChange={(mode) => {
                  setPlatformMode(mode);
                  recordPlatformMode(mode);
                  const pm = getPlatformMode(mode);
                  setViralMode(pm.suggestedViralMode);
                  recordViralMode(pm.suggestedViralMode);
                }}
              />
              <BrandKitPanel
                projectId={activeProjectId}
                onChange={setBrandKit}
              />
              <CreativeDirectionPanel brief={storyBrief} />
              <TrendInsights
                onApplyHint={(hint) => {
                  setCaptions((prev) => ({
                    ...prev,
                    hook: prev.hook.trim() ? prev.hook : hint,
                  }));
                  showToast("Trend applied to hook");
                }}
              />
              <VisualStoryBrief brief={storyBrief} loading={isDirecting} />
              <CreativeDirectorPanel
                value={creatorDirection}
                onChange={handleCreatorDirectionChange}
                disabled={isDirecting || isUploading}
              />
              {isDoodleTemplate && (
                <AiDesignModePanel
                  mode={aiDesignMode}
                  onModeChange={(mode) => {
                    userPickedAiModeRef.current = true;
                    setAiDesignMode(mode);
                  }}
                  status={dashboardAiPipeline.panelStatus}
                  aiAvailable={dashboardAiPipeline.aiAvailable}
                  disabled={isDirecting || isUploading || images.length === 0}
                  onRegenerate={() => void dashboardAiPipeline.regenerate()}
                />
              )}
              <UploadPanel
                images={images}
                templateId={templateId}
                viralMode={viralMode}
                onViralModeChange={(mode) => {
                  setViralMode(mode);
                  recordViralMode(mode);
                  scheduleDirectorLearning({ type: "viral_mode", mode });
                }}
                onTemplateChange={(id) => {
                  setTemplateId(id);
                  recordTemplateUse(id);
                  scheduleDirectorLearning({ type: "template", templateId: id });
                  if (analyticsTimerRef.current) {
                    clearTimeout(analyticsTimerRef.current);
                  }
                  analyticsTimerRef.current = setTimeout(() => {
                    void trackEvent("template_used", { templateId: id });
                  }, MOTION.analyticsDebounceMs);
                }}
                onImagesSelected={handleImagesSelected}
                onStyleReferenceSelected={handleStyleReferenceSelected}
                onStyleReferenceClear={handleStyleReferenceClear}
                styleReferencePreview={styleReferencePreview}
                styleReference={styleReference}
                styleVision={styleVision}
                isAnalyzingStyle={isAnalyzingStyle}
                onGenerate={runGenerateStory}
                isGenerating={isGenerating}
                isUploading={isUploading}
              />
              <StoryPanel
                captions={captions}
                onCaptionChange={handleCaptionChange}
                onCaptionsReplace={setCaptions}
                isGenerating={isGenerating}
                viralMode={viralMode}
              />
              <SessionExportBar
                projectId={activeProjectId}
                templateId={templateId}
                captions={captions}
                images={images}
                viralMode={viralMode}
                platformMode={platformMode}
                brandKit={brandKit}
                workflowId={activeWorkflowId}
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
                storyMood={storyBrief?.mood}
                styleReference={styleReference}
                styleVision={styleVision}
                getArtDirection={
                  images.length > 0 ? getArtDirection : undefined
                }
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
                storyMood={storyBrief?.mood}
                styleReference={styleReference}
                styleVision={styleVision}
                getArtDirection={
                  images.length > 0 ? getArtDirection : undefined
                }
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
        storyMood={storyBrief?.mood}
        styleReference={styleReference}
        styleVision={styleVision}
        getArtDirection={images.length > 0 ? getArtDirection : undefined}
        showPlanWatermark={showWatermark}
      />
    </main>
    </DashboardClientShell>
  );
}

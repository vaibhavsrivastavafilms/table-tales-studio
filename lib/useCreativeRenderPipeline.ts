"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildProceduralArtDirections,
  runCreativeRenderPipeline,
  type CreativeRenderInput,
  type PipelineProgressEvent,
} from "@/lib/aiCreativeDirector";
import { enrichArtDirectionsWithEditorial } from "@/lib/editorialTransform";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { suggestAiDesignMode } from "@/lib/aiDesignModes";
import { revokeAllOverlayUrls } from "@/lib/aiDesignCache";
import type { SlideArtDirection } from "@/lib/slideArtDirector";
import type { Captions } from "@/lib/slides";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import { DEFAULT_ANALYSIS } from "@/lib/visualAnalysis";
import type { TemplateId } from "@/lib/templates";
import { useGenerationProgress } from "@/lib/useGenerationProgress";
import { slideStatesKey } from "@/lib/renderProfiler";

type UseCreativeRenderPipelineArgs = {
  enabled: boolean;
  templateId: TemplateId;
  captions: Captions;
  images?: string[];
  mode?: AiDesignModeId;
  analysis?: VisualAnalysis | null;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
};

function mergeProceduralWithExisting(
  procedural: Map<number, SlideArtDirection>,
  prev: Map<number, SlideArtDirection>
): Map<number, SlideArtDirection> {
  const next = new Map<number, SlideArtDirection>();
  for (const [idx, dir] of procedural) {
    const keep = prev.get(idx);
    next.set(idx, {
      ...dir,
      aiOverlay: keep?.aiOverlay ?? dir.aiOverlay,
      reveal: keep?.reveal ?? dir.reveal,
    });
  }
  return next;
}

function commitDirections(
  next: Map<number, SlideArtDirection>,
  ref: React.MutableRefObject<Map<number, SlideArtDirection>>,
  setDirections: React.Dispatch<
    React.SetStateAction<Map<number, SlideArtDirection>>
  >,
  bump: () => void
): void {
  ref.current = next;
  setDirections(next);
  bump();
}

export function useCreativeRenderPipeline({
  enabled,
  templateId,
  captions,
  images = [],
  mode: modeProp,
  analysis,
  styleReference,
  styleVision,
  mood,
}: UseCreativeRenderPipelineArgs) {
  const directionsRef = useRef<Map<number, SlideArtDirection>>(new Map());
  const [directions, setDirections] = useState<Map<number, SlideArtDirection>>(
    () => directionsRef.current
  );
  const [directionsVersion, setDirectionsVersion] = useState(0);
  const bumpDirections = useCallback(() => {
    setDirectionsVersion((v) => v + 1);
  }, []);

  const [status, setStatus] = useState<
    "idle" | "composing" | "ready" | "partial" | "fallback"
  >("idle");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlsRef = useRef<string[]>([]);
  const captionsRef = useRef(captions);
  const gen = useGenerationProgress();
  const genRef = useRef(gen);
  genRef.current = gen;

  const mode = modeProp ?? "doodle-cafe-story";

  useEffect(() => {
    captionsRef.current = captions;
  }, [captions]);

  const captionsKey = useMemo(() => JSON.stringify(captions), [captions]);
  const imagesKey = useMemo(() => images.join("|"), [images]);

  const structuralKey = useMemo(
    () =>
      [
        enabled,
        templateId,
        mode,
        imagesKey,
        analysis?.mood ?? "",
        analysis?.warmth ?? "",
        analysis?.energy ?? "",
        styleReference?.colorPalette?.join(",") ?? "",
        styleVision?.inspiredBySummary ?? "",
        mood ?? "",
      ].join("|"),
    [enabled, templateId, mode, imagesKey, analysis, styleReference, styleVision, mood]
  );

  const getArtDirection = useCallback(
    (slideIndex: number) => directionsRef.current.get(slideIndex) ?? null,
    []
  );

  const applyReveal = useCallback((base: Map<number, SlideArtDirection>, t: number) => {
    const next = new Map<number, SlideArtDirection>();
    for (const [idx, dir] of base) {
      next.set(idx, { ...dir, reveal: Math.min(1, t), phase: t >= 0.92 ? "complete" : dir.phase });
    }
    return next;
  }, []);

  /** Single commit — CSS `builder-hero-reveal` handles transition (no RAF). */
  const publishDirections = useCallback(
    (target: Map<number, SlideArtDirection>, reveal = 1) => {
      commitDirections(
        applyReveal(target, reveal),
        directionsRef,
        setDirections,
        bumpDirections
      );
    },
    [applyReveal, bumpDirections]
  );

  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const overrideRef = useRef<{
    captions?: Captions;
    images?: string[];
    analysis?: VisualAnalysis;
  } | null>(null);

  const buildInput = useCallback((): CreativeRenderInput => {
    const overrides = overrideRef.current;
    return {
      templateId,
      captions: overrides?.captions ?? captionsRef.current,
      images: overrides?.images ?? imagesRef.current,
      analysis: overrides?.analysis ?? analysis ?? DEFAULT_ANALYSIS,
      mode,
      styleReference,
      styleVision,
      mood,
    };
  }, [templateId, analysis, mode, styleReference, styleVision, mood]);

  const handlePipelineProgress = useCallback((event: PipelineProgressEvent) => {
    if (event.type === "stage") {
      genRef.current.setStage(event.stage);
    } else {
      genRef.current.setSlideState(event.slideIndex, event.state);
    }
  }, []);

  const fullDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStructuralRef = useRef(structuralKey);
  const hasDirectionsRef = useRef(false);
  const skipStructuralDebounceRef = useRef(false);

  const runFull = useCallback(async () => {
    if (!enabled) {
      directionsRef.current = new Map();
      setDirections(new Map());
      bumpDirections();
      setStatus("idle");
      setAiAvailable(null);
      hasDirectionsRef.current = false;
      genRef.current.abort();
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    genRef.current.start();
    genRef.current.setStage("analyzing");

    const input = buildInput();
    const procedural = buildProceduralArtDirections(input);
    hasDirectionsRef.current = true;
    publishDirections(procedural, 0.88);
    setStatus("composing");
    genRef.current.markAllGenerating();

    try {
      if (ac.signal.aborted) return;

      genRef.current.setStage("detectingMood");

      const result = await runCreativeRenderPipeline(input, {
        concurrency: 2,
        signal: ac.signal,
        onProgress: handlePipelineProgress,
        onSlide: (dir) => {
          if (ac.signal.aborted) return;
          if (dir.aiOverlay?.overlayUrl) {
            urlsRef.current.push(dir.aiOverlay.overlayUrl);
            if (dir.aiOverlay.source === "ai") setAiAvailable(true);
          }
          const prev = directionsRef.current;
          const next = new Map(prev);
          next.set(dir.slideIndex, {
            ...dir,
            reveal: 1,
            phase: "complete",
          });
          commitDirections(next, directionsRef, setDirections, bumpDirections);
        },
      });

      if (ac.signal.aborted) return;

      const withAi = [...result.values()].filter(
        (d) => d.aiOverlay?.source === "ai"
      ).length;
      publishDirections(result, 1);
      setStatus(
        withAi >= 4 ? "ready" : withAi > 0 ? "partial" : "fallback"
      );
      if (withAi === 0) setAiAvailable(false);
    } catch (err) {
      if (!ac.signal.aborted) {
        console.warn("[TableTales:pipeline] runFull failed — using fallback", {
          message: err instanceof Error ? err.message : String(err),
        });
        const fallback = buildProceduralArtDirections(buildInput());
        publishDirections(fallback, 1);
        setStatus("fallback");
      }
    } finally {
      if (ac.signal.aborted) {
        genRef.current.abort();
      } else {
        genRef.current.finish();
      }
    }
  }, [
    enabled,
    buildInput,
    publishDirections,
    bumpDirections,
    handlePipelineProgress,
  ]);

  const refreshCaptionsOnly = useCallback(() => {
    if (!enabled || !hasDirectionsRef.current) return;

    const input = buildInput();
    setDirections((prev) => {
      const procedural = buildProceduralArtDirections(input);
      const merged = mergeProceduralWithExisting(procedural, prev);
      directionsRef.current = merged;

      if (imagesRef.current.length > 0) {
        const redesigns = new Map(
          [...merged.entries()].flatMap(([idx, d]) =>
            d.redesign ? [[idx, d.redesign] as const] : []
          )
        );
        void enrichArtDirectionsWithEditorial({
          images: imagesRef.current,
          templateId: input.templateId,
          captions: input.captions,
          analysis: input.analysis,
          mode: input.mode,
          styleReference: input.styleReference,
          styleVision: input.styleVision,
          mood: input.mood,
          baseDirections: merged,
          redesigns,
        }).then((enriched) => {
          commitDirections(enriched, directionsRef, setDirections, bumpDirections);
        });
      }

      bumpDirections();
      return merged;
    });
  }, [enabled, buildInput, bumpDirections]);

  useEffect(() => {
    lastStructuralRef.current = structuralKey;
    if (skipStructuralDebounceRef.current) return;
    if (fullDebounceRef.current) clearTimeout(fullDebounceRef.current);
    fullDebounceRef.current = setTimeout(() => {
      void runFull();
    }, 480);
    return () => {
      if (fullDebounceRef.current) clearTimeout(fullDebounceRef.current);
      abortRef.current?.abort();
    };
  }, [structuralKey, runFull]);

  useEffect(() => {
    if (lastStructuralRef.current !== structuralKey) {
      lastStructuralRef.current = structuralKey;
      return;
    }
    if (!enabled || !hasDirectionsRef.current) return;

    if (captionDebounceRef.current) clearTimeout(captionDebounceRef.current);
    captionDebounceRef.current = setTimeout(() => {
      refreshCaptionsOnly();
    }, 850);
    return () => {
      if (captionDebounceRef.current) clearTimeout(captionDebounceRef.current);
    };
  }, [captionsKey, structuralKey, enabled, refreshCaptionsOnly]);

  useEffect(() => {
    return () => {
      revokeAllOverlayUrls(urlsRef.current);
      urlsRef.current = [];
    };
  }, []);

  const panelStatus =
    status === "composing"
      ? ("loading" as const)
      : status === "idle"
        ? ("idle" as const)
        : status;

  const isGenerating = gen.progress.active || status === "composing";

  const slideStatesKeyStable = useMemo(
    () => slideStatesKey(gen.progress.slideStates),
    [gen.progress.slideStates]
  );

  const stableSlideStates = useMemo(
    () => gen.progress.slideStates,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by serialized states
    [slideStatesKeyStable]
  );

  const patchSlide = useCallback(
    (slideIndex: number, direction: SlideArtDirection) => {
      const next = new Map(directionsRef.current);
      next.set(slideIndex, { ...direction, reveal: 1, phase: "complete" });
      commitDirections(next, directionsRef, setDirections, bumpDirections);
    },
    [bumpDirections]
  );

  const animateSlideReveal = useCallback(
    (slideIndex: number, targetReveal = 1) => {
      const dir = directionsRef.current.get(slideIndex);
      if (!dir) return;
      const next = new Map(directionsRef.current);
      next.set(slideIndex, {
        ...dir,
        reveal: targetReveal,
        phase: targetReveal >= 0.92 ? "complete" : "type",
      });
      commitDirections(next, directionsRef, setDirections, bumpDirections);
    },
    [bumpDirections]
  );

  const startGeneration = useCallback(
    async (overrides?: {
      captions?: Captions;
      images?: string[];
      analysis?: VisualAnalysis;
    }) => {
      skipStructuralDebounceRef.current = true;
      overrideRef.current = overrides ?? null;
      try {
        await runFull();
      } finally {
        overrideRef.current = null;
        window.setTimeout(() => {
          skipStructuralDebounceRef.current = false;
        }, 800);
      }
    },
    [runFull]
  );

  return {
    directions,
    directionsVersion,
    getArtDirection,
    status,
    panelStatus,
    aiAvailable,
    regenerate: runFull,
    startGeneration,
    suggestMode: (a: VisualAnalysis) => suggestAiDesignMode(a),
    generationProgress: gen.progress,
    stableSlideStates,
    isGenerating,
    patchSlide,
    animateSlideReveal,
  };
}

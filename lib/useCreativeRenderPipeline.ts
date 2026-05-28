"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildProceduralArtDirections,
  runCreativeRenderPipeline,
  type CreativeRenderInput,
} from "@/lib/aiCreativeDirector";
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

type UseCreativeRenderPipelineArgs = {
  enabled: boolean;
  templateId: TemplateId;
  captions: Captions;
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

export function useCreativeRenderPipeline({
  enabled,
  templateId,
  captions,
  mode: modeProp,
  analysis,
  styleReference,
  styleVision,
  mood,
}: UseCreativeRenderPipelineArgs) {
  const [directions, setDirections] = useState<Map<number, SlideArtDirection>>(
    new Map()
  );
  const [status, setStatus] = useState<
    "idle" | "composing" | "ready" | "partial" | "fallback"
  >("idle");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlsRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const captionsRef = useRef(captions);

  const mode = modeProp ?? "doodle-cafe-story";

  useEffect(() => {
    captionsRef.current = captions;
  }, [captions]);

  const captionsKey = useMemo(() => JSON.stringify(captions), [captions]);

  const structuralKey = useMemo(
    () =>
      [
        enabled,
        templateId,
        mode,
        analysis?.mood ?? "",
        analysis?.warmth ?? "",
        analysis?.energy ?? "",
        styleReference?.colorPalette?.join(",") ?? "",
        styleVision?.inspiredBySummary ?? "",
        mood ?? "",
      ].join("|"),
    [enabled, templateId, mode, analysis, styleReference, styleVision, mood]
  );

  const getArtDirection = useCallback(
    (slideIndex: number) => directions.get(slideIndex) ?? null,
    [directions]
  );

  const applyReveal = useCallback((base: Map<number, SlideArtDirection>, t: number) => {
    const next = new Map<number, SlideArtDirection>();
    for (const [idx, dir] of base) {
      next.set(idx, { ...dir, reveal: Math.min(1, t) });
    }
    return next;
  }, []);

  const animateReveal = useCallback(
    (target: Map<number, SlideArtDirection>) => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      revealRef.current = 0;
      const start = performance.now();
      const duration = 900;

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        revealRef.current = t;
        setDirections(applyReveal(target, t));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [applyReveal]
  );

  const revealRef = useRef(0);

  const buildInput = useCallback((): CreativeRenderInput => {
    return {
      templateId,
      captions: captionsRef.current,
      analysis: analysis ?? DEFAULT_ANALYSIS,
      mode,
      styleReference,
      styleVision,
      mood,
    };
  }, [templateId, analysis, mode, styleReference, styleVision, mood]);

  const fullDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStructuralRef = useRef(structuralKey);
  const hasDirectionsRef = useRef(false);

  const runFull = useCallback(async () => {
    if (!enabled) {
      setDirections(new Map());
      setStatus("idle");
      setAiAvailable(null);
      hasDirectionsRef.current = false;
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const input = buildInput();
    const procedural = buildProceduralArtDirections(input);
    hasDirectionsRef.current = true;
    setDirections(applyReveal(procedural, 0.4));
    setStatus("composing");
    animateReveal(procedural);

    try {
      const result = await runCreativeRenderPipeline(input, {
        concurrency: 2,
        signal: ac.signal,
        onSlide: (dir) => {
          if (ac.signal.aborted) return;
          if (dir.aiOverlay?.overlayUrl) {
            urlsRef.current.push(dir.aiOverlay.overlayUrl);
            if (dir.aiOverlay.source === "ai") setAiAvailable(true);
          }
          setDirections((prev) => {
            const next = new Map(prev);
            next.set(dir.slideIndex, {
              ...dir,
              reveal: Math.max(prev.get(dir.slideIndex)?.reveal ?? 0, 0.85),
            });
            return next;
          });
        },
      });

      if (ac.signal.aborted) return;

      const withAi = [...result.values()].filter(
        (d) => d.aiOverlay?.source === "ai"
      ).length;
      animateReveal(result);
      setStatus(
        withAi >= 4 ? "ready" : withAi > 0 ? "partial" : "fallback"
      );
      if (withAi === 0) setAiAvailable(false);
    } catch {
      if (!ac.signal.aborted) setStatus("fallback");
    }
  }, [enabled, buildInput, applyReveal, animateReveal]);

  const refreshCaptionsOnly = useCallback(() => {
    if (!enabled || !hasDirectionsRef.current) return;

    const input = buildInput();
    const procedural = buildProceduralArtDirections(input);
    setDirections((prev) => mergeProceduralWithExisting(procedural, prev));
  }, [enabled, buildInput]);

  useEffect(() => {
    lastStructuralRef.current = structuralKey;
    if (fullDebounceRef.current) clearTimeout(fullDebounceRef.current);
    fullDebounceRef.current = setTimeout(() => {
      void runFull();
    }, 480);
    return () => {
      if (fullDebounceRef.current) clearTimeout(fullDebounceRef.current);
      abortRef.current?.abort();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
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

  return {
    directions,
    getArtDirection,
    status,
    panelStatus,
    aiAvailable,
    regenerate: runFull,
    suggestMode: (a: VisualAnalysis) => suggestAiDesignMode(a),
  };
}

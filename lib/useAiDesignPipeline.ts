"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildSlideDesignPlan,
  runAiDesignPipeline,
  type AiDesignPipelineInput,
} from "@/lib/aiDesignDirector";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { suggestAiDesignMode } from "@/lib/aiDesignModes";
import { revokeAllOverlayUrls } from "@/lib/aiDesignCache";
import type { AiSlideDesign } from "@/lib/aiOverlayRenderer";
import { SLIDE_KEYS, type Captions } from "@/lib/slides";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import { DEFAULT_ANALYSIS } from "@/lib/visualAnalysis";

type UseAiDesignPipelineArgs = {
  enabled: boolean;
  captions: Captions;
  mode: AiDesignModeId;
  analysis?: VisualAnalysis | null;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
};

export function useAiDesignPipeline({
  enabled,
  captions,
  mode,
  analysis,
  styleReference,
  styleVision,
  mood,
}: UseAiDesignPipelineArgs) {
  const [designs, setDesigns] = useState<Map<number, AiSlideDesign>>(new Map());
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "partial" | "fallback"
  >("idle");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlsRef = useRef<string[]>([]);

  const getDesign = useCallback(
    (slideIndex: number) => designs.get(slideIndex) ?? null,
    [designs]
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async () => {
    if (!enabled) {
      setDesigns(new Map());
      setStatus("idle");
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const resolvedAnalysis = analysis ?? DEFAULT_ANALYSIS;
    const input: AiDesignPipelineInput = {
      mode,
      captions,
      analysis: resolvedAnalysis,
      styleReference,
      styleVision,
      mood,
    };

    const procedural = new Map<number, AiSlideDesign>();
    SLIDE_KEYS.forEach((key, i) => {
      procedural.set(
        i + 1,
        buildSlideDesignPlan(i + 1, captions[key], input)
      );
    });
    setDesigns(procedural);
    setStatus("loading");

    try {
      const result = await runAiDesignPipeline(input, {
        concurrency: 2,
        signal: ac.signal,
        onSlide: (design) => {
          if (ac.signal.aborted) return;
          if (design.overlayUrl) {
            urlsRef.current.push(design.overlayUrl);
            if (design.source === "ai") setAiAvailable(true);
          }
          setDesigns((prev) => {
            const next = new Map(prev);
            next.set(design.slideIndex, design);
            return next;
          });
        },
      });

      if (ac.signal.aborted) return;

      const withAi = [...result.values()].filter((d) => d.source === "ai").length;
      setStatus(
        withAi >= 4 ? "ready" : withAi > 0 ? "partial" : "fallback"
      );
      if (withAi === 0) setAiAvailable(false);
    } catch {
      if (!ac.signal.aborted) setStatus("fallback");
    }
  }, [enabled, captions, mode, analysis, styleReference, styleVision, mood]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void run();
    }, 900);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [run]);

  useEffect(() => {
    return () => {
      revokeAllOverlayUrls(urlsRef.current);
      urlsRef.current = [];
    };
  }, []);

  return {
    designs,
    getDesign,
    status,
    aiAvailable,
    regenerate: run,
    suggestMode: (a: VisualAnalysis) => suggestAiDesignMode(a),
  };
}

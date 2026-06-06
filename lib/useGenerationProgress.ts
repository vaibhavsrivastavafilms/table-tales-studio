"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createIdleProgress,
  stageCeilingPercent,
  stageFloorPercent,
  initialSlideStates,
  type GenerationProgressSnapshot,
  type GenerationStage,
  type SlideRenderState,
} from "@/lib/generationStages";

const MIN_ACTIVE_PERCENT = 3;
const PROGRESS_EMIT_MS = 120;
const ELAPSED_EMIT_MS = 500;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function useGenerationProgress() {
  const [snapshot, setSnapshot] = useState<GenerationProgressSnapshot>(
    createIdleProgress
  );
  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const displayRef = useRef(0);
  const targetRef = useRef(0);
  const stageRef = useRef<GenerationStage>("idle");
  const lastEmitRef = useRef(0);
  const lastElapsedEmitRef = useRef(0);
  const slideStatesRef = useRef(initialSlideStates());

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    startedAtRef.current = performance.now();
    displayRef.current = MIN_ACTIVE_PERCENT;
    targetRef.current = Math.max(
      MIN_ACTIVE_PERCENT,
      stageFloorPercent("analyzing") + 1
    );
    stageRef.current = "analyzing";
    slideStatesRef.current = initialSlideStates();
    lastEmitRef.current = 0;
    lastElapsedEmitRef.current = 0;
    setSnapshot({
      active: true,
      stage: "analyzing",
      displayPercent: MIN_ACTIVE_PERCENT,
      targetPercent: targetRef.current,
      elapsedMs: 0,
      slideStates: slideStatesRef.current,
    });
  }, []);

  const finish = useCallback(() => {
    stopLoop();
    targetRef.current = 100;
    displayRef.current = 100;
    stageRef.current = "ready";
    const renderedStates = new Map(
      [...slideStatesRef.current.entries()].map(([k]) => [k, "rendered" as const])
    );
    slideStatesRef.current = renderedStates;
    setSnapshot((prev) => ({
      ...prev,
      active: false,
      stage: "ready",
      displayPercent: 100,
      targetPercent: 100,
      elapsedMs: performance.now() - startedAtRef.current,
      slideStates: renderedStates,
    }));
    window.setTimeout(() => {
      slideStatesRef.current = initialSlideStates();
      setSnapshot(createIdleProgress());
    }, 2400);
  }, [stopLoop]);

  const abort = useCallback(() => {
    stopLoop();
    stageRef.current = "idle";
    slideStatesRef.current = initialSlideStates();
    setSnapshot(createIdleProgress());
  }, [stopLoop]);

  const setStage = useCallback((stage: GenerationStage, intra = 0) => {
    stageRef.current = stage;
    const floor = stageFloorPercent(stage);
    const ceiling = stageCeilingPercent(stage);
    const t = Math.min(1, Math.max(0, intra));
    targetRef.current = Math.max(
      MIN_ACTIVE_PERCENT,
      Math.round(lerp(floor, ceiling, t))
    );
    setSnapshot((prev) => {
      if (prev.stage === stage && prev.targetPercent === targetRef.current) {
        return prev;
      }
      return {
        ...prev,
        active: stage !== "idle" && stage !== "ready",
        stage,
        targetPercent: targetRef.current,
        displayPercent: Math.max(prev.displayPercent, MIN_ACTIVE_PERCENT),
      };
    });
  }, []);

  const setSlideState = useCallback(
    (slideIndex: number, state: SlideRenderState) => {
      const current = slideStatesRef.current.get(slideIndex);
      if (current === state) return;

      const slideStates = new Map(slideStatesRef.current);
      slideStates.set(slideIndex, state);
      slideStatesRef.current = slideStates;

      setSnapshot((prev) => {
        const rendered = [...slideStates.values()].filter(
          (s) => s === "rendered"
        ).length;
        if (
          prev.stage === "composingSlides" ||
          prev.stage === "renderingTypography"
        ) {
          const intra = rendered / 6;
          targetRef.current = Math.max(
            MIN_ACTIVE_PERCENT,
            Math.round(
              lerp(
                stageFloorPercent(prev.stage),
                stageCeilingPercent(prev.stage),
                intra
              )
            )
          );
        }
        return {
          ...prev,
          slideStates,
          targetPercent: targetRef.current,
        };
      });
    },
    []
  );

  const markAllGenerating = useCallback(() => {
    const slideStates = new Map(slideStatesRef.current);
    let changed = false;
    for (let i = 1; i <= 6; i++) {
      if (slideStates.get(i) !== "generating") {
        slideStates.set(i, "generating");
        changed = true;
      }
    }
    if (!changed) return;
    slideStatesRef.current = slideStates;
    targetRef.current = Math.max(
      targetRef.current,
      stageFloorPercent("artDirecting") + 2
    );
    setSnapshot((prev) => ({
      ...prev,
      slideStates,
      targetPercent: targetRef.current,
      displayPercent: Math.max(prev.displayPercent, MIN_ACTIVE_PERCENT),
    }));
  }, []);

  useEffect(() => {
    if (!snapshot.active) {
      stopLoop();
      return;
    }

    const loop = () => {
      const now = performance.now();
      const elapsed = now - startedAtRef.current;
      const ceiling = stageCeilingPercent(stageRef.current);

      if (
        displayRef.current >= targetRef.current - 0.5 &&
        targetRef.current < ceiling &&
        targetRef.current < 98
      ) {
        const creep = 0.015 + elapsed / 120_000;
        targetRef.current = Math.min(ceiling, targetRef.current + creep);
      }

      const diff = targetRef.current - displayRef.current;
      if (Math.abs(diff) > 0.4) {
        displayRef.current += diff * 0.12;
      } else {
        displayRef.current = targetRef.current;
      }

      const nextPercent = Math.max(
        MIN_ACTIVE_PERCENT,
        Math.round(displayRef.current)
      );
      const roundedTarget = Math.round(targetRef.current);
      const elapsedDelta = now - lastElapsedEmitRef.current;
      const shouldEmitElapsed = elapsedDelta >= ELAPSED_EMIT_MS;
      const shouldEmitPercent = now - lastEmitRef.current >= PROGRESS_EMIT_MS;

      if (shouldEmitPercent || shouldEmitElapsed) {
        setSnapshot((prev) => {
          if (!prev.active) return prev;
          const elapsedChanged =
            shouldEmitElapsed && Math.abs(prev.elapsedMs - elapsed) >= 250;
          const percentChanged = prev.displayPercent !== nextPercent;
          const targetChanged = prev.targetPercent !== roundedTarget;

          if (!percentChanged && !targetChanged && !elapsedChanged) {
            return prev;
          }

          if (shouldEmitElapsed) lastElapsedEmitRef.current = now;
          if (shouldEmitPercent) lastEmitRef.current = now;

          return {
            ...prev,
            displayPercent: nextPercent,
            targetPercent: roundedTarget,
            elapsedMs: elapsedChanged ? elapsed : prev.elapsedMs,
          };
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return stopLoop;
  }, [snapshot.active, stopLoop]);

  const controls = useMemo(
    () => ({
      start,
      finish,
      abort,
      setStage,
      setSlideState,
      markAllGenerating,
    }),
    [start, finish, abort, setStage, setSlideState, markAllGenerating]
  );

  return {
    progress: snapshot,
    ...controls,
  };
}

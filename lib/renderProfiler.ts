"use client";

import { useEffect, useRef } from "react";

const WARN_THRESHOLD = 20;
const WARN_WINDOW_MS = 5_000;

type RenderWindow = {
  count: number;
  windowStart: number;
  warned: boolean;
};

const windows = new Map<string, RenderWindow>();

function trackRender(label: string): void {
  if (process.env.NODE_ENV === "production") return;

  const now = performance.now();
  let entry = windows.get(label);

  if (!entry || now - entry.windowStart > WARN_WINDOW_MS) {
    entry = { count: 0, windowStart: now, warned: false };
    windows.set(label, entry);
  }

  entry.count += 1;
  console.count(`[render] ${label}`);

  if (!entry.warned && entry.count > WARN_THRESHOLD) {
    entry.warned = true;
    console.warn(
      `[render] ${label} rendered ${entry.count}+ times in ${WARN_WINDOW_MS / 1000}s — possible render loop or missing memoization`
    );
  }
}

/** Dev-only render counter + burst warning (>20 renders / 5s). */
export function useRenderDiagnostic(label: string): void {
  const labelRef = useRef(label);
  labelRef.current = label;

  if (process.env.NODE_ENV !== "production") {
    trackRender(labelRef.current);
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    return () => {
      windows.delete(labelRef.current);
    };
  }, []);
}

import type { SlideRenderState } from "@/lib/generationStages";

export function slideStatesKey(
  states: Map<number, SlideRenderState> | undefined
): string {
  if (!states?.size) return "";
  return [...states.entries()]
    .sort(([a], [b]) => a - b)
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

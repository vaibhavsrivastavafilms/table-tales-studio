"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  captionsToProjectPatch,
  hydrateProjectFromCaptions,
  projectToCaptions,
} from "@/lib/story-engine/adapters";
import { captionsAreEqual } from "@/lib/story-engine/captions-equality";
import { enhanceSlideFromInput } from "@/lib/story-engine/creative-director";
import {
  canRedo,
  canUndo,
  compareRevisions,
  redo,
  restoreRevision,
  undo,
} from "@/lib/story-engine/revisions/revision-engine";
import { saveProject } from "@/lib/story-engine/persistence/repository";
import { renderCarousel } from "@/lib/story-engine/render-carousel";
import { scoreCarouselProject } from "@/lib/story-engine/scoring-engine";
import {
  applyFrameworkToProject,
  runStoryEnginePipeline,
  touchProject,
} from "@/lib/story-engine/story-engine";
import { analyzePhotos } from "@/lib/story-engine/photo/photo-intelligence";
import { applyVisualPlanToSlides } from "@/lib/story-engine/visual-planner";
import { trackStoryEngine } from "@/lib/story-engine/telemetry";
import type {
  CarouselProject,
  CarouselRenderModel,
  StoryEngineInput,
  StoryFramework,
} from "@/lib/story-engine/types";
import type { Captions } from "@/lib/slides";
import { createEmptyCaptions } from "@/lib/draftStorage";

export type CarouselProjectStatus =
  | "idle"
  | "generating"
  | "ready"
  | "enhancing"
  | "saving"
  | "error";

/** Stable empty captions for SSR + null project (never recreated per selector call). */
export const EMPTY_CAPTIONS: Captions = createEmptyCaptions();

type CarouselProjectState = {
  project: CarouselProject | null;
  /** Cached at write time in applyProject — do not derive in selectors. */
  captions: Captions;
  renderModel: CarouselRenderModel | null;
  status: CarouselProjectStatus;
  error: string | null;
  selectedSlideIndex: number;
  autosaveEnabled: boolean;
  lastSavedAt: string | null;

  setSelectedSlideIndex: (index: number) => void;
  setProject: (project: CarouselProject | null) => void;
  runGenerateStorytelling: (input: StoryEngineInput) => Promise<CarouselProject | null>;
  enhanceSlide: (slideId: string, instruction: string) => Promise<void>;
  rescore: () => void;
  patchCaptions: (captions: Captions) => void;
  setFramework: (framework: StoryFramework) => void;
  syncPhotos: (urls: string[]) => void;
  undoRevision: () => void;
  redoRevision: () => void;
  restoreRevisionById: (revisionId: string) => void;
  compareRevisionIds: (a: string, b: string) => ReturnType<typeof compareRevisions>;
  persistProject: () => Promise<void>;
  hydrateFromLegacyCaptions: (
    captions: Captions,
    options?: { topic?: string; framework?: StoryFramework }
  ) => void;
};

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncedPhotoUrlsKey = "";

/**
 * Pure projection — only called inside applyProject (write path), never in selectors.
 */
function buildRenderModel(project: CarouselProject): CarouselRenderModel {
  return renderCarousel(project);
}

function applyProject(project: CarouselProject): {
  project: CarouselProject;
  captions: Captions;
  renderModel: CarouselRenderModel;
} {
  const scored = {
    ...project,
    score: project.score ?? scoreCarouselProject(project),
  };
  return {
    project: scored,
    captions: projectToCaptions(scored),
    renderModel: buildRenderModel(scored),
  };
}

function scheduleAutosave(get: () => CarouselProjectState): void {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    const { project, autosaveEnabled, persistProject } = get();
    if (project && autosaveEnabled) void persistProject();
  }, 1200);
}

/** Stable selector — returns cached reference from store state. */
export const selectCaptions = (state: CarouselProjectState): Captions =>
  state.captions;

export const selectCanUndo = (state: CarouselProjectState): boolean =>
  state.project ? canUndo(state.project) : false;

export const selectCanRedo = (state: CarouselProjectState): boolean =>
  state.project ? canRedo(state.project) : false;

export const useCarouselProjectStore = create<CarouselProjectState>()(
  subscribeWithSelector((set, get) => ({
    project: null,
    captions: EMPTY_CAPTIONS,
    renderModel: null,
    status: "idle",
    error: null,
    selectedSlideIndex: 0,
    autosaveEnabled: true,
    lastSavedAt: null,

    setSelectedSlideIndex: (index) => set({ selectedSlideIndex: index }),

    setProject: (project) => {
      if (!project) {
        set({
          project: null,
          captions: EMPTY_CAPTIONS,
          renderModel: null,
          status: "idle",
          error: null,
        });
        return;
      }
      const applied = applyProject(project);
      set({ ...applied, status: "ready", error: null });
      scheduleAutosave(get);
    },

    hydrateFromLegacyCaptions: (captions, options) => {
      const project = hydrateProjectFromCaptions(captions, options);
      const applied = applyProject(project);
      set({ ...applied, status: "ready" });
    },

    runGenerateStorytelling: async (input) => {
      set({ status: "generating", error: null });
      trackStoryEngine("story.generate.start");
      try {
        const res = await fetch("/api/story-engine/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = (await res.json()) as {
          project?: CarouselProject;
          error?: string;
        };

        if (!res.ok || !data.project) {
          const local = runStoryEnginePipeline(input);
          const applied = applyProject(local.project);
          set({ ...applied, status: "ready" });
          trackStoryEngine("story.generate.success", { source: "local" });
          return applied.project;
        }

        const applied = applyProject(data.project);
        set({ ...applied, status: "ready" });
        trackStoryEngine("story.generate.success", { source: "api" });
        scheduleAutosave(get);
        return applied.project;
      } catch (e) {
        const local = runStoryEnginePipeline(input);
        const applied = applyProject(local.project);
        set({
          ...applied,
          status: "ready",
          error: e instanceof Error ? e.message : "Used offline story engine",
        });
        trackStoryEngine("story.generate.error");
        return applied.project;
      }
    },

    enhanceSlide: async (slideId, instruction) => {
      const { project } = get();
      if (!project || !instruction.trim()) return;

      set({ status: "enhancing" });
      trackStoryEngine("story.enhance.start");
      try {
        const res = await fetch("/api/story-engine/enhance-slide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project, slideId, instruction }),
        });
        const data = (await res.json()) as { project?: CarouselProject };

        const next = data.project
          ? data.project
          : enhanceSlideFromInput({ project, slideId, instruction });

        const applied = applyProject(next);
        set({ ...applied, status: "ready" });
        trackStoryEngine("story.enhance.success");
        scheduleAutosave(get);
      } catch {
        const next = enhanceSlideFromInput({ project, slideId, instruction });
        const applied = applyProject(next);
        set({ ...applied, status: "ready" });
      }
    },

    rescore: () => {
      const { project } = get();
      if (!project) return;
      const scored = { ...project, score: scoreCarouselProject(project) };
      const applied = applyProject(scored);
      set(applied);
      trackStoryEngine("story.score");
    },

    patchCaptions: (captions) => {
      const { project, captions: current } = get();
      if (!project) {
        get().hydrateFromLegacyCaptions(captions);
        return;
      }
      if (captionsAreEqual(current, captions)) return;

      const patched = captionsToProjectPatch(project, captions);
      const applied = applyProject(touchProject(patched));
      set(applied);
      scheduleAutosave(get);
    },

    setFramework: (framework) => {
      const { project } = get();
      if (!project) return;
      const next = applyFrameworkToProject(project, framework);
      const applied = applyProject(next);
      set(applied);
      trackStoryEngine("framework.change", { framework });
      scheduleAutosave(get);
    },

    syncPhotos: (urls) => {
      const { project } = get();
      if (!project || urls.length === 0) return;

      const urlsKey = urls.join("\0");
      if (urlsKey === lastSyncedPhotoUrlsKey && project.photos.length > 0) {
        return;
      }
      lastSyncedPhotoUrlsKey = urlsKey;

      const analysis = analyzePhotos(urls);
      const slides = applyVisualPlanToSlides(project.slides, analysis.assets);
      const applied = applyProject(
        touchProject({
          ...project,
          photos: analysis.assets,
          slides,
        })
      );
      set(applied);
      scheduleAutosave(get);
    },

    undoRevision: () => {
      const { project } = get();
      if (!project) return;
      const applied = applyProject(undo(project));
      set(applied);
      trackStoryEngine("revision.undo");
    },

    redoRevision: () => {
      const { project } = get();
      if (!project) return;
      const applied = applyProject(redo(project));
      set(applied);
      trackStoryEngine("revision.redo");
    },

    restoreRevisionById: (revisionId) => {
      const { project } = get();
      if (!project) return;
      const applied = applyProject(restoreRevision(project, revisionId));
      set(applied);
      trackStoryEngine("revision.restore");
    },

    compareRevisionIds: (a, b) => {
      const { project } = get();
      if (!project) return null;
      return compareRevisions(project, a, b);
    },

    persistProject: async () => {
      const { project } = get();
      if (!project) return;
      set({ status: "saving" });
      try {
        await saveProject(project);
        set({
          status: "ready",
          lastSavedAt: new Date().toISOString(),
        });
        trackStoryEngine("project.save");
      } catch (e) {
        set({
          status: "error",
          error: e instanceof Error ? e.message : "Save failed",
        });
      }
    },
  }))
);

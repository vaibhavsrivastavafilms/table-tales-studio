"use client";

import { create } from "zustand";
import {
  captionsToProjectPatch,
  projectToCaptions,
} from "@/lib/story-engine/adapters";
import { enhanceSlideFromInput } from "@/lib/story-engine/creative-director";
import { renderCarousel } from "@/lib/story-engine/render-carousel";
import { scoreCarouselProject } from "@/lib/story-engine/scoring-engine";
import { runStoryEnginePipeline } from "@/lib/story-engine/story-engine";
import type {
  CarouselProject,
  CarouselRenderModel,
  StoryEngineInput,
} from "@/lib/story-engine/types";
import type { Captions } from "@/lib/slides";

export type CarouselProjectStatus =
  | "idle"
  | "generating"
  | "ready"
  | "enhancing"
  | "error";

type CarouselProjectState = {
  project: CarouselProject | null;
  renderModel: CarouselRenderModel | null;
  captions: Captions | null;
  status: CarouselProjectStatus;
  error: string | null;
  selectedSlideIndex: number;

  setSelectedSlideIndex: (index: number) => void;
  setProject: (project: CarouselProject | null) => void;
  runGenerateStorytelling: (input: StoryEngineInput) => Promise<CarouselProject | null>;
  enhanceSlide: (slideId: string, instruction: string) => Promise<void>;
  rescore: () => void;
  syncCaptionsFromProject: () => void;
  patchCaptions: (captions: Captions) => void;
};

function applyProject(project: CarouselProject): {
  project: CarouselProject;
  renderModel: CarouselRenderModel;
  captions: Captions;
} {
  const scored = {
    ...project,
    score: project.score ?? scoreCarouselProject(project),
  };
  const renderModel = renderCarousel(scored);
  const captions = projectToCaptions(scored);
  return { project: scored, renderModel, captions };
}

export const useCarouselProjectStore = create<CarouselProjectState>((set, get) => ({
  project: null,
  renderModel: null,
  captions: null,
  status: "idle",
  error: null,
  selectedSlideIndex: 0,

  setSelectedSlideIndex: (index) => set({ selectedSlideIndex: index }),

  setProject: (project) => {
    if (!project) {
      set({
        project: null,
        renderModel: null,
        captions: null,
        status: "idle",
        error: null,
      });
      return;
    }
    const applied = applyProject(project);
    set({
      ...applied,
      status: "ready",
      error: null,
    });
  },

  runGenerateStorytelling: async (input) => {
    set({ status: "generating", error: null });
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
        return applied.project;
      }

      const applied = applyProject(data.project);
      set({ ...applied, status: "ready" });
      return applied.project;
    } catch (e) {
      const local = runStoryEnginePipeline(input);
      const applied = applyProject(local.project);
      set({
        ...applied,
        status: "ready",
        error: e instanceof Error ? e.message : "Used offline story engine",
      });
      return applied.project;
    }
  },

  enhanceSlide: async (slideId, instruction) => {
    const { project } = get();
    if (!project || !instruction.trim()) return;

    set({ status: "enhancing" });
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
    } catch {
      const next = enhanceSlideFromInput({ project, slideId, instruction });
      const applied = applyProject(next);
      set({ ...applied, status: "ready" });
    }
  },

  rescore: () => {
    const { project } = get();
    if (!project) return;
    const applied = applyProject(project);
    set(applied);
  },

  syncCaptionsFromProject: () => {
    const { project } = get();
    if (!project) return;
    set({ captions: projectToCaptions(project) });
  },

  patchCaptions: (captions) => {
    const { project } = get();
    if (!project) {
      set({ captions });
      return;
    }
    const patched = captionsToProjectPatch(project, captions);
    const applied = applyProject(patched);
    set(applied);
  },
}));

import type { Captions } from "@/lib/slides";
import { projectToCaptions } from "@/lib/story-engine/adapters";
import { loadProject, saveProject } from "@/lib/story-engine/persistence/repository";
import type { CarouselProject } from "@/lib/story-engine/types";
import { loadDraft, saveDraft } from "@/lib/draftStorage";
import {
  createProject,
  getLatestProject,
  getProject,
  updateProject,
  type Project,
} from "@/lib/projects";
import { recordHealthEvent } from "@/lib/health";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { TemplateId } from "@/lib/templates";

export type EditorState = {
  captions: Captions;
  templateId: TemplateId;
  images: string[];
};

export async function loadEditorState(
  projectId?: string | null
): Promise<{ project: Project | null; state: EditorState; source: "cloud" | "local" }> {
  if (isSupabaseConfigured()) {
    try {
      const project = projectId
        ? await getProject(projectId)
        : await getLatestProject();

      if (project) {
        return {
          project,
          state: {
            captions: project.captions,
            templateId: project.templateId,
            images: project.images,
          },
          source: "cloud",
        };
      }
    } catch {
      const { logMonitoring } = await import("@/lib/monitoring");
      logMonitoring("cloud_load_failed", "warn");
    }
  }

  const draft = loadDraft();
  if (draft) {
    return {
      project: null,
      state: {
        captions: draft.captions,
        templateId: draft.templateId,
        images: draft.images,
      },
      source: "local",
    };
  }

  return {
    project: null,
    state: {
      captions: {
        hook: "",
        slide1: "",
        slide2: "",
        slide3: "",
        slide4: "",
        cta: "",
      },
      templateId: "street-food",
      images: [],
    },
    source: "local",
  };
}

export async function ensureProject(
  projectId: string | null,
  templateId: TemplateId
): Promise<Project> {
  if (projectId && isSupabaseConfigured()) {
    const existing = await getProject(projectId);
    if (existing) return existing;
  }

  if (isSupabaseConfigured()) {
    return createProject("Untitled Carousel", templateId);
  }

  throw new Error("Cannot create cloud project without Supabase");
}

/** Persist CarouselProject JSON alongside legacy draft (Phase B bridge). */
export async function persistCarouselProject(
  carouselProject: CarouselProject
): Promise<void> {
  await saveProject(carouselProject);
}

export async function loadCarouselProject(
  id: string
): Promise<CarouselProject | null> {
  return loadProject(id);
}

export async function persistEditorState(
  projectId: string | null,
  state: EditorState,
  carouselProject?: CarouselProject | null
): Promise<Project | null> {
  saveDraft({
    captions: carouselProject
      ? projectToCaptions(carouselProject)
      : state.captions,
    templateId: state.templateId,
    images: state.images,
  });

  if (carouselProject) {
    await persistCarouselProject(carouselProject);
  }

  if (!isSupabaseConfigured() || !projectId) return null;

  try {
    return await updateProject(projectId, {
      captions: state.captions,
      templateId: state.templateId,
      images: state.images,
    });
  } catch {
    recordHealthEvent("syncTimeouts");
    const { logMonitoring } = await import("@/lib/monitoring");
    logMonitoring("cloud_save_failed", "warn");
    return null;
  }
}

import type { CarouselProject } from "@/lib/story-engine/types";
import { safeParseCarouselProject } from "@/lib/story-engine/schema";
import { migrateCarouselProject } from "@/lib/story-engine/persistence/migrate";

export type ProjectListItem = {
  id: string;
  title: string;
  framework: string;
  updatedAt: string;
};

export interface ProjectRepository {
  saveProject(project: CarouselProject): Promise<void>;
  loadProject(id: string): Promise<CarouselProject | null>;
  updateProject(project: CarouselProject): Promise<void>;
  duplicateProject(id: string): Promise<CarouselProject | null>;
  deleteProject(id: string): Promise<void>;
  listProjects(): Promise<ProjectListItem[]>;
}

const STORAGE_KEY = "tts:story-engine:projects";
const INDEX_KEY = "tts:story-engine:project-index";

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

function projectKey(id: string): string {
  return `${STORAGE_KEY}:${id}`;
}

function persistableProject(project: CarouselProject): CarouselProject {
  return {
    id: project.id,
    version: project.version,
    brief: project.brief,
    story: project.story,
    slides: project.slides,
    score: project.score,
    revisions: project.revisions,
    photos: project.photos,
    revisionCursor: project.revisionCursor,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export class LocalStorageRepository implements ProjectRepository {
  async saveProject(project: CarouselProject): Promise<void> {
    const p = persistableProject({
      ...project,
      updatedAt: new Date().toISOString(),
    });
    if (typeof window === "undefined") return;
    localStorage.setItem(projectKey(p.id), JSON.stringify(p));
    const ids = readIndex();
    if (!ids.includes(p.id)) {
      writeIndex([p.id, ...ids]);
    }
  }

  async loadProject(id: string): Promise<CarouselProject | null> {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(projectKey(id));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const migrated = migrateCarouselProject(parsed);
      const result = safeParseCarouselProject(migrated);
      return result.success
        ? (result.data as CarouselProject)
        : null;
    } catch {
      return null;
    }
  }

  async updateProject(project: CarouselProject): Promise<void> {
    return this.saveProject(project);
  }

  async duplicateProject(id: string): Promise<CarouselProject | null> {
    const source = await this.loadProject(id);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: CarouselProject = {
      ...JSON.parse(JSON.stringify(source)),
      id: `${source.id}_copy_${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
      revisions: [],
      revisionCursor: -1,
    };
    await this.saveProject(copy);
    return copy;
  }

  async deleteProject(id: string): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(projectKey(id));
    writeIndex(readIndex().filter((x) => x !== id));
  }

  async listProjects(): Promise<ProjectListItem[]> {
    const items: ProjectListItem[] = [];
    for (const id of readIndex()) {
      const p = await this.loadProject(id);
      if (p) {
        items.push({
          id: p.id,
          title: p.brief.topic,
          framework: p.story.framework,
          updatedAt: p.updatedAt,
        });
      }
    }
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

/** Placeholder — wire Supabase `carousel_projects` table when ready. */
export class SupabaseRepository implements ProjectRepository {
  constructor(private readonly inner: ProjectRepository = new LocalStorageRepository()) {}

  async saveProject(project: CarouselProject): Promise<void> {
    return this.inner.saveProject(project);
  }

  async loadProject(id: string): Promise<CarouselProject | null> {
    return this.inner.loadProject(id);
  }

  async updateProject(project: CarouselProject): Promise<void> {
    return this.inner.updateProject(project);
  }

  async duplicateProject(id: string): Promise<CarouselProject | null> {
    return this.inner.duplicateProject(id);
  }

  async deleteProject(id: string): Promise<void> {
    return this.inner.deleteProject(id);
  }

  async listProjects(): Promise<ProjectListItem[]> {
    return this.inner.listProjects();
  }
}

let defaultRepo: ProjectRepository | null = null;

export function getProjectRepository(): ProjectRepository {
  if (!defaultRepo) {
    defaultRepo = new LocalStorageRepository();
  }
  return defaultRepo;
}

export function setProjectRepository(repo: ProjectRepository): void {
  defaultRepo = repo;
}

export async function saveProject(project: CarouselProject): Promise<void> {
  return getProjectRepository().saveProject(project);
}

export async function loadProject(id: string): Promise<CarouselProject | null> {
  return getProjectRepository().loadProject(id);
}

export async function updateProject(project: CarouselProject): Promise<void> {
  return getProjectRepository().updateProject(project);
}

export async function duplicateProject(
  id: string
): Promise<CarouselProject | null> {
  return getProjectRepository().duplicateProject(id);
}

export async function deleteProject(id: string): Promise<void> {
  return getProjectRepository().deleteProject(id);
}

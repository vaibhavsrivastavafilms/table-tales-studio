import type {
  CarouselProject,
  CarouselScore,
  ProjectRevision,
  RevisionTimelineEntry,
} from "@/lib/story-engine/types";

function revisionId(): string {
  return `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function cloneProject(project: CarouselProject): CarouselProject {
  return JSON.parse(JSON.stringify(project)) as CarouselProject;
}

/** Record a revision after an enhancement or major edit. */
export function appendRevision(
  project: CarouselProject,
  instruction: string,
  options?: { label?: string; score?: CarouselScore }
): CarouselProject {
  const snapshot = cloneProject({
    ...project,
    revisions: [],
    revisionCursor: -1,
  });
  const revision: ProjectRevision = {
    id: revisionId(),
    timestamp: new Date().toISOString(),
    instruction,
    snapshot,
    score: options?.score ?? project.score,
    label: options?.label,
  };
  const cursor = project.revisionCursor;
  const trimmed =
    cursor >= 0 && cursor < project.revisions.length - 1
      ? project.revisions.slice(0, cursor + 1)
      : project.revisions;
  const revisions = [...trimmed, revision];
  return {
    ...project,
    revisions,
    revisionCursor: revisions.length - 1,
    updatedAt: new Date().toISOString(),
  };
}

export function undo(project: CarouselProject): CarouselProject {
  if (project.revisionCursor <= 0) return project;
  const nextCursor = project.revisionCursor - 1;
  const rev = project.revisions[nextCursor];
  if (!rev) return project;
  return {
    ...rev.snapshot,
    revisions: project.revisions,
    revisionCursor: nextCursor,
    score: rev.score ?? rev.snapshot.score,
    updatedAt: new Date().toISOString(),
  };
}

export function redo(project: CarouselProject): CarouselProject {
  if (project.revisionCursor >= project.revisions.length - 1) return project;
  const nextCursor = project.revisionCursor + 1;
  const rev = project.revisions[nextCursor];
  if (!rev) return project;
  return {
    ...rev.snapshot,
    revisions: project.revisions,
    revisionCursor: nextCursor,
    score: rev.score ?? rev.snapshot.score,
    updatedAt: new Date().toISOString(),
  };
}

export function restoreRevision(
  project: CarouselProject,
  revisionId: string
): CarouselProject {
  const index = project.revisions.findIndex((r) => r.id === revisionId);
  if (index < 0) return project;
  const rev = project.revisions[index];
  return {
    ...rev.snapshot,
    revisions: project.revisions,
    revisionCursor: index,
    score: rev.score ?? rev.snapshot.score,
    updatedAt: new Date().toISOString(),
  };
}

export type RevisionDiff = {
  revisionA: ProjectRevision;
  revisionB: ProjectRevision;
  headlineChanges: { slideId: string; before: string; after: string }[];
  scoreDelta?: number;
};

export function compareRevisions(
  project: CarouselProject,
  revisionIdA: string,
  revisionIdB: string
): RevisionDiff | null {
  const a = project.revisions.find((r) => r.id === revisionIdA);
  const b = project.revisions.find((r) => r.id === revisionIdB);
  if (!a || !b) return null;
  const headlineChanges: RevisionDiff["headlineChanges"] = [];
  for (const slideB of b.snapshot.slides) {
    const slideA = a.snapshot.slides.find((s) => s.id === slideB.id);
    if (slideA && slideA.headline !== slideB.headline) {
      headlineChanges.push({
        slideId: slideB.id,
        before: slideA.headline,
        after: slideB.headline,
      });
    }
  }
  const scoreDelta =
    a.score && b.score ? b.score.overall - a.score.overall : undefined;
  return { revisionA: a, revisionB: b, headlineChanges, scoreDelta };
}

export function buildRevisionTimeline(
  project: CarouselProject
): RevisionTimelineEntry[] {
  return project.revisions.map((revision, index) => ({
    revision,
    index,
    isCurrent: index === project.revisionCursor,
    isFuture: index > project.revisionCursor,
  }));
}

export function canUndo(project: CarouselProject): boolean {
  return project.revisionCursor > 0;
}

export function canRedo(project: CarouselProject): boolean {
  return (
    project.revisions.length > 0 &&
    project.revisionCursor < project.revisions.length - 1
  );
}

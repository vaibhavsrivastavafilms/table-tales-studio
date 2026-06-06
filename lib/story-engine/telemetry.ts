import { logMonitoring } from "@/lib/monitoring";

export type StoryEngineEvent =
  | "story.generate.start"
  | "story.generate.success"
  | "story.generate.error"
  | "story.enhance.start"
  | "story.enhance.success"
  | "story.score"
  | "project.save"
  | "project.load"
  | "revision.undo"
  | "revision.redo"
  | "revision.restore"
  | "framework.change";

export function trackStoryEngine(
  event: StoryEngineEvent,
  payload?: Record<string, string | number | boolean>
): void {
  logMonitoring("story_engine", "info", { event, ...payload });
}

/** Future collaboration / realtime hooks */
export type CollaborationHook = {
  onProjectUpdated?: (projectId: string) => void;
  onSlideLocked?: (slideId: string, userId: string) => void;
};

let collaborationHooks: CollaborationHook = {};

export function setCollaborationHooks(hooks: CollaborationHook): void {
  collaborationHooks = hooks;
}

export function emitProjectUpdated(projectId: string): void {
  collaborationHooks.onProjectUpdated?.(projectId);
}

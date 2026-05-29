import type { SlideArtDirection } from "@/lib/slideArtDirector";
import { MAX_CREATIVE_HISTORY } from "@/lib/creativeActions";

export type SlideCreativeSession = {
  creativeHistory: string[];
  baseline: SlideArtDirection | null;
  undoStack: SlideArtDirection[];
};

export function emptyCreativeSession(): SlideCreativeSession {
  return {
    creativeHistory: [],
    baseline: null,
    undoStack: [],
  };
}

export function pushCreativeHistory(
  session: SlideCreativeSession,
  prompt: string
): SlideCreativeSession {
  return {
    ...session,
    creativeHistory: [...session.creativeHistory, prompt].slice(
      -MAX_CREATIVE_HISTORY
    ),
  };
}

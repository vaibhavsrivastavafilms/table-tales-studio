export type FeedbackSignal = {
  exportId: string;
  performedWell: boolean | null;
  captionUseful: boolean | null;
  improveSuggestions: boolean | null;
  at: string;
};

const STORAGE_KEY = "tts:ai:feedback";

export function loadFeedbackSignals(): FeedbackSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FeedbackSignal[];
  } catch {
    return [];
  }
}

export function saveFeedbackSignal(
  signal: Omit<FeedbackSignal, "at">
): FeedbackSignal {
  const entry: FeedbackSignal = { ...signal, at: new Date().toISOString() };
  const next = [entry, ...loadFeedbackSignals()].slice(0, 50);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return entry;
}

export function getPersonalizationHints(): {
  preferStrongerHooks: boolean;
  preferShorterCaptions: boolean;
} {
  const signals = loadFeedbackSignals();
  const recent = signals.slice(0, 10);
  const improveCount = recent.filter((s) => s.improveSuggestions === true).length;
  const poorCaption = recent.filter((s) => s.captionUseful === false).length;

  return {
    preferStrongerHooks: improveCount >= 3,
    preferShorterCaptions: poorCaption >= 2,
  };
}

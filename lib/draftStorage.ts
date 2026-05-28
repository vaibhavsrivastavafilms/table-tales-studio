import type { Captions } from "@/lib/slides";
import { DEFAULT_TEMPLATE_ID, type TemplateId } from "@/lib/templates";
import {
  isCaptionsPayloadValid,
  parseTemplateId,
  sanitizeCaptions,
  sanitizeImageUrlList,
} from "@/lib/validation";

const DRAFT_KEY = "table-tales-studio-draft";

export type StudioDraft = {
  captions: Captions;
  templateId: TemplateId;
  images: string[];
  savedAt: number;
};

export function loadDraft(): StudioDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudioDraft;
    if (!parsed.captions || !Array.isArray(parsed.images)) return null;
    const captions = sanitizeCaptions(parsed.captions);
    if (!isCaptionsPayloadValid(captions)) return null;
    return {
      captions,
      templateId: parseTemplateId(parsed.templateId),
      images: sanitizeImageUrlList(parsed.images),
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: Omit<StudioDraft, "savedAt">): void {
  if (typeof window === "undefined") return;

  try {
    const captions = sanitizeCaptions(draft.captions);
    if (!isCaptionsPayloadValid(captions)) return;

    const payload: StudioDraft = {
      captions,
      templateId: parseTemplateId(draft.templateId),
      images: sanitizeImageUrlList(draft.images),
      savedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Draft save failed (storage may be full):", error);
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

export async function filesToDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    )
  );
}

export function createEmptyCaptions(): Captions {
  return {
    hook: "",
    slide1: "",
    slide2: "",
    slide3: "",
    slide4: "",
    cta: "",
  };
}

export function draftTemplateId(
  stored?: TemplateId | string
): TemplateId {
  if (
    stored === "street-food" ||
    stored === "cinematic-dark" ||
    stored === "founder-story" ||
    stored === "luxury-dining"
  ) {
    return stored;
  }
  return DEFAULT_TEMPLATE_ID;
}

import {
  countExportableSlides,
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
} from "@/lib/exportSlides";
import { SLIDE_COUNT, SLIDE_KEYS, type Captions } from "@/lib/slides";

export type ConfidenceBadge =
  | "slides-validated"
  | "export-optimized"
  | "cloud-synced"
  | "instagram-ready";

export type PreflightIssue = {
  message: string;
  hint: string;
};

export type PreflightResult =
  | {
      ok: true;
      exportable: number;
      expectedTotal: number;
      badges: ConfidenceBadge[];
    }
  | {
      ok: false;
      issues: PreflightIssue[];
      badges: ConfidenceBadge[];
    };

function isValidDataUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (url.startsWith("data:")) {
    return url.length > 64 && !url.includes("undefined");
  }
  if (url.startsWith("blob:")) return true;
  return url.startsWith("http://") || url.startsWith("https://");
}

async function imageReady(url: string): Promise<boolean> {
  if (!isValidDataUrl(url)) return false;
  if (typeof window === "undefined") return true;

  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(false), 8000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.src = url;
  });
}

function slideHasCaption(captions: Captions, index: number): boolean {
  const key = SLIDE_KEYS[index];
  return Boolean(key && captions[key]?.trim());
}

export async function runExportPreflight(input: {
  images: string[];
  captions: Captions;
  slideRefs: (HTMLElement | null)[];
  expectedTotal: number;
  cloudSynced?: boolean;
}): Promise<PreflightResult> {
  const issues: PreflightIssue[] = [];
  const badges: ConfidenceBadge[] = [];
  const exportable = countExportableSlides(input.slideRefs);

  if (exportable === 0) {
    issues.push({
      message: "Preview slides are not mounted yet.",
      hint: "Scroll the carousel preview, wait a moment, then export again.",
    });
  }

  if (input.images.length === 0) {
    issues.push({
      message: "No images uploaded for this carousel.",
      hint: "Upload at least one food photo before exporting.",
    });
  }

  const sampleUrls = input.images.slice(0, Math.min(4, input.images.length));
  const loadResults = await Promise.all(sampleUrls.map(imageReady));
  const failedLoads = loadResults.filter((ok) => !ok).length;

  if (failedLoads > 0 && input.images.length > 0) {
    issues.push({
      message: `${failedLoads} image${failedLoads > 1 ? "s" : ""} may not be fully loaded.`,
      hint: "Re-upload smaller JPG/PNG files or wait for thumbnails to finish.",
    });
  }

  const captionCount = SLIDE_KEYS.filter((_, i) =>
    slideHasCaption(input.captions, i)
  ).length;

  if (captionCount === 0) {
    issues.push({
      message: "No captions on slides yet.",
      hint: "Generate an AI story or add text — exports still work but slides may look empty.",
    });
  }

  for (let i = 0; i < Math.min(input.expectedTotal, SLIDE_COUNT); i++) {
    const el = input.slideRefs[i];
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) {
      issues.push({
        message: `Slide ${i + 1} preview dimensions look unstable.`,
        hint: "Keep the preview panel visible, then retry export.",
      });
      break;
    }
  }

  if (issues.some((x) => x.message.includes("mounted"))) {
    /* blocking */
  } else if (exportable > 0) {
    badges.push("slides-validated");
  }

  if (exportable > 0 && failedLoads === 0) {
    badges.push("export-optimized");
  }

  if (input.cloudSynced) {
    badges.push("cloud-synced");
  }

  if (
    exportable > 0 &&
    failedLoads === 0 &&
    issues.length === 0
  ) {
    badges.push("instagram-ready");
  }

  if (
    issues.some(
      (x) =>
        x.message.includes("mounted") ||
        x.message.includes("No images")
    )
  ) {
    return { ok: false, issues, badges };
  }

  return {
    ok: true,
    exportable,
    expectedTotal: input.expectedTotal,
    badges,
  };
}

export const EXPORT_SPEC_LABEL = `${EXPORT_WIDTH}×${EXPORT_HEIGHT} · 4:5`;

import { renderProjectToDocument } from "@/lib/carousel-renderer/document-adapter";
import {
  CAROUSEL_EXPORT_PIXEL_RATIO,
  exportCarouselSlidesToPng,
  type CarouselExportProgress,
} from "@/lib/carousel-renderer/export-png";
import type { CarouselRenderProject } from "@/lib/carousel-renderer/project-types";
import type { CarouselDocument } from "@/lib/carousel-renderer/types";

export {
  CAROUSEL_EXPORT_PIXEL_RATIO,
  exportCarouselSlidesToPng,
  type CarouselExportProgress,
} from "@/lib/carousel-renderer/export-png";

export type PngSlideExport = {
  filename: string;
  dataUrl: string;
  index: number;
};

export type RenderSlidesToPngOptions = {
  elements: (HTMLElement | null)[];
  document?: CarouselDocument;
  onProgress?: (p: CarouselExportProgress) => void;
  signal?: AbortSignal;
};

/**
 * Export carousel slides as PNG (1080×1350 Instagram 4:5).
 * Output naming: slide-1.png, slide-2.png, …
 */
export async function renderSlidesToPNG(
  options: RenderSlidesToPngOptions
): Promise<PngSlideExport[]> {
  const dataUrls = await exportCarouselSlidesToPng(options.elements, {
    onProgress: options.onProgress,
    signal: options.signal,
  });

  return dataUrls.map((dataUrl, i) => ({
    filename: `slide-${i + 1}.png`,
    dataUrl,
    index: i + 1,
  }));
}

export function slideFilename(index: number): string {
  return `slide-${index}.png`;
}

/** Prepare document + filenames from render project (for DOM export rack). */
export function preparePngExport(project: CarouselRenderProject): {
  project: CarouselRenderProject;
  document: CarouselDocument;
  filenames: string[];
} {
  const document = renderProjectToDocument(project);
  return {
    project,
    document,
    filenames: document.slides.map((s) => slideFilename(s.index)),
  };
}

export async function downloadPngSlides(exports: PngSlideExport[]): Promise<void> {
  for (const item of exports) {
    const a = document.createElement("a");
    a.href = item.dataUrl;
    a.download = item.filename;
    a.click();
    await new Promise((r) => setTimeout(r, 120));
  }
}

/** Server-safe: render project to PNG data URLs when DOM nodes are provided client-side. */
export async function renderProjectToPNG(
  project: CarouselRenderProject,
  elements: (HTMLElement | null)[],
  options?: Omit<RenderSlidesToPngOptions, "elements">
): Promise<PngSlideExport[]> {
  return renderSlidesToPNG({
    ...options,
    elements,
    document: renderProjectToDocument(project),
  });
}

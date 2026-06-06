import { toPng } from "html-to-image";
import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
  type CarouselDocument,
} from "@/lib/carousel-renderer/types";

export const CAROUSEL_EXPORT_PIXEL_RATIO = 2;

export type CarouselExportProgress = {
  current: number;
  total: number;
};

/**
 * Export Carousel JSON → PNG data URLs (1080×1350 Instagram 4:5).
 * Requires mounted DOM nodes from CarouselRendererSlide.
 */
export async function exportCarouselSlidesToPng(
  elements: (HTMLElement | null)[],
  options?: {
    onProgress?: (p: CarouselExportProgress) => void;
    signal?: AbortSignal;
  }
): Promise<string[]> {
  const urls: string[] = [];
  const total = elements.length;

  for (let i = 0; i < total; i++) {
    if (options?.signal?.aborted) throw new Error("Export cancelled");
    const el = elements[i];
    if (!el) {
      options?.onProgress?.({ current: i + 1, total });
      continue;
    }

    await waitForImages(el);
    const dataUrl = await toPng(el, {
      width: CAROUSEL_WIDTH,
      height: CAROUSEL_HEIGHT,
      pixelRatio: CAROUSEL_EXPORT_PIXEL_RATIO,
      cacheBust: true,
      quality: 1,
    });
    urls.push(dataUrl);
    options?.onProgress?.({ current: i + 1, total });
  }

  return urls;
}

export function slideCountForExport(document: CarouselDocument): number {
  return document.slides.length;
}

async function waitForImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

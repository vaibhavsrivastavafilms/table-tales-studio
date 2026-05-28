import { toJpeg, toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { isBrowser } from "@/lib/browser";
import { SLIDE_COUNT } from "@/lib/slides";
import type { ExportFormat } from "@/lib/validation";

export type { ExportFormat } from "@/lib/validation";

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;
export const EXPORT_PIXEL_RATIO = 2;
export const EXPORT_JPEG_QUALITY = 0.94;
export const EXPORT_TIMEOUT_MS = 30_000;
export const MAX_EXPORT_SLOTS = SLIDE_COUNT * 2;

export type ExportProgress = {
  current: number;
  total: number;
};

export type ExportOptions = {
  format?: ExportFormat;
  onProgress?: (progress: ExportProgress, meta?: { didExport: boolean }) => void;
  signal?: AbortSignal;
  /** Fixed progress denominator; avoids total changing mid-export. */
  expectedTotal?: number;
  /** Called before ZIP packaging (batch export only). */
  onPackaging?: () => void;
};

export function getPendingExportBufferSize(): number {
  return pendingDataUrls.length;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Export cancelled");
  }
}

const pendingDataUrls: string[] = [];

function buildCaptureOptions(format: ExportFormat) {
  const base = {
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    pixelRatio: EXPORT_PIXEL_RATIO,
    cacheBust: true,
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
    },
  } as const;

  if (format === "png") {
    return { ...base, quality: 1 };
  }

  return { ...base, quality: EXPORT_JPEG_QUALITY };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Export timed out")), ms);
    }),
  ]);
}

async function waitForImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    imgs.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;

      await new Promise<void>((resolve) => {
        const done = () => resolve();
        img.onload = done;
        img.onerror = done;
        if (img.complete) done();
      });
    })
  );
}

async function safeCapture(
  element: HTMLElement,
  format: ExportFormat
): Promise<string> {
  await waitForImages(element);
  const options = buildCaptureOptions(format);

  const runCapture = () =>
    format === "png" ? toPng(element, options) : toJpeg(element, options);

  try {
    return await withTimeout(runCapture(), EXPORT_TIMEOUT_MS);
  } catch (error) {
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      return await withTimeout(runCapture(), EXPORT_TIMEOUT_MS);
    } catch (retryError) {
      const message =
        retryError instanceof Error ? retryError.message : "Capture failed";
      throw new Error(message);
    }
  }
}

function trackDataUrl(dataUrl: string): string {
  pendingDataUrls.push(dataUrl);
  return dataUrl;
}

export function cleanupExportMemory(): void {
  pendingDataUrls.length = 0;
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  if (!isBrowser() || typeof document === "undefined") return;

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function slideFilename(index: number, format: ExportFormat): string {
  return format === "png" ? `slide-${index}.png` : `slide-${index}.jpg`;
}

export function countExportableSlides(
  elements: (HTMLElement | null)[]
): number {
  return elements.filter(Boolean).length;
}

export async function captureSlide(
  element: HTMLElement,
  format: ExportFormat = "jpeg"
): Promise<string> {
  const dataUrl = await safeCapture(element, format);
  return trackDataUrl(dataUrl);
}

export async function exportSingleSlide(
  element: HTMLElement | null,
  slideIndex: number,
  options: ExportOptions = {}
): Promise<void> {
  if (!element) {
    throw new Error(`Slide ${slideIndex} is not ready for export.`);
  }

  const format = options.format ?? "jpeg";

  try {
    throwIfAborted(options.signal);
    await yieldToMain();
    const dataUrl = await captureSlide(element, format);
    options.onProgress?.({ current: 1, total: 1 });
    downloadDataUrl(dataUrl, slideFilename(slideIndex, format));
  } finally {
    cleanupExportMemory();
  }
}

export async function exportAllSlides(
  elements: (HTMLElement | null)[],
  options: ExportOptions = {}
): Promise<void> {
  const format = options.format ?? "jpeg";
  const zip = new JSZip();
  const exportable = countExportableSlides(elements);

  if (exportable === 0) {
    throw new Error("No slides are ready for export.");
  }

  const total = Math.min(
    options.expectedTotal ?? exportable,
    MAX_EXPORT_SLOTS
  );
  const slots =
    total > elements.length
      ? [...elements, ...Array<null>(total - elements.length).fill(null)]
      : elements.slice(0, MAX_EXPORT_SLOTS);

  try {
    for (let i = 0; i < slots.length; i++) {
      throwIfAborted(options.signal);
      await yieldToMain();

      const element = slots[i];
      if (!element) {
        options.onProgress?.({ current: i + 1, total }, { didExport: false });
        continue;
      }

      const dataUrl = await captureSlide(element, format);
      zip.file(
        slideFilename(i + 1, format),
        dataUrlToBase64(dataUrl),
        { base64: true }
      );

      options.onProgress?.({ current: i + 1, total }, { didExport: true });
    }

    options.onPackaging?.();

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const zipName =
      format === "png"
        ? "table-tales-carousel-png.zip"
        : "table-tales-carousel.zip";

    saveAs(blob, zipName);
  } finally {
    cleanupExportMemory();
  }
}

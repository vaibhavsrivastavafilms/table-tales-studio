import { toJpeg, toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;
export const EXPORT_PIXEL_RATIO = 2;
export const EXPORT_JPEG_QUALITY = 0.94;

export type ExportFormat = "jpeg" | "png";

export type ExportProgress = {
  current: number;
  total: number;
};

export type ExportOptions = {
  format?: ExportFormat;
  onProgress?: (progress: ExportProgress) => void;
};

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

async function waitForImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

export async function captureSlide(
  element: HTMLElement,
  format: ExportFormat = "jpeg"
): Promise<string> {
  await waitForImages(element);
  const options = buildCaptureOptions(format);

  if (format === "png") {
    return toPng(element, options);
  }

  return toJpeg(element, options);
}

function downloadDataUrl(dataUrl: string, filename: string): void {
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

export async function exportSingleSlide(
  element: HTMLElement | null,
  slideIndex: number,
  options: ExportOptions = {}
): Promise<void> {
  if (!element) {
    throw new Error(`Slide ${slideIndex} is not ready for export.`);
  }

  const format = options.format ?? "jpeg";
  const dataUrl = await captureSlide(element, format);
  options.onProgress?.({ current: 1, total: 1 });
  downloadDataUrl(dataUrl, slideFilename(slideIndex, format));
}

export async function exportAllSlides(
  elements: (HTMLElement | null)[],
  options: ExportOptions = {}
): Promise<void> {
  const format = options.format ?? "jpeg";
  const zip = new JSZip();
  const validIndices = elements
    .map((el, i) => (el ? i : -1))
    .filter((i) => i >= 0);
  const total = validIndices.length;

  let current = 0;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element) continue;

    const dataUrl = await captureSlide(element, format);
    zip.file(
      slideFilename(i + 1, format),
      dataUrlToBase64(dataUrl),
      { base64: true }
    );

    current += 1;
    options.onProgress?.({ current, total });
  }

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
}

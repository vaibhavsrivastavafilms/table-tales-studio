import { toJpeg } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;
export const EXPORT_QUALITY = 0.92;

const JPEG_OPTIONS = {
  quality: EXPORT_QUALITY,
  width: EXPORT_WIDTH,
  height: EXPORT_HEIGHT,
  pixelRatio: 1,
  cacheBust: true,
  style: {
    transform: "scale(1)",
    transformOrigin: "top left",
  },
} as const;

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

export async function captureSlideJpeg(
  element: HTMLElement
): Promise<string> {
  await waitForImages(element);
  return toJpeg(element, JPEG_OPTIONS);
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

export async function exportSingleSlide(
  element: HTMLElement | null,
  slideIndex: number
): Promise<void> {
  if (!element) {
    throw new Error(`Slide ${slideIndex} is not ready for export.`);
  }

  const dataUrl = await captureSlideJpeg(element);
  downloadDataUrl(dataUrl, `table-tales-slide-${slideIndex}.jpg`);
}

export async function exportAllSlides(
  elements: (HTMLElement | null)[]
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element) continue;

    const dataUrl = await captureSlideJpeg(element);
    zip.file(
      `slide-${i + 1}.jpg`,
      dataUrlToBase64(dataUrl),
      { base64: true }
    );
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  saveAs(blob, "table-tales-carousel.zip");
}

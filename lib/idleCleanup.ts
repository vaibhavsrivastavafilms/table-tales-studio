import { cleanupExportMemory } from "@/lib/exportSlides";
import { revokeObjectUrls } from "@/lib/browser";

let scheduled = false;
const blobUrls = new Set<string>();

export function trackBlobUrl(url: string): void {
  if (url.startsWith("blob:")) blobUrls.add(url);
}

export function scheduleIdleCleanup(extraBlobUrls: string[] = []): void {
  if (typeof window === "undefined" || scheduled) return;
  scheduled = true;

  const run = () => {
    scheduled = false;
    cleanupExportMemory();
    const urls = [...blobUrls, ...extraBlobUrls];
    revokeObjectUrls(urls);
    blobUrls.clear();
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 3000 });
  } else {
    setTimeout(run, 1200);
  }
}

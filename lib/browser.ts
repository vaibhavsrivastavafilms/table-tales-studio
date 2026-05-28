export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function safeTimeout(callback: () => void, ms: number): void {
  if (!isBrowser()) return;
  window.setTimeout(callback, ms);
}

export function revokeObjectUrls(urls: string[]): void {
  if (!isBrowser() || typeof URL === "undefined") return;

  for (const url of urls) {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}

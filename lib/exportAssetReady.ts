const DEFAULT_SETTLE_MS = 140;
const DEFAULT_TIMEOUT_MS = 12_000;

function raf(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 16);
    }
  });
}

async function waitForFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.ready) return;
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("fonts timeout")), 4000)
      ),
    ]);
  } catch {
    /* proceed with system fonts */
  }
}

async function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return;

  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 6000);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    if (img.complete) done();
  });
}

function collectImages(root: HTMLElement): HTMLImageElement[] {
  return Array.from(root.querySelectorAll("img"));
}

function overlaysSettled(root: HTMLElement): boolean {
  const loading = root.querySelector("[data-export-loading='true']");
  return !loading;
}

export async function waitForSlideAssets(
  element: HTMLElement,
  options?: { settleMs?: number; timeoutMs?: number }
): Promise<void> {
  const settleMs = options?.settleMs ?? DEFAULT_SETTLE_MS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const started = performance.now();

  await waitForFonts();

  const imgs = collectImages(element);
  await Promise.all(imgs.map(waitForImage));

  while (!overlaysSettled(element)) {
    if (performance.now() - started > timeoutMs) break;
    await raf();
    await new Promise((r) => setTimeout(r, 48));
  }

  await raf();
  await raf();
  if (settleMs > 0) {
    await new Promise((r) => setTimeout(r, settleMs));
  }
}

export async function waitForAllSlideAssets(
  elements: (HTMLElement | null)[],
  options?: { settleMs?: number; timeoutMs?: number }
): Promise<void> {
  const ready = elements.filter((el): el is HTMLElement => Boolean(el));
  if (ready.length === 0) return;

  await waitForFonts();

  await Promise.all(
    ready.map(async (el) => {
      const imgs = collectImages(el);
      await Promise.all(imgs.map(waitForImage));
    })
  );

  for (const el of ready) {
    let attempts = 0;
    while (!overlaysSettled(el) && attempts < 24) {
      attempts += 1;
      await raf();
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  await raf();
  await raf();
  const settle = options?.settleMs ?? DEFAULT_SETTLE_MS;
  if (settle > 0) {
    await new Promise((r) => setTimeout(r, settle));
  }
}

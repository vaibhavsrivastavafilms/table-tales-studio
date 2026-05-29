import { isBrowser } from "@/lib/browser";

export type SubjectBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export type SubjectSegmentation = {
  bounds: SubjectBounds;
  clipPath: string;
  maskGradient: string;
  confidence: number;
  subjectType: "food" | "person" | "object" | "scene";
  isolation: "cutout" | "layered" | "full-bleed";
  shadowStrength?: number;
  contactShadow?: string;
};

const DEFAULT_BOUNDS = (w: number, h: number): SubjectBounds => ({
  x: w * 0.1,
  y: h * 0.14,
  width: w * 0.8,
  height: h * 0.58,
  centerX: w * 0.5,
  centerY: h * 0.4,
});

function clipFromBounds(b: SubjectBounds, w: number, h: number): string {
  const px = (v: number, dim: number) => `${((v / dim) * 100).toFixed(1)}%`;
  const pad = 0.04;
  const x0 = b.x - b.width * pad;
  const y0 = b.y - b.height * pad * 0.5;
  const x1 = b.x + b.width * (1 + pad);
  const y1 = b.y + b.height * (1 + pad * 0.5);
  const cx = b.centerX;
  const cy = b.centerY;
  return `polygon(
    ${px(x0 + b.width * 0.12, w)} ${px(y0 + b.height * 0.06, h)},
    ${px(cx - b.width * 0.08, w)} ${px(y0, h)},
    ${px(x1 - b.width * 0.12, w)} ${px(y0 + b.height * 0.08, h)},
    ${px(x1, w)} ${px(cy, h)},
    ${px(x1 - b.width * 0.1, w)} ${px(y1 - b.height * 0.04, h)},
    ${px(cx, w)} ${px(y1, h)},
    ${px(x0 + b.width * 0.1, w)} ${px(y1 - b.height * 0.04, h)},
    ${px(x0, w)} ${px(cy, h)}
  )`;
}

function maskFromBounds(b: SubjectBounds, w: number, h: number): string {
  const cx = (b.centerX / w) * 100;
  const cy = (b.centerY / h) * 100;
  const rx = Math.min(58, (b.width / w) * 52 + 8);
  const ry = Math.min(52, (b.height / h) * 46 + 6);
  return `radial-gradient(ellipse ${rx}% ${ry}% at ${cx}% ${cy}%, rgba(0,0,0,1) 28%, rgba(0,0,0,0.85) 42%, rgba(0,0,0,0.35) 58%, transparent 76%)`;
}

function detectBounds(
  data: Uint8ClampedArray,
  sw: number,
  sh: number
): SubjectBounds {
  const centerX0 = Math.floor(sw * 0.22);
  const centerX1 = Math.floor(sw * 0.78);
  const centerY0 = Math.floor(sh * 0.18);
  const centerY1 = Math.floor(sh * 0.82);

  let minX = sw;
  let minY = sh;
  let maxX = 0;
  let maxY = 0;
  let hits = 0;
  let centerHits = 0;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const bl = data[i + 2];
      const lum = (r + g + bl) / 3;
      const sat = (Math.max(r, g, bl) - Math.min(r, g, bl)) / 255;

      const border =
        x < sw * 0.12 || x > sw * 0.88 || y < sh * 0.1 || y > sh * 0.9;
      const inCenter =
        x >= centerX0 && x <= centerX1 && y >= centerY0 && y <= centerY1;

      const skinLike = r > g && g > bl && r - bl > 25 && lum > 60 && lum < 220;
      const foodLike = sat > 0.14 && lum > 40 && lum < 248 && sat < 0.75;
      const warmPlate = lum > 90 && lum < 200 && sat > 0.08 && sat < 0.45;

      let score = 0;
      if (foodLike) score += 2;
      if (warmPlate && inCenter) score += 1.5;
      if (skinLike && inCenter) score += 1.2;
      if (border && !inCenter && sat < 0.12) score -= 2;

      if (score >= 1.5) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        hits++;
        if (inCenter) centerHits++;
      }
    }
  }

  if (hits < sw * sh * 0.015 || centerHits < hits * 0.25) {
    return {
      x: sw * 0.14,
      y: sh * 0.16,
      width: sw * 0.72,
      height: sh * 0.56,
      centerX: sw * 0.5,
      centerY: sh * 0.42,
    };
  }

  const padX = sw * 0.03;
  const padY = sh * 0.035;
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(sw, maxX + padX);
  maxY = Math.min(sh, maxY + padY);

  const bw = maxX - minX;
  const bh = maxY - minY;
  return {
    x: minX,
    y: minY,
    width: bw,
    height: bh,
    centerX: minX + bw / 2,
    centerY: minY + bh / 2,
  };
}

function finalizeSegmentation(
  bounds: SubjectBounds,
  slideW: number,
  slideH: number,
  confidence: number
): SubjectSegmentation {
  return {
    bounds,
    clipPath: clipFromBounds(bounds, slideW, slideH),
    maskGradient: maskFromBounds(bounds, slideW, slideH),
    confidence,
    subjectType: "food",
    isolation: confidence > 0.5 ? "cutout" : "layered",
    shadowStrength: 0.32 + confidence * 0.12,
    contactShadow:
      "0 14px 36px rgba(0,0,0,0.28), 0 6px 16px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.08)",
  };
}

export async function segmentSubjectFromImage(
  imageUrl: string,
  slideW = 320,
  slideH = 400,
  timeoutMs = 8_000
): Promise<SubjectSegmentation> {
  if (!isBrowser() || !imageUrl) {
    const b = DEFAULT_BOUNDS(slideW, slideH);
    return finalizeSegmentation(b, slideW, slideH, 0.38);
  }

  const fallback = () => {
    const b = DEFAULT_BOUNDS(slideW, slideH);
    return finalizeSegmentation(b, slideW, slideH, 0.32);
  };

  const loadSegment = new Promise<SubjectSegmentation>((resolve) => {
    const img = new Image();
    if (!imageUrl.startsWith("blob:") && !imageUrl.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      try {
        const sw = 72;
        const sh = 90;
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(fallback());
          return;
        }
        ctx.drawImage(img, 0, 0, sw, sh);
        const data = ctx.getImageData(0, 0, sw, sh).data;
        const raw = detectBounds(data, sw, sh);
        const scaleX = slideW / sw;
        const scaleY = slideH / sh;
        const bounds: SubjectBounds = {
          x: raw.x * scaleX,
          y: raw.y * scaleY,
          width: raw.width * scaleX,
          height: raw.height * scaleY,
          centerX: raw.centerX * scaleX,
          centerY: raw.centerY * scaleY,
        };
        const areaRatio = (raw.width * raw.height) / (sw * sh);
        const confidence = Math.min(0.92, 0.42 + areaRatio * 1.1);
        resolve(finalizeSegmentation(bounds, slideW, slideH, confidence));
      } catch {
        resolve(fallback());
      }
    };
    img.onerror = () => resolve(fallback());
    img.src = imageUrl;
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      loadSegment,
      new Promise<SubjectSegmentation>((resolve) => {
        timer = setTimeout(() => resolve(fallback()), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function defaultSegmentation(
  width = 320,
  height = 400
): SubjectSegmentation {
  const b = DEFAULT_BOUNDS(width, height);
  return finalizeSegmentation(b, width, height, 0.42);
}

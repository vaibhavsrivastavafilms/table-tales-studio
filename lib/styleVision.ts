import { isBrowser } from "@/lib/browser";
import {
  DEFAULT_STYLE_REFERENCE,
  type StyleReference,
} from "@/lib/styleReference";

type ColorSample = { r: number; g: number; b: number };
type RegionStats = {
  brightness: number;
  saturation: number;
  contrast: number;
};

async function sampleImageUrl(url: string): Promise<{
  global: ColorSample;
  top: RegionStats;
  bottom: RegionStats;
  center: RegionStats;
  variance: number;
} | null> {
  if (!isBrowser()) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 48;
        const h = 64;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        const region = (y0: number, y1: number): RegionStats => {
          let r = 0;
          let g = 0;
          let b = 0;
          let n = 0;
          const vals: number[] = [];
          for (let y = y0; y < y1; y++) {
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              const pr = data[i];
              const pg = data[i + 1];
              const pb = data[i + 2];
              r += pr;
              g += pg;
              b += pb;
              vals.push((pr + pg + pb) / 3);
              n++;
            }
          }
          const avg = { r: r / n, g: g / n, b: b / n };
          const brightness = (avg.r + avg.g + avg.b) / (255 * 3);
          const max = Math.max(avg.r, avg.g, avg.b);
          const min = Math.min(avg.r, avg.g, avg.b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
          const contrast = Math.sqrt(
            vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length
          );
          return { brightness, saturation, contrast: contrast / 128 };
        };

        let gr = 0;
        let gg = 0;
        let gb = 0;
        let gn = 0;
        let variance = 0;
        const lum: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
          gr += data[i];
          gg += data[i + 1];
          gb += data[i + 2];
          lum.push((data[i] + data[i + 1] + data[i + 2]) / 3);
          gn++;
        }
        const meanLum = lum.reduce((a, v) => a + v, 0) / lum.length;
        variance = Math.sqrt(
          lum.reduce((a, v) => a + (v - meanLum) ** 2, 0) / lum.length
        );

        resolve({
          global: { r: gr / gn, g: gg / gn, b: gb / gn },
          top: region(0, Math.floor(h * 0.28)),
          bottom: region(Math.floor(h * 0.62), h),
          center: region(Math.floor(h * 0.32), Math.floor(h * 0.68)),
          variance: variance / 128,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function hexFromSample(s: ColorSample): string {
  return `#${[s.r, s.g, s.b]
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("")}`;
}

function derivePalette(global: ColorSample, stats: RegionStats): string[] {
  const base = hexFromSample(global);
  const warm = `#${Math.min(255, Math.round(global.r * 1.1))
    .toString(16)
    .padStart(2, "0")}${Math.round(global.g * 0.85)
    .toString(16)
    .padStart(2, "0")}${Math.round(global.b * 0.7)
    .toString(16)
    .padStart(2, "0")}`;
  const ink =
    stats.brightness < 0.45 ? "#0b0f1a" : stats.brightness > 0.7 ? "#1a1410" : "#141820";
  return [base, warm, ink, "#ffffff"].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
}

/**
 * Heuristic reference-carousel analysis. Structure ready for OpenAI Vision later.
 */
export async function analyzeReferenceStyle(
  imageUrl: string
): Promise<StyleReference> {
  if (!isBrowser()) {
    return { ...DEFAULT_STYLE_REFERENCE };
  }

  const sampled = await sampleImageUrl(imageUrl);
  if (!sampled) {
    return { ...DEFAULT_STYLE_REFERENCE };
  }

  const { global, top, bottom, center, variance } = sampled;
  const warmth = (global.r + global.g * 0.5) / 255;
  const brightness = (global.r + global.g + global.b) / (255 * 3);
  const luxury = warmth * 0.35 + (brightness < 0.45 ? 0.25 : 0);
  const street = brightness > 0.55 ? 0.35 : 0.1;
  const textHeavyTop = top.brightness < center.brightness - 0.08;
  const textHeavyBottom = bottom.brightness < center.brightness - 0.06;
  const floatingCards =
    variance > 0.22 && (top.saturation > 0.35 || bottom.saturation > 0.35);
  const highStickerEnergy = variance > 0.28 && center.saturation > 0.4;

  let aesthetic = "balanced food carousel";
  let emotionalTone = "warm cinematic";
  let editorialFeel = "instagram editorial";
  let stickerStyle = "minimal badge";
  let typographyStyle = "bold sans hierarchy";
  let compositionStyle = "center-weighted caption band";
  let overlayStyle = "gradient vignette";
  let shadowStyle = "soft lift";
  let captionDensity: StyleReference["captionDensity"] = "balanced";
  let borderRadius = 16;

  if (luxury > 0.55 && brightness < 0.55) {
    aesthetic = "luxury dining carousel";
    emotionalTone = "refined evening";
    editorialFeel = "premium magazine";
    typographyStyle = "elegant serif-accent sans";
    stickerStyle = "minimal elegant tag";
    captionDensity = "minimal";
    overlayStyle = "deep cinematic vignette";
    shadowStyle = "deep lift";
    borderRadius = 12;
  } else if (street > 0.4 && brightness > 0.58) {
    aesthetic = "street food viral carousel";
    emotionalTone = "loud viral energy";
    editorialFeel = "creator documentary";
    typographyStyle = "heavy condensed impact";
    stickerStyle = highStickerEnergy ? "burst sticker stack" : "documentary badge";
    captionDensity = "dense";
    compositionStyle = "asymmetric punchy layout";
    overlayStyle = "high-contrast documentary";
    shadowStyle = "medium drop";
    borderRadius = 20;
  } else if (warmth > 0.62 && floatingCards) {
    aesthetic = "warm editorial relationship carousel";
    emotionalTone = "cozy emotional";
    editorialFeel = "comic editorial stickers";
    typographyStyle = "playful hand-drawn rhythm";
    stickerStyle = "comic burst stickers";
    compositionStyle = "asymmetric floating cards";
    captionDensity = "balanced";
    borderRadius = 22;
  } else if (brightness < 0.38) {
    aesthetic = "cinematic dark food story";
    emotionalTone = "poetic cinematic";
    editorialFeel = "moody film still";
    typographyStyle = "light serif cinematic";
    overlayStyle = "heavy cinematic vignette";
    shadowStyle = "deep lift";
    captionDensity = "minimal";
  }

  const textPlacement: StyleReference["textPlacement"] = {
    top: textHeavyTop && !textHeavyBottom,
    bottom: textHeavyBottom || (!textHeavyTop && brightness > 0.4),
    centered: !textHeavyTop && !floatingCards,
    floatingCards,
  };

  if (floatingCards) {
    compositionStyle = "asymmetric floating cards";
    typographyStyle = "playful layered hierarchy";
  }

  return {
    aesthetic,
    typographyStyle,
    stickerStyle,
    compositionStyle,
    textPlacement,
    colorPalette: derivePalette(global, center),
    overlayStyle,
    shadowStyle,
    borderRadius,
    captionDensity,
    emotionalTone,
    editorialFeel,
  };
}

/** Vision API hook — swap implementation when OPENAI vision is enabled. */
export async function analyzeReferenceStyleWithVision(
  imageUrl: string
): Promise<StyleReference> {
  return analyzeReferenceStyle(imageUrl);
}

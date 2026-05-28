export type FocalPoint = { x: number; y: number };

export type TextZoneId = "top-left" | "top-right" | "bottom-curve" | "side-right";

export type TextZone = {
  id: TextZoneId;
  x: number;
  y: number;
  maxWidth: number;
  rotation: number;
  safe: boolean;
};

const SLIDE_W = 320;
const SLIDE_H = 400;

/** Default food focal point — center-weighted for plated dishes. */
export function defaultFocalPoint(): FocalPoint {
  return { x: 0.5, y: 0.46 };
}

function zoneCollidesFocal(zone: TextZone, focal: FocalPoint): boolean {
  const zx = zone.x / SLIDE_W;
  const zy = zone.y / SLIDE_H;
  const dx = Math.abs(zx - focal.x);
  const dy = Math.abs(zy - focal.y);
  return dx < 0.22 && dy < 0.18;
}

export function buildTextZones(
  focal: FocalPoint = defaultFocalPoint(),
  slideIndex = 1
): TextZone[] {
  const rotSeed = ((slideIndex * 7) % 5) - 2;

  const zones: TextZone[] = [
    {
      id: "top-left",
      x: 14,
      y: 18,
      maxWidth: 128,
      rotation: -3 + rotSeed * 0.5,
      safe: true,
    },
    {
      id: "top-right",
      x: SLIDE_W - 118,
      y: 22,
      maxWidth: 100,
      rotation: 4 - rotSeed * 0.4,
      safe: true,
    },
    {
      id: "bottom-curve",
      x: 12,
      y: SLIDE_H - 108,
      maxWidth: SLIDE_W - 24,
      rotation: 0,
      safe: true,
    },
    {
      id: "side-right",
      x: SLIDE_W - 72,
      y: SLIDE_H * 0.38,
      maxWidth: 64,
      rotation: 6,
      safe: true,
    },
  ];

  return zones.map((z) => ({
    ...z,
    safe: !zoneCollidesFocal(z, focal),
  }));
}

export function pickStickerZones(
  focal: FocalPoint = defaultFocalPoint(),
  slideIndex = 1
): { burst: TextZone; ribbon: TextZone; accent?: TextZone } {
  const zones = buildTextZones(focal, slideIndex);
  const safeTop = zones.filter(
    (z) => z.safe && (z.id === "top-left" || z.id === "top-right")
  );
  const burst =
    safeTop.find((z) => z.id === "top-left") ??
    safeTop[0] ??
    zones[0];
  const ribbon = zones.find((z) => z.id === "bottom-curve") ?? zones[2];
  const accent = zones.find((z) => z.id === "side-right" && z.safe);

  return { burst, ribbon, accent };
}

export function splitEditorialCaption(caption: string): {
  headline: string;
  subline: string;
  accent?: string;
} {
  const trimmed = caption.trim();
  if (!trimmed) {
    return { headline: "SIMPLE.", subline: "But unforgettable." };
  }

  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length >= 2) {
    return {
      headline: lines[0],
      subline: lines.slice(1).join(" "),
      accent: lines.length > 2 ? lines[2] : undefined,
    };
  }

  const parts = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      headline: parts[0],
      subline: parts.slice(1).join(" "),
    };
  }

  const words = trimmed.split(/\s+/);
  if (words.length > 8) {
    const mid = Math.ceil(words.length / 2);
    return {
      headline: words.slice(0, mid).join(" "),
      subline: words.slice(mid).join(" "),
    };
  }

  return { headline: trimmed, subline: "" };
}

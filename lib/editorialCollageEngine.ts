import type { EditorialLayoutPlan } from "@/lib/editorialLayouts";
import type { SubjectSegmentation } from "@/lib/subjectSegmentation";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type CollageLayerType =
  | "background"
  | "paper"
  | "photo-bleed"
  | "cutout"
  | "photo-stack"
  | "shadow"
  | "frame"
  | "sticker"
  | "redesign";

export type CollageLayer = {
  id: string;
  type: CollageLayerType;
  src?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
  opacity: number;
  blendMode?: string;
  filter?: string;
  clipPath?: string;
  maskImage?: string;
  boxShadow?: string;
  borderRadius?: number;
};

export type CollageComposition = {
  layers: CollageLayer[];
  depthShadow: string;
  parallaxClass: string;
};

function focalPlacement(
  b: SubjectSegmentation["bounds"],
  w: number,
  h: number,
  layout: EditorialLayoutPlan
): { x: number; y: number; width: number; height: number } {
  const scale = layout.cutoutScale;
  const fw = Math.min(w * 0.92, b.width * scale);
  const fh = Math.min(h * 0.78, b.height * scale);
  const cx = b.centerX;
  const cy =
    layout.composition === "hero"
      ? h * 0.44
      : layout.composition === "minimal-editorial"
        ? h * 0.46
        : b.centerY;
  return {
    x: cx - fw / 2 + layout.parallaxOffset.x * 0.15,
    y: cy - fh / 2 + layout.parallaxOffset.y * 0.1,
    width: fw,
    height: fh,
  };
}

export function buildEditorialCollage(input: {
  imageUrl: string;
  slideIndex: number;
  width?: number;
  height?: number;
  layout: EditorialLayoutPlan;
  segmentation: SubjectSegmentation;
  analysis: VisualAnalysis;
  redesignUrl?: string | null;
}): CollageComposition {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const { layout, segmentation: seg } = input;
  const b = seg.bounds;
  const focal = focalPlacement(b, w, h, layout);
  const layers: CollageLayer[] = [];
  let z = 0;

  const push = (layer: Omit<CollageLayer, "zIndex"> & { zIndex?: number }) => {
    layers.push({ ...layer, zIndex: layer.zIndex ?? z++ });
  };

  const paperOpacity =
    layout.composition === "minimal-editorial"
      ? 0.08 + layout.negativeSpace * 0.12
      : layout.composition === "hero"
        ? 0.35
        : 0.55;

  if (layout.backgroundTreatment === "dark-cinematic") {
    push({
      id: "bg-dark",
      type: "background",
      x: 0,
      y: 0,
      width: w,
      height: h,
      rotation: 0,
      scale: 1,
      opacity: 1,
    });
  } else {
    push({
      id: "bg-paper",
      type: "paper",
      x: w * 0.04,
      y: h * 0.05,
      width: w * 0.92,
      height: h * 0.9,
      rotation: layout.rotation * 0.08,
      scale: 1,
      opacity: paperOpacity,
      borderRadius: layout.useTornMask ? 6 : 20,
    });
  }

  const stackCount = Math.min(layout.maxStackLayers, 1);
  if (stackCount > 0 && layout.composition === "collage") {
    push({
      id: "stack-ghost",
      type: "photo-stack",
      src: input.imageUrl,
      x: focal.x + 10,
      y: focal.y + 12,
      width: focal.width * 0.96,
      height: focal.height * 0.96,
      rotation: layout.rotation + 3,
      scale: 0.98,
      opacity: 0.22,
      filter: "saturate(0.75) contrast(0.88) blur(2px)",
      borderRadius: 18,
    });
  }

  push({
    id: "shadow-contact",
    type: "shadow",
    x: focal.x + focal.width * 0.08,
    y: focal.y + focal.height * 0.92,
    width: focal.width * 0.84,
    height: Math.max(12, focal.height * 0.08),
    rotation: layout.rotation * 0.35,
    scale: 1,
    opacity: seg.shadowStrength ?? 0.38,
    borderRadius: 999,
  });

  if (seg.isolation !== "full-bleed") {
    push({
      id: "cutout-main",
      type: "cutout",
      src: input.imageUrl,
      x: focal.x,
      y: focal.y,
      width: focal.width,
      height: focal.height,
      rotation: layout.rotation * 0.85,
      scale: 1,
      opacity: 1,
      clipPath: seg.clipPath,
      maskImage: seg.maskGradient,
      filter: input.analysis.luxuryScore > 0.6
        ? "contrast(1.04) saturate(1.02)"
        : "contrast(1.06) saturate(1.08)",
      boxShadow: seg.contactShadow ?? "0 16px 40px rgba(0,0,0,0.32), 0 4px 12px rgba(0,0,0,0.18)",
      borderRadius: layout.useTornMask ? 10 : 22,
    });
  } else {
    push({
      id: "photo-bleed",
      type: "photo-bleed",
      src: input.imageUrl,
      x: 0,
      y: 0,
      width: w,
      height: h,
      rotation: 0,
      scale: 1,
      opacity: layout.composition === "minimal-editorial" ? 0.82 : 0.9,
      filter: "contrast(1.03) saturate(1.04)",
    });
  }

  if (input.redesignUrl && layout.composition !== "minimal-editorial") {
    push({
      id: "ai-redesign",
      type: "redesign",
      src: input.redesignUrl,
      x: 0,
      y: 0,
      width: w,
      height: h,
      rotation: 0,
      scale: 1,
      opacity: 0.68,
      blendMode: "soft-light",
      zIndex: 12,
    });
  }

  const parallaxClass =
    layout.composition === "hero" || input.slideIndex === 6
      ? "art-motion-punch"
      : layout.composition === "minimal-editorial"
        ? "art-motion-slow"
        : "art-motion-float";

  return {
    layers,
    depthShadow: "0 20px 44px rgba(0,0,0,0.28)",
    parallaxClass,
  };
}

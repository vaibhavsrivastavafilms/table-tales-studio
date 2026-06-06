import type { DoodleElement as LegacyDoodle } from "@/lib/doodleSystem";
import type { DoodleElement as RendererDoodle } from "@/lib/renderers/types";

const TYPE_MAP: Partial<Record<RendererDoodle["type"], LegacyDoodle["type"]>> = {
  arrow: "arrow",
  circle: "circle",
  underline: "underline",
  star: "sparkle",
  sparkle: "sparkle",
  heart: "heart",
  scribble: "underline",
  highlight: "underline",
  burst: "sparkle",
  "coffee-stain": "circle",
};

export function rendererDoodlesToLegacy(
  elements: RendererDoodle[]
): LegacyDoodle[] {
  return elements.map((el) => ({
    type: TYPE_MAP[el.type] ?? "sparkle",
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    scale: el.scale,
    label: el.label,
  }));
}

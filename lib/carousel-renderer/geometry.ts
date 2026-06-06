import type { Rect } from "@/lib/carousel-renderer/types";

export function pointInZone(
  x: number,
  y: number,
  zone: Rect,
  padding = 12
): boolean {
  return (
    x >= zone.x - padding &&
    x <= zone.x + zone.width + padding &&
    y >= zone.y - padding &&
    y <= zone.y + zone.height + padding
  );
}

export function distanceToZoneEdge(x: number, y: number, zone: Rect): number {
  const cx = Math.max(zone.x, Math.min(x, zone.x + zone.width));
  const cy = Math.max(zone.y, Math.min(y, zone.y + zone.height));
  return Math.hypot(x - cx, y - cy);
}

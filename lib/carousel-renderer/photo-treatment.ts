/**
 * Photo integrity rules — uploaded food photography is never altered beyond
 * crop / scale / position and subtle grade + edge vignette.
 */

/** Subtle grade only (texture, lighting, color preserved). */
export const SUBTLE_PHOTO_FILTER =
  "contrast(1.03) saturate(1.05) brightness(1.01)";

export const MAX_EDGE_VIGNETTE = 0.1;

/** Max opacity for edge scrims (never blanket the plate). */
export const MAX_EDGE_SCRIM = 0.22;

export function edgeScrimTop(height: number): string | undefined {
  if (height <= 0) return undefined;
  return `linear-gradient(180deg, rgba(12,8,6,${MAX_EDGE_SCRIM}) 0%, transparent 100%)`;
}

export function edgeScrimBottom(height: number): string | undefined {
  if (height <= 0) return undefined;
  return `linear-gradient(0deg, rgba(12,8,6,${MAX_EDGE_SCRIM}) 0%, transparent 100%)`;
}

export type FoodFirstBudget = {
  photo: number;
  typography: number;
  doodle: number;
};

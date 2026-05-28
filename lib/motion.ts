/** Unified motion + timing tokens for Phase 8.1 cohesion */
export const MOTION = {
  durationFast: 150,
  durationNormal: 200,
  durationSlow: 320,
  durationEnter: 450,
  toastMs: 4000,
  saveDebounceMs: 900,
  analyticsDebounceMs: 1200,
  shimmerMs: 1800,
  skeletonStaggerMs: 80,
  easingStandard: "cubic-bezier(0.22, 1, 0.36, 1)",
  easingSoft: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export function motionTransition(
  props = "all",
  duration: number = MOTION.durationNormal
): string {
  return `${props} ${duration}ms ${MOTION.easingStandard}`;
}

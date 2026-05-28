export type PlanId = "free" | "premium";

export type PlanLimits = {
  maxProjects: number;
  maxExportsPerDay: number;
  watermark: boolean;
};

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    maxProjects: 3,
    maxExportsPerDay: 10,
    watermark: true,
  },
  premium: {
    maxProjects: 999,
    maxExportsPerDay: 9999,
    watermark: false,
  },
};

export function getPlanLimits(plan: PlanId = "free"): PlanLimits {
  return PLANS[plan];
}

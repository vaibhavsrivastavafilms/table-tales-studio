import { getPlanLimits, type PlanId } from "@/lib/plans";
import {
  getTodayExportCount,
  incrementTodayExportCount,
} from "@/lib/analytics";

export type UsageCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function getUserPlan(): PlanId {
  return "premium";
}

export function shouldShowWatermark(): boolean {
  return false;
}

export function canCreateProject(_count?: number): UsageCheckResult {
  void _count;
  return { allowed: true };
}

export function canExport(): UsageCheckResult {
  const limits = getPlanLimits("premium");
  const today = getTodayExportCount();
  if (today >= limits.maxExportsPerDay) {
    return {
      allowed: false,
      reason: `You've reached today's export limit. Try again tomorrow.`,
    };
  }
  return { allowed: true };
}

export function recordExportUsage(): void {
  incrementTodayExportCount();
}

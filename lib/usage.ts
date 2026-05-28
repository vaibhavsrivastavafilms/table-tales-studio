import { getPlanLimits, type PlanId } from "@/lib/plans";
import {
  getTodayExportCount,
  incrementTodayExportCount,
} from "@/lib/analytics";

export type UsageCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function getUserPlan(): PlanId {
  if (process.env.NEXT_PUBLIC_FORCE_PREMIUM === "true") {
    return "premium";
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("table-tales-plan");
    if (stored === "premium") return "premium";
  }
  return "free";
}

export function shouldShowWatermark(): boolean {
  return getPlanLimits(getUserPlan()).watermark;
}

export function canCreateProject(currentCount: number): UsageCheckResult {
  const limits = getPlanLimits(getUserPlan());
  if (currentCount >= limits.maxProjects) {
    return {
      allowed: false,
      reason: `Free plan allows ${limits.maxProjects} projects. Upgrade for unlimited.`,
    };
  }
  return { allowed: true };
}

export function canExport(): UsageCheckResult {
  const limits = getPlanLimits(getUserPlan());
  const today = getTodayExportCount();
  if (today >= limits.maxExportsPerDay) {
    return {
      allowed: false,
      reason: `Daily export limit reached (${limits.maxExportsPerDay}). Try again tomorrow.`,
    };
  }
  return { allowed: true };
}

export function recordExportUsage(): void {
  incrementTodayExportCount();
}

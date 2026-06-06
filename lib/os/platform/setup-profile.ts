export type BranchSetupProfile = {
  seatCount: number | null;
  kitchenCapacity: string | null;
  operatingHours: string | null;
  expenseBudgetPaise: number | null;
  targetNetMarginPercent: number | null;
};

export type PlatformSetupProfile = {
  completedAt: string | null;
  globalTargets: {
    foodCostPercent: number;
    laborCostPercent: number;
    netMarginPercent: number;
  };
  branchProfiles: Record<string, BranchSetupProfile>;
  vendorOnboardingComplete: boolean;
  openingInventoryComplete: boolean;
  notes: string | null;
};

export function defaultPlatformSetup(): PlatformSetupProfile {
  return {
    completedAt: null,
    globalTargets: {
      foodCostPercent: 32,
      laborCostPercent: 22,
      netMarginPercent: 18,
    },
    branchProfiles: {},
    vendorOnboardingComplete: false,
    openingInventoryComplete: false,
    notes: null,
  };
}

export function mergePlatformSetup(
  current: PlatformSetupProfile,
  patch: Partial<PlatformSetupProfile>
): PlatformSetupProfile {
  return {
    ...current,
    ...patch,
    globalTargets: { ...current.globalTargets, ...patch.globalTargets },
    branchProfiles: { ...current.branchProfiles, ...patch.branchProfiles },
  };
}

export function ensurePlatformSetup(db: import("@/lib/os/procurement/types").ProcurementDb) {
  return {
    ...db,
    platformSetup: {
      ...defaultPlatformSetup(),
      ...(db.platformSetup ?? {}),
      globalTargets: {
        ...defaultPlatformSetup().globalTargets,
        ...(db.platformSetup?.globalTargets ?? {}),
      },
      branchProfiles: db.platformSetup?.branchProfiles ?? {},
    },
  };
}

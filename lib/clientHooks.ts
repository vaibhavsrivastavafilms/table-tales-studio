"use client";

import { useSyncExternalStore } from "react";
import {
  getCreatorMemorySnapshot,
  getServerCreatorMemory,
  subscribeCreatorMemory,
} from "@/lib/creatorMemory";
import {
  getDirectorProfileSnapshot,
  getServerDirectorProfile,
  subscribeDirectorProfile,
  type DirectorProfile,
} from "@/lib/directorProfile";

const SERVER_MEMORY = getServerCreatorMemory();
const SERVER_DIRECTOR = getServerDirectorProfile();

function noopSubscribe(): () => void {
  return () => {};
}

function getOnboardingSnapshot(): boolean {
  return !getCreatorMemorySnapshot().onboardingComplete;
}

/** True on client after hydration; false during SSR. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/** Hydration-safe creator memory read with a stable snapshot reference. */
export function useCreatorMemory() {
  return useSyncExternalStore(
    subscribeCreatorMemory,
    getCreatorMemorySnapshot,
    () => SERVER_MEMORY
  );
}

/** Hydration-safe onboarding gate. */
export function useNeedsOnboarding(): boolean {
  return useSyncExternalStore(
    subscribeCreatorMemory,
    getOnboardingSnapshot,
    () => false
  );
}

/** Hydration-safe director profile with stable snapshot reference. */
export function useDirectorProfile(): DirectorProfile {
  return useSyncExternalStore(
    subscribeDirectorProfile,
    getDirectorProfileSnapshot,
    () => SERVER_DIRECTOR
  );
}

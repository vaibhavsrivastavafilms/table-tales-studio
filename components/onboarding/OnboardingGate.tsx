"use client";

import { useEffect, useRef, useState } from "react";
import { useIsClient, useNeedsOnboarding } from "@/lib/clientHooks";
import { initClientMonitoring } from "@/lib/monitoring";
import { initClientUploadEnv } from "@/lib/uploadEnv";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

type OnboardingGateProps = {
  children: React.ReactNode;
};

export default function OnboardingGate({ children }: OnboardingGateProps) {
  const isClient = useIsClient();
  const needsOnboarding = useNeedsOnboarding();
  const [dismissed, setDismissed] = useState(false);
  const monitoringStarted = useRef(false);

  useEffect(() => {
    if (!isClient || monitoringStarted.current) return;
    monitoringStarted.current = true;
    initClientMonitoring();
    initClientUploadEnv();
  }, [isClient]);

  const showOnboarding = isClient && needsOnboarding && !dismissed;

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setDismissed(true)} />
      )}
    </>
  );
}

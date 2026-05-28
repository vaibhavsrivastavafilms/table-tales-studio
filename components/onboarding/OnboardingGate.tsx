"use client";

import { useEffect, useState } from "react";
import { needsOnboarding } from "@/lib/creatorMemory";
import { initClientMonitoring } from "@/lib/monitoring";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

type OnboardingGateProps = {
  children: React.ReactNode;
};

export default function OnboardingGate({ children }: OnboardingGateProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initClientMonitoring();
    setShowOnboarding(needsOnboarding());
    setReady(true);
  }, []);

  if (!ready) return children;

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  );
}

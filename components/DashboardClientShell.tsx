"use client";

import OnboardingGate from "@/components/onboarding/OnboardingGate";

export default function DashboardClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingGate>{children}</OnboardingGate>;
}

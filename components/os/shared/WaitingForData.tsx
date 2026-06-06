"use client";

import Link from "next/link";
import type { WaitingForDataProps } from "@/lib/os/platform/business-readiness";

export function WaitingForData({
  metric,
  requiredSteps,
  href,
  hrefLabel,
}: WaitingForDataProps) {
  return (
    <div className="rounded-xl border border-dashed border-[#C9A84C]/60 bg-[#FDF6EC]/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#C9A84C]">
        Waiting for Data
      </p>
      <p className="mt-1 text-sm font-medium text-[#1B3A2D]">
        {metric} cannot be calculated accurately yet.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#1B3A2D]/80">
        {requiredSteps.slice(0, 3).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {href ? (
        <Link
          href={href}
          className="mt-3 inline-block text-sm font-semibold text-[#1B3A2D] underline-offset-2 hover:underline"
        >
          {hrefLabel ?? "Complete setup"} →
        </Link>
      ) : null}
    </div>
  );
}

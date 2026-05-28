"use client";

import { memo } from "react";
import type { ConfidenceBadge } from "@/lib/exportPreflight";

const BADGE_COPY: Record<ConfidenceBadge, string> = {
  "slides-validated": "Slides validated",
  "export-optimized": "Export optimized",
  "cloud-synced": "Backed up",
  "instagram-ready": "Ready for Instagram",
};

type CreatorConfidenceProps = {
  badges: ConfidenceBadge[];
};

function CreatorConfidence({ badges }: CreatorConfidenceProps) {
  if (badges.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Creator confidence signals">
      {badges.slice(0, 4).map((id) => (
        <span
          key={id}
          className="rounded-full border border-[#f7c600]/15 bg-[#f7c600]/5 px-2.5 py-1 text-[10px] font-semibold text-zinc-500"
        >
          {BADGE_COPY[id]}
        </span>
      ))}
    </div>
  );
}

export default memo(CreatorConfidence);

"use client";

import { memo, useMemo } from "react";
import { detectCarouselCampaign } from "@/lib/carousel-renderer/campaign-engine";
import { FRESH_FEELGOOD_THEME } from "@/lib/carousel-renderer/campaigns/fresh-feelgood-food";
import { buildHeroSelectionReport } from "@/lib/carousel-renderer/hero-engine";
import { getTemplate } from "@/lib/carousel-renderer/template-engine";
import type { PhotoAsset } from "@/lib/story-engine/types";

type HeroRankingDebugProps = {
  photos: PhotoAsset[];
  className?: string;
};

function HeroRankingDebug({ photos, className = "" }: HeroRankingDebugProps) {
  const campaign = useMemo(() => detectCarouselCampaign(photos), [photos]);

  const report = useMemo(() => {
    if (photos.length === 0) return null;
    const template = getTemplate("doodle-cafe");
    return buildHeroSelectionReport(photos, template.slides);
  }, [photos]);

  if (!report || report.rankings.length === 0) {
    return (
      <section
        className={`rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs text-white/50 ${className}`}
      >
        <p className="font-semibold text-white/70">Hero Selection Engine</p>
        <p className="mt-1">Upload photos to see ranking and role picks.</p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-white/80 ${className}`}
      aria-label="Hero selection debug"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-bold uppercase tracking-wide text-amber-200/90">
          Hero Selection Engine
        </p>
        <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-amber-100/70">
          DEBUG
        </span>
      </div>

      <p className="mb-2 text-[11px] text-white/55">
        {campaign ? (
          <>
            Active campaign: <span className="text-amber-200">{FRESH_FEELGOOD_THEME}</span>
            . Each slide uses its own doodle narrative — not one shared prompt.
          </>
        ) : (
          <>
            Photos are ranked by overall creative strength, then assigned to narrative roles
            (hook first). Slide 1 is never “photo 1” by default.
          </>
        )}
      </p>

      {campaign && (
        <>
          <h4 className="mb-1.5 font-semibold text-white/90">Doodle narratives (per slide)</h4>
          <ul className="mb-3 max-h-48 space-y-1.5 overflow-y-auto">
            {campaign.slides.map((spec) => (
              <li
                key={spec.dishId}
                className="rounded-lg border border-amber-500/15 bg-black/20 px-2 py-1.5"
              >
                <p className="font-medium text-amber-100/90">
                  Slide {spec.index}: {spec.title}
                </p>
                <p className="mt-0.5 line-clamp-3 text-[10px] text-white/45">
                  {spec.doodlePrompt.slice(0, 160)}…
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <h4 className="mb-1.5 font-semibold text-white/90">Photo ranking</h4>
      <ol className="mb-3 space-y-1.5">
        {report.rankings.map((row) => (
          <li key={row.photoId} className="rounded-lg bg-black/25 px-2 py-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-white">
                {row.rank}. {row.displayName}
              </span>
              <span className="shrink-0 font-mono text-amber-200">
                Score {row.overallDisplay}
              </span>
            </div>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[10px] text-white/50">
              {row.reasoning.slice(0, 2).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="mt-1 flex flex-wrap gap-1 font-mono text-[9px] text-white/40">
              <span>hero {Math.round(row.heroScore * 100)}</span>
              <span>· appetite {Math.round(row.appetiteScore * 100)}</span>
              <span>· impact {Math.round(row.visualImpactScore * 100)}</span>
            </div>
          </li>
        ))}
      </ol>

      <h4 className="mb-1.5 font-semibold text-white/90">Role assignment</h4>
      <ul className="space-y-1.5">
        {report.rolePicks.map((pick) => (
          <li
            key={`${pick.role}-${pick.photoId}`}
            className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5"
          >
            <div className="flex justify-between gap-2">
              <span className="font-medium text-amber-100/90">{pick.label}</span>
              <span className="text-right text-white/70">{pick.displayName}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-white/45">{pick.reasoning}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default memo(HeroRankingDebug);

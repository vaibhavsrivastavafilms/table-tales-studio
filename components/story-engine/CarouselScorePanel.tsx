"use client";

import type { CarouselScore, ScoreDimension } from "@/lib/story-engine/types";

type CarouselScorePanelProps = {
  score: CarouselScore | undefined;
};

function dimValue(d: ScoreDimension | number | undefined): number {
  if (d === undefined) return 0;
  if (typeof d === "number") return d;
  return d.score;
}

export default function CarouselScorePanel({ score }: CarouselScorePanelProps) {
  if (!score) return null;

  const rows = [
    { label: "Hook strength", value: dimValue(score.hookStrength) },
    { label: "Curiosity", value: dimValue(score.curiosity) },
    { label: "Readability", value: dimValue(score.readability) },
    { label: "Retention", value: dimValue(score.retention) },
    { label: "Shareability", value: dimValue(score.shareability) },
    { label: "Narrative flow", value: dimValue(score.narrativeFlow) },
    { label: "Emotional impact", value: dimValue(score.emotionalImpact) },
    { label: "Visual cohesion", value: dimValue(score.visualCohesion) },
    { label: "Platform fit", value: dimValue(score.platformFit) },
    { label: "CTA strength", value: dimValue(score.ctaStrength) },
  ];

  const suggestions =
    score.improvements?.length
      ? score.improvements
      : score.suggestions ?? [];

  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#f4c430]">
            Story score
          </p>
          <p className="text-xs text-zinc-500">Explainable scoring engine</p>
        </div>
        <p className="text-3xl font-bold tabular-nums text-white">{score.overall}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between rounded-lg bg-white/5 px-2 py-1">
            <span className="text-zinc-500">{r.label}</span>
            <span className="font-semibold text-zinc-300">{r.value}</span>
          </div>
        ))}
      </div>
      {score.strengths?.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase text-emerald-500/90">Strengths</p>
          <ul className="mt-1 space-y-0.5 text-[10px] text-zinc-400">
            {score.strengths.slice(0, 3).map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {score.priorityFixes?.length ? (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase text-amber-500/90">Priority fixes</p>
          <ul className="mt-1 space-y-0.5 text-[10px] text-zinc-400">
            {score.priorityFixes.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {suggestions.length ? (
        <ul className="mt-3 space-y-1 text-[10px] text-zinc-400">
          {suggestions.map((s) => (
            <li key={s}>· {s}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

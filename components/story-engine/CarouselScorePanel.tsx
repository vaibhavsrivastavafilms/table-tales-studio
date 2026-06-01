"use client";

import type { CarouselScore } from "@/lib/story-engine/types";

type CarouselScorePanelProps = {
  score: CarouselScore | undefined;
};

export default function CarouselScorePanel({ score }: CarouselScorePanelProps) {
  if (!score) return null;

  const rows = [
    { label: "Hook strength", value: score.hookStrength },
    { label: "Curiosity", value: score.curiosity },
    { label: "Readability", value: score.readability },
    { label: "Retention", value: score.retention },
    { label: "Shareability", value: score.shareability },
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#f4c430]">
            Story score
          </p>
          <p className="text-xs text-zinc-500">Carousel scoring engine</p>
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
      {score.suggestions.length ? (
        <ul className="mt-3 space-y-1 text-[10px] text-zinc-400">
          {score.suggestions.map((s) => (
            <li key={s}>· {s}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

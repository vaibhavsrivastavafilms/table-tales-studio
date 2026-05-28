"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "@/lib/analytics";
import { getTemplateConfig } from "@/lib/templates";
import { draftTemplateId } from "@/lib/draftStorage";

type CreatorAnalyticsCardProps = {
  projectCount: number;
};

export default function CreatorAnalyticsCard({
  projectCount,
}: CreatorAnalyticsCardProps) {
  const [summary, setSummary] = useState({
    totalProjects: 0,
    totalExports: 0,
    favoriteTemplate: "street-food",
    aiGenerations: 0,
  });

  useEffect(() => {
    void getAnalyticsSummary(projectCount).then(setSummary);
  }, [projectCount]);

  const favoriteName = getTemplateConfig(
    draftTemplateId(summary.favoriteTemplate)
  ).name;

  const stats = [
    { label: "Projects", value: summary.totalProjects },
    { label: "Exports", value: summary.totalExports },
    { label: "AI runs", value: summary.aiGenerations },
  ];

  return (
    <section className="mb-6 rounded-[40px] bg-[#0b0f1a] p-6 ring-1 ring-white/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
        Creator analytics
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-center"
          >
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Favorite template:{" "}
        <span className="font-semibold text-[#f7c600]">{favoriteName}</span>
      </p>
    </section>
  );
}

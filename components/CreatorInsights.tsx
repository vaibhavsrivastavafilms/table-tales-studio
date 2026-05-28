"use client";

import { memo, useMemo } from "react";
import { useCreatorMemory, useIsClient } from "@/lib/clientHooks";
import { getTemplateConfig } from "@/lib/templates";
import { HOOK_CATEGORIES } from "@/lib/viralHooks";

function CreatorInsights() {
  const isClient = useIsClient();
  const mem = useCreatorMemory();

  const insights = useMemo(
    () =>
      isClient
        ? {
            favoriteTemplate: mem.preferredTemplateId,
            topWorkflow: mem.recentWorkflows[0]?.label ?? null,
            exportsThisWeek: mem.exportsThisWeek,
            strongestHookCategory: mem.strongestHookCategory,
            storytellingStyle: mem.storytellingStyle,
            captionTone: mem.captionTone,
          }
        : null,
    [isClient, mem]
  );

  if (!isClient || !insights) {
    return (
      <section
        className="mb-4 h-20 animate-pulse rounded-2xl border border-zinc-800/80 bg-black/30"
        aria-hidden
      />
    );
  }

  const templateLabel = insights.favoriteTemplate
    ? getTemplateConfig(insights.favoriteTemplate).name
    : "Not set yet";

  const hookLabel =
    HOOK_CATEGORIES.find((c) => c.id === insights.strongestHookCategory)
      ?.label ?? "Exploring";

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800/80 bg-black/30 px-4 py-3 ring-1 ring-white/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]/80">
        Creator intelligence
      </p>
      <ul className="mt-2 grid gap-1 text-xs text-zinc-400 sm:grid-cols-2">
        <li>
          <span className="text-zinc-600">Template · </span>
          {templateLabel}
        </li>
        <li>
          <span className="text-zinc-600">Workflow · </span>
          {insights.topWorkflow ?? "Custom sessions"}
        </li>
        <li>
          <span className="text-zinc-600">Exports this week · </span>
          {insights.exportsThisWeek}
        </li>
        <li>
          <span className="text-zinc-600">Hook strength · </span>
          {hookLabel}
        </li>
        <li className="sm:col-span-2">
          <span className="text-zinc-600">Story style · </span>
          {insights.storytellingStyle} · {insights.captionTone} tone
        </li>
      </ul>
    </section>
  );
}

export default memo(CreatorInsights);

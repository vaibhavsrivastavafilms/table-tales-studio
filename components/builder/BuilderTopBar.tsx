"use client";

import { memo } from "react";

type BuilderTopBarProps = {
  pipelineStatus?: "idle" | "loading" | "ready" | "partial" | "fallback";
};

function BuilderTopBar({ pipelineStatus = "idle" }: BuilderTopBarProps) {
  const statusText =
    pipelineStatus === "loading"
      ? "Composing carousel…"
      : pipelineStatus === "ready"
        ? "Art direction applied"
        : pipelineStatus === "partial"
          ? "Partial AI overlays"
          : null;

  return (
    <header className="builder-topbar flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-2.5 md:px-6">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4c430]/15 text-sm font-bold text-[#f4c430]"
          aria-hidden
        >
          ◈
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">
            Table Tales Studio
          </p>
          <p className="text-[10px] text-zinc-600">
            AI carousel director
          </p>
        </div>
      </div>
      {statusText && (
        <p
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            pipelineStatus === "loading" ? "text-[#f4c430]" : "text-zinc-500"
          }`}
        >
          {statusText}
        </p>
      )}
    </header>
  );
}

export default memo(BuilderTopBar);

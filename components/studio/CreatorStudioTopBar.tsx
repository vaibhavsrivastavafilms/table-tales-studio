"use client";

import Link from "next/link";
import { memo } from "react";
import TableTalesLogo from "@/components/brand/TableTalesLogo";

type CreatorStudioTopBarProps = {
  saveLabel?: string | null;
  onExport?: () => void;
  onTemplates?: () => void;
  onHistory?: () => void;
  onSettings?: () => void;
};

function CreatorStudioTopBar({
  saveLabel,
  onExport,
  onTemplates,
  onHistory,
  onSettings,
}: CreatorStudioTopBarProps) {
  const navBtn =
    "rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition hover:bg-white/[0.06] hover:text-[#f4c430]";

  return (
    <header className="studio-topbar sticky top-0 z-40 flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="min-w-0">
        <Link href="/" className="group flex items-center gap-3">
          <TableTalesLogo size="xs" className="max-w-[72px]" />
          <span className="text-sm font-bold tracking-tight text-white md:text-base">
            Table Tales Studio
          </span>
        </Link>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          AI Visual Storytelling Engine
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {saveLabel && (
          <span className="hidden rounded-full border border-[#f4c430]/20 bg-[#f4c430]/10 px-2.5 py-1 text-[9px] font-semibold text-[#f4c430] sm:inline">
            {saveLabel}
          </span>
        )}
        <button type="button" onClick={onExport} className={navBtn}>
          Export
        </button>
        <button type="button" onClick={onTemplates} className={navBtn}>
          Templates
        </button>
        <button type="button" onClick={onHistory} className={navBtn}>
          History
        </button>
        <button type="button" onClick={onSettings} className={navBtn}>
          Settings
        </button>
        <Link
          href="/dashboard"
          className="hidden rounded-lg border border-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition hover:text-white md:inline"
        >
          Projects
        </Link>
      </div>
    </header>
  );
}

export default memo(CreatorStudioTopBar);

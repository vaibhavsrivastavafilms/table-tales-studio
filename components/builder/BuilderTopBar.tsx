"use client";

import { memo } from "react";
import TableTalesLogo from "@/components/brand/TableTalesLogo";

type BuilderTopBarProps = {
  carouselReady?: boolean;
};

function BuilderTopBar({ carouselReady = false }: BuilderTopBarProps) {
  return (
    <header className="builder-topbar flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-2.5 md:px-6">
      <div className="flex items-center gap-2.5">
        <TableTalesLogo size="xs" className="max-w-[72px]" />
        <div>
          <p className="text-sm font-bold tracking-tight text-white">
            Table Tales Studio
          </p>
          <p className="text-[10px] text-zinc-600">AI carousel director</p>
        </div>
      </div>
      {carouselReady && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Ready
        </p>
      )}
    </header>
  );
}

export default memo(BuilderTopBar);

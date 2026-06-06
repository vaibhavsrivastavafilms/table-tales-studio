"use client";

import { memo } from "react";

function BuilderEmptyWorkspace() {
  return (
    <div className="builder-empty flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="builder-empty-frames mb-8 grid grid-cols-3 gap-2" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="builder-empty-frame aspect-[4/5] w-[52px] rounded-lg border border-white/[0.08] bg-white/[0.02] sm:w-[60px]"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <p className="text-sm font-semibold tracking-tight text-white">
        Drop food photos
      </p>
      <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-zinc-500">
        AI will direct the carousel
      </p>
    </div>
  );
}

export default memo(BuilderEmptyWorkspace);

"use client";

import { memo } from "react";
import type { WelcomeBackMessage } from "@/lib/creatorMemory";

type CreatorWelcomeProps = {
  message: WelcomeBackMessage | null;
  onDismiss: () => void;
};

function CreatorWelcome({ message, onDismiss }: CreatorWelcomeProps) {
  if (!message) return null;

  return (
    <div className="creator-welcome mb-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-[#0b0f1a]/90 p-4 ring-1 ring-[#f7c600]/25 md:mb-6 md:rounded-3xl md:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
          Creator memory
        </p>
        <h2 className="mt-1 text-lg font-bold text-white md:text-xl">
          {message.headline}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-zinc-400">{message.subline}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
      >
        Dismiss
      </button>
    </div>
  );
}

export default memo(CreatorWelcome);

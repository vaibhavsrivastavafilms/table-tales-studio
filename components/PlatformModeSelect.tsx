"use client";

import { memo } from "react";
import { PLATFORM_MODES, type PlatformModeId } from "@/lib/platformModes";

type PlatformModeSelectProps = {
  value: PlatformModeId;
  onChange: (mode: PlatformModeId) => void;
};

function PlatformModeSelect({ value, onChange }: PlatformModeSelectProps) {
  return (
    <label className="mb-4 block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Platform mode
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PlatformModeId)}
        className="mt-1 w-full min-h-[44px] rounded-2xl bg-[#1a1f2e] p-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-[#f7c600]/40"
      >
        {PLATFORM_MODES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default memo(PlatformModeSelect);

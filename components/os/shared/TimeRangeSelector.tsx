"use client";

import {
  TIME_RANGE_OPTIONS,
  type TimeRangeKey,
} from "@/lib/os/analytics/time-intelligence";
import { cn } from "@/lib/utils";

export default function TimeRangeSelector({
  value,
  onChange,
  className,
}: {
  value: TimeRangeKey;
  onChange: (key: TimeRangeKey) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1 rounded-full border border-[var(--os-border)] p-0.5", className)}>
      {TIME_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:text-xs",
            value === opt.key
              ? "bg-[#1B3A2D] text-[#FDF6EC]"
              : "text-[var(--os-fg-muted-on-card)] hover:bg-black/5"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

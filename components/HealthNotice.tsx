"use client";

import { memo, useEffect, useState } from "react";
import { getHealthWarnings, type HealthSignal } from "@/lib/health";

function HealthNotice() {
  const [signals, setSignals] = useState<HealthSignal[]>([]);

  useEffect(() => {
    const tick = () => setSignals(getHealthWarnings());
    tick();
    const id = setInterval(tick, 12_000);
    return () => clearInterval(id);
  }, []);

  if (signals.length === 0) return null;

  return (
    <div className="mb-3 space-y-1" role="status">
      {signals.map((s) => (
        <p
          key={s.id}
          className={`text-[10px] leading-snug ${
            s.severity === "warn" ? "text-amber-200/80" : "text-zinc-500"
          }`}
        >
          {s.message}
        </p>
      ))}
    </div>
  );
}

export default memo(HealthNotice);

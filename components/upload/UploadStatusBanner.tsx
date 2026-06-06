"use client";

import { memo } from "react";
import {
  type UploadUiPhase,
  uploadUiPhaseLabel,
} from "@/lib/uploadState";

type UploadStatusBannerProps = {
  phase: UploadUiPhase;
  errorMessage?: string | null;
  onRetry?: () => void;
};

function UploadStatusBanner({
  phase,
  errorMessage,
  onRetry,
}: UploadStatusBannerProps) {
  if (phase === "idle") return null;

  const label = uploadUiPhaseLabel(phase);
  const isFailed = phase === "failed";

  return (
    <div
      className={`mt-2 overflow-hidden rounded-xl ${
        isFailed ? "border border-red-500/30 bg-red-950/40" : "bg-zinc-900"
      }`}
      role="status"
      aria-live="polite"
    >
      {!isFailed && (
        <div className="h-1.5 w-full animate-pulse bg-gradient-to-r from-[#f7c600]/20 via-[#f7c600] to-[#f7c600]/20" />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <p
          className={`text-xs ${isFailed ? "text-red-200/90" : "text-zinc-400"}`}
        >
          {isFailed ? errorMessage || uploadUiPhaseLabel("failed") : label}
        </p>
        {isFailed && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#f4c430] hover:border-[#f4c430]/40"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(UploadStatusBanner);

"use client";

import { memo, useState } from "react";
import { saveFeedbackSignal } from "@/lib/aiFeedback";

type ExportFeedbackPromptProps = {
  exportId: string;
  onDismiss: () => void;
};

function ExportFeedbackPrompt({ exportId, onDismiss }: ExportFeedbackPromptProps) {
  const [performedWell, setPerformedWell] = useState<boolean | null>(null);
  const [captionUseful, setCaptionUseful] = useState<boolean | null>(null);
  const [improve, setImprove] = useState<boolean | null>(null);

  const submit = () => {
    saveFeedbackSignal({
      exportId,
      performedWell,
      captionUseful,
      improveSuggestions: improve,
    });
    onDismiss();
  };

  return (
    <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 ring-1 ring-[#f7c600]/10">
      <p className="text-xs font-bold text-white">Quick feedback — shape your AI</p>
      <p className="mt-1 text-[10px] text-zinc-500">
        Did this export perform well on Instagram?
      </p>
      <FeedbackRow
        label="Performed well?"
        value={performedWell}
        onChange={setPerformedWell}
      />
      <FeedbackRow
        label="Captions useful?"
        value={captionUseful}
        onChange={setCaptionUseful}
      />
      <FeedbackRow
        label="Improve future suggestions?"
        value={improve}
        onChange={setImprove}
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          className="btn-press flex-1 rounded-lg bg-[#f7c600]/20 py-2 text-xs font-semibold text-[#f7c600]"
        >
          Save feedback
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="btn-press rounded-lg px-3 py-2 text-xs text-zinc-500"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function FeedbackRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <div className="flex gap-1">
        {(["Yes", "No"] as const).map((text, i) => {
          const v = i === 0;
          return (
            <button
              key={text}
              type="button"
              onClick={() => onChange(v)}
              className={`btn-press rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                value === v
                  ? "bg-[#f7c600] text-black"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ExportFeedbackPrompt);

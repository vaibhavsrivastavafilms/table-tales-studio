"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import type { StockOcrResult } from "@/lib/os/procurement/types";

type StockOcrPanelProps = {
  kind: "opening" | "closing";
  title: string;
  onSaved?: () => void;
};

export default function StockOcrPanel({ kind, title, onSaved }: StockOcrPanelProps) {
  const {
    matchStockLines,
    applyOpeningStockOcr,
    applyClosingStockOcr,
  } = useProcurement();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<StockOcrResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/os/procurement/stock-ocr", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { result: StockOcrResult };
      const matched = {
        ...data.result,
        lines: matchStockLines(data.result.lines),
      };
      setPreview(matched);
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!preview) return;
    if (kind === "opening") {
      applyOpeningStockOcr(preview.date, preview.lines);
    } else {
      applyClosingStockOcr(preview.date, preview.lines);
    }
    setPreview(null);
    onSaved?.();
  }

  return (
    <div className="os-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--os-fg-on-card)]">{title}</p>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          Scan sheet
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void processFile(file);
        }}
      />
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--os-fg-muted-on-card)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Extracting stock lines…
        </div>
      ) : null}
      {preview ? (
        <div className="space-y-3">
          <p className="text-xs text-[var(--os-fg-muted-on-card)]">
            Date: {preview.date} · {preview.lines.length} items
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-[var(--os-fg-on-card)]">
            {preview.lines.map((line, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {line.itemName}
                  {line.matchedItemId ? (
                    <span className="ml-1 text-[10px] text-emerald-600">matched</span>
                  ) : (
                    <span className="ml-1 text-[10px] text-[var(--os-accent)]">unmapped</span>
                  )}
                </span>
                <span className="tabular-nums">
                  {line.quantity} {line.unit}
                </span>
              </li>
            ))}
          </ul>
          <Button onClick={save}>Save {kind} stock</Button>
        </div>
      ) : null}
    </div>
  );
}
